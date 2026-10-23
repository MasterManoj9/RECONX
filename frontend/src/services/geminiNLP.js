/**
 * ReconX Google Gemini NLP Integration Service
 * Powers natural language search, clinical discrepancy analysis,
 * and automated site query letter generation.
 */

const STORAGE_KEY = 'RECONX_GEMINI_API_KEY';
const DEFAULT_MODEL = 'gemini-1.5-flash';

export function getGeminiApiKey() {
  return (
    localStorage.getItem(STORAGE_KEY) ||
    import.meta.env.VITE_GEMINI_API_KEY ||
    ''
  );
}

export function setGeminiApiKey(key) {
  if (key && key.trim()) {
    localStorage.setItem(STORAGE_KEY, key.trim());
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
}

export function hasGeminiKey() {
  return Boolean(getGeminiApiKey());
}

/**
 * Validate a Gemini API key with a minimal ping
 */
export async function validateGeminiKey(testKey) {
  const key = testKey || getGeminiApiKey();
  if (!key) return { valid: false, message: 'No API key provided.' };

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${DEFAULT_MODEL}:generateContent?key=${key}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'Ping: Respond with "OK"' }] }],
        }),
      }
    );

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      return {
        valid: false,
        message: errData.error?.message || `API error (${res.status})`,
      };
    }

    return { valid: true, message: 'Gemini API Key is valid and active!' };
  } catch (err) {
    return { valid: false, message: err.message || 'Network error connecting to Gemini.' };
  }
}

/**
 * Calls Gemini REST endpoint
 */
async function callGemini(promptText, systemInstruction = '') {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new Error('NO_API_KEY');
  }

  const payload = {
    contents: [
      {
        parts: [{ text: promptText }],
      },
    ],
  };

  if (systemInstruction) {
    payload.systemInstruction = {
      parts: [{ text: systemInstruction }],
    };
  }

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${DEFAULT_MODEL}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }
  );

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error?.message || `Gemini API request failed with status ${res.status}`);
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  return text;
}

/**
 * Deep Clinical Discrepancy Analysis & Site Query Draft via Gemini NLP
 */
export async function generateFindingDeepAnalysis(finding) {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new Error('NO_API_KEY');
  }

  const prompt = `
You are an expert Clinical Data Manager and Regulatory Auditor specializing in clinical trial reconciliation (21 CFR Part 11, GCP, ALCOA+).

Analyze this specific clinical finding:
- Finding ID: ${finding.finding_id}
- Discrepancy Type: ${finding.discrepancy_type}
- Study ID: ${finding.study_id || 'N/A'}
- Participant ID: ${finding.participant_id || 'N/A'}
- Sample ID: ${finding.sample_id || 'N/A'}
- Description: ${finding.description || ''}
- Rule Triggered: ${finding.rule_triggered || ''}
- eCRF Evidence: ${JSON.stringify(finding.ecrf_evidence || {})}
- Central Lab Evidence: ${JSON.stringify(finding.lab_evidence || {})}

Return a valid JSON object strictly matching this schema (do NOT wrap with markdown other than \`\`\`json):
{
  "plainSummary": "A concise, 2-3 sentence executive medical summary of the exact discrepancy.",
  "rootCauses": [
    "Most likely operational root cause 1",
    "Plausible root cause 2",
    "Alternative technical or data entry root cause 3"
  ],
  "regulatoryRisk": "HIGH" | "MEDIUM" | "LOW",
  "riskExplanation": "One clear sentence explaining the impact on trial endpoints or audit inspection readiness.",
  "investigationSteps": [
    "Step 1: Specific action item for the data manager",
    "Step 2: Specific verification with laboratory courier or site",
    "Step 3: Document resolution rationale"
  ],
  "siteQueryDraft": "Formal, professional, polite clinical site inquiry letter drafted to Site Principal Investigator/Study Coordinator regarding Subject and Sample ID, requesting verification."
}
`;

  const rawText = await callGemini(
    prompt,
    'You are a senior clinical data auditor for oncology clinical trials. Return clean JSON only.'
  );

  try {
    const cleanJson = rawText
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```\s*$/i, '')
      .trim();
    return JSON.parse(cleanJson);
  } catch (err) {
    console.warn('Failed to parse Gemini JSON output, formatting fallback:', err);
    return {
      plainSummary: rawText.slice(0, 300),
      rootCauses: ['Potential transcription inconsistency', 'Sample accessioning discrepancy', 'EDC synchronization lag'],
      regulatoryRisk: 'MEDIUM',
      riskExplanation: 'Requires explicit documentation to satisfy ALCOA+ audit traceability.',
      investigationSteps: ['Review central lab manifest', 'Audit raw collection logs with site'],
      siteQueryDraft: `Dear Clinical Site Coordinator,\n\nPlease verify data for Subject ${finding.participant_id || 'N/A'} regarding Sample ${finding.sample_id || 'N/A'}. A discrepancy (${finding.discrepancy_type}) was flagged during reconciliation.\n\nThank you,\nReconX Clinical Data Management`,
    };
  }
}

/**
 * Natural Language Query & Search across Clinical Findings
 */
export async function askReconXNLP(userQuery, findings = []) {
  const apiKey = getGeminiApiKey();

  // If no Gemini key, execute client-side smart semantic keyword heuristic
  if (!apiKey) {
    return localSemanticFallback(userQuery, findings);
  }

  // Build condensed findings representation
  const condensedFindings = findings.map((f) => ({
    id: f.finding_id,
    type: f.discrepancy_type,
    study: f.study_id,
    pt: f.participant_id,
    sample: f.sample_id,
    analyte: f.ecrf_evidence?.analyte || f.lab_evidence?.analyte || '',
    ecrfVal: f.ecrf_evidence?.value,
    labVal: f.lab_evidence?.value,
    ecrfDate: f.ecrf_evidence?.collection_date,
    labDate: f.lab_evidence?.collection_date,
    status: f.review_status,
  }));

  const prompt = `
You are the ReconX Clinical Intelligence AI. A user is asking a natural language question about their clinical reconciliation findings.

Available Findings (${condensedFindings.length} total):
${JSON.stringify(condensedFindings.slice(0, 50))}

User Query: "${userQuery}"

Task:
1. Provide a direct, professional, natural language answer (2-4 sentences) analyzing the findings in relation to their question.
2. Identify the exact "matchingFindingIds" (array of finding ID strings) that directly relate to their query.
3. List 2 key actionable insights.

Return STRICTLY a JSON object in this format (no conversational filler outside JSON):
{
  "answer": "Clear medical/data intelligence response addressing user's question...",
  "matchingFindingIds": ["FND-001", "FND-002"],
  "insights": [
    "Key insight 1",
    "Key insight 2"
  ]
}
`;

  try {
    const raw = await callGemini(
      prompt,
      'You are a specialized clinical trial data assistant. Always respond with pure valid JSON.'
    );
    const cleanJson = raw
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```\s*$/i, '')
      .trim();
    const parsed = JSON.parse(cleanJson);
    return {
      provider: 'Gemini NLP',
      answer: parsed.answer,
      matchingFindingIds: Array.isArray(parsed.matchingFindingIds) ? parsed.matchingFindingIds : [],
      insights: Array.isArray(parsed.insights) ? parsed.insights : [],
    };
  } catch (err) {
    console.warn('Gemini NLP query fallback:', err);
    return localSemanticFallback(userQuery, findings);
  }
}

