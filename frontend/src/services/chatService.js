/**
 * ReconX AI Assistant Chat Service
 * Supports Google Gemini API with intelligent built-in clinical knowledge fallback.
 */

const STORAGE_KEY = 'RECONX_GEMINI_KEY';
const PRIMARY_MODEL = 'gemini-flash-lite-latest';
const FALLBACK_MODEL = 'gemini-flash-latest';

export function getGeminiKey() {
  return (
    localStorage.getItem(STORAGE_KEY) ||
    import.meta.env.VITE_GEMINI_API_KEY ||
    ''
  );
}

export function setGeminiKey(key) {
  if (key && key.trim()) {
    localStorage.setItem(STORAGE_KEY, key.trim());
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
}

export function hasGeminiKey() {
  return Boolean(getGeminiKey());
}

const SYSTEM_PROMPT = `
You are the ReconX Clinical AI Assistant.
ReconX is an enterprise-grade clinical data intelligence platform designed for clinical data managers, trial monitors, and medical reviewers. It deterministically reconciles synthetic electronic Case Report Form (eCRF) records against Central Laboratory datasets, detects discrepancies across 11 standard clinical categories (such as missing identifiers, date mismatches, unit differences, and value discrepancies), ensures ALCOA+ / 21 CFR Part 11 regulatory compliance, and provides human-in-the-loop adjudication with an immutable audit trail.

Your capabilities:
1. Explain how ReconX works, how to upload datasets, and how to adjudicate findings.
2. Explain clinical trial regulations (FDA 21 CFR Part 11, CDISC, GCP, ALCOA+ data integrity).
3. Explain clinical laboratory parameters, oncology endpoints, collection schedules, and discrepancy root causes.
4. Answer any general question clearly, concisely, and professionally.

Formatting: Use clean markdown with short paragraphs and bullet points where helpful. Keep responses concise and easy to read.
`;

/**
 * Send chat message to Gemini API or smart fallback
 */
export async function sendChatMessage(userMessage, conversationHistory = []) {
  const apiKey = getGeminiKey();

  if (apiKey) {
    // Try primary model first, then fallback model
    const modelsToTry = [PRIMARY_MODEL, FALLBACK_MODEL];

    for (const model of modelsToTry) {
      try {
        // Build conversation contents for Gemini
        const contents = conversationHistory
          .filter((m) => m.id !== 'welcome')
          .map((m) => ({
            role: m.sender === 'user' ? 'user' : 'model',
            parts: [{ text: m.text }],
          }));

        // Add current message
        contents.push({
          role: 'user',
          parts: [{ text: userMessage }],
        });

        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents,
              systemInstruction: {
                parts: [{ text: SYSTEM_PROMPT }],
              },
            }),
          }
        );

        if (res.ok) {
          const data = await res.json();
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            return {
              text: text.trim(),
              source: `gemini (${model})`,
            };
          }
        }
      } catch (err) {
        console.warn(`Gemini call error on ${model}:`, err);
      }
    }
  }

  // Intelligent built-in clinical fallback if no API key or network error
  const fallbackReply = generateSmartFallbackReply(userMessage);
  return {
    text: fallbackReply,
    source: 'built-in clinical engine',
  };
}

function generateSmartFallbackReply(input) {
  const q = (input || '').toLowerCase().trim();

  if (q.includes('what is reconx') || (q.includes('what') && q.includes('reconx'))) {
    return (
      "**ReconX** is an enterprise clinical data intelligence platform. It compares synthetic electronic Case Report Forms (eCRF) against Central Laboratory datasets to detect discrepancies (such as missing samples, collection date divergence, and unit mismatches) with a tamper-evident audit trail under FDA 21 CFR Part 11 & ALCOA+ principles."
    );
  }

  if (q.includes('how') && (q.includes('upload') || q.includes('reconcile') || q.includes('start'))) {
    return (
      "To run a clinical reconciliation:\n" +
      "1. Navigate to **Reconciliation** in the sidebar.\n" +
      "2. Drag & drop your **eCRF dataset** (CSV) and **Central Lab dataset** (CSV), or click **'Load Synthetic Clinical Data'** for instant sample data.\n" +
      "3. Click **'Run Clinical Reconciliation'**.\n" +
      "4. The engine instantly evaluates all 11 discrepancy rules and outputs your findings!"
    );
  }

  if (q.includes('11') || q.includes('rules') || q.includes('discrepancy')) {
    return (
      "ReconX deterministically evaluates **11 clinical discrepancy categories**:\n" +
      "• **MISSING_IDENTIFIER**: Missing study, participant, or sample ID.\n" +
      "• **DUPLICATE_KEY**: Duplicate compound keys in a single source.\n" +
      "• **MISSING_ECRF_RECORD**: Sample accessioned in Lab but missing from eCRF.\n" +
      "• **MISSING_LAB_RECORD**: Sample logged in eCRF but missing from Central Lab.\n" +
      "• **INVALID_DATE**: Malformed or unparseable timestamps.\n" +
      "• **DATE_MISMATCH**: Divergent collection dates between sources.\n" +
      "• **ANALYTE_MISMATCH**: Inconsistent test naming.\n" +
      "• **MISSING_VALUE**: Missing quantitative result values.\n" +
      "• **INVALID_NUMERIC_VALUE**: Non-numeric entries where numbers are expected.\n" +
      "• **UNIT_MISMATCH**: Divergent units of measure without verified conversions.\n" +
      "• **VALUE_MISMATCH**: Numeric delta exceeding configured tolerance threshold."
    );
  }

  if (q.includes('audit') || q.includes('alcoa') || q.includes('21 cfr')) {
    return (
      "**Regulatory Integrity & ALCOA+ Principles**:\n" +
      "ReconX adheres to FDA 21 CFR Part 11 requirements:\n" +
      "• **Attributable**: Every review decision is stamped with the authenticated reviewer's genuine profile.\n" +
      "• **Legible & Contemporaneous**: Decisions are logged with ISO 8601 UTC timestamps.\n" +
      "• **Original**: Source datasets are immutable and never silently overwritten or mutated.\n" +
      "• **Accurate**: Deterministic rule execution guarantees 100% reproducible reconciliation results."
    );
  }

  if (q.includes('hello') || q.includes('hi') || q.includes('hey')) {
    return "Hello! I am your ReconX Assistant. You can ask me how to use the platform, details on clinical reconciliation rules, or anything else you'd like to explore!";
  }

  return (
    `Regarding "${input}": ReconX is designed to assist clinical data managers and medical monitors in trial reconciliation. ` +
    "You can ask me about uploading datasets, discrepancy rules, FDA 21 CFR Part 11 compliance, or click the settings gear above to connect your Google Gemini API key for open-ended conversational intelligence!"
  );
}