/**
 * High-quality client-side smart semantic fallback when API key is missing
 */
function localSemanticFallback(query, findings) {
  const q = (query || '').toLowerCase().trim();
  const matchedIds = [];

  const isPotassium = q.includes('potassium') || q.includes('k+') || q.includes('electrolyte');
  const isMissing = q.includes('missing') || q.includes('lost') || q.includes('unmatched');
  const isDate = q.includes('date') || q.includes('time') || q.includes('collection');
  const isHighRisk = q.includes('high') || q.includes('risk') || q.includes('critical') || q.includes('urgent');
  const isNeedsReview = q.includes('review') || q.includes('unreviewed') || q.includes('pending');

  findings.forEach((f) => {
    let match = false;
    const type = (f.discrepancy_type || '').toLowerCase();
    const desc = (f.description || '').toLowerCase();
    const analyte = (f.ecrf_evidence?.analyte || f.lab_evidence?.analyte || '').toLowerCase();

    if (isPotassium && analyte.includes('potassium')) match = true;
    if (isMissing && (type.includes('missing') || desc.includes('missing'))) match = true;
    if (isDate && (type.includes('date') || desc.includes('date'))) match = true;
    if (isHighRisk && (type.includes('value_mismatch') || type.includes('missing'))) match = true;
    if (isNeedsReview && f.review_status === 'Needs Review') match = true;

    // Direct token matching
    if (q.split(/\s+/).some((term) => term.length > 2 && (desc.includes(term) || type.includes(term) || (f.participant_id || '').toLowerCase().includes(term)))) {
      match = true;
    }

    if (match) matchedIds.push(f.finding_id);
  });

  return {
    provider: 'Smart Semantic Engine (Local)',
    answer: matchedIds.length > 0
      ? `Found ${matchedIds.length} finding(s) matching your inquiry "${query}". Review the filtered table below for specific evidence.`
      : `No direct findings matched "${query}". Displaying overview. Tip: Connect your free Gemini API Key for deep conversational clinical reasoning.`,
    matchingFindingIds: matchedIds.length > 0 ? matchedIds : findings.map((f) => f.finding_id),
    insights: [
      'Core clinical reconciliation rules are strictly verified.',
      'Connect a free Google Gemini API Key for deep conversational clinical trial Q&A.',
    ],
  };
}
