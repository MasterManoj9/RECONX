import { useState } from 'react';
import { 
  X, 
  ShieldAlert, 
  ArrowRight, 
  Database,
  Sparkles,
  Copy,
  Check,
  Mail
} from 'lucide-react';

import { fetchFindingExplanation } from '../services/api';
import { generateFindingDeepAnalysis, hasGeminiKey } from '../services/geminiNLP';

const PERMITTED_DECISIONS = [
  'Confirmed discrepancy',
  'Requires further investigation',
  'Not a discrepancy, with justification',
  'Resolved after external verification',
];

export default function FindingDetail({ finding, onClose, onReviewSubmitted, onOpenAISettings }) {
  const [decision, setDecision] = useState(
    finding.review_status !== 'Needs Review' ? finding.review_status : 'Confirmed discrepancy'
  );
  const [rationale, setRationale] = useState(finding.reviewer_rationale || '');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // AI Explanation state
  const [aiExplanation, setAiExplanation] = useState(null);
  const [geminiAnalysis, setGeminiAnalysis] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);
  const [copiedQuery, setCopiedQuery] = useState(false);

  const handleRequestAiExplanation = async () => {
    try {
      setAiLoading(true);
      setAiError(null);

      // Check if Gemini API Key is available
      if (hasGeminiKey()) {
        const geminiRes = await generateFindingDeepAnalysis(finding);
        setGeminiAnalysis(geminiRes);
      } else {
        // Fallback to rule-based assistant
        const res = await fetchFindingExplanation({
          finding_id: finding.finding_id,
          discrepancy_type: finding.discrepancy_type,
          rule_triggered: finding.rule_triggered,
          study_id: finding.study_id,
          participant_id: finding.participant_id,
          sample_id: finding.sample_id,
          description: finding.description,
          ecrf_evidence: finding.ecrf_evidence,
          lab_evidence: finding.lab_evidence,
          is_missing_record: !finding.ecrf_evidence || !finding.lab_evidence,
        });
        setAiExplanation(res);
      }
    } catch (err) {
      console.warn('AI Explanation error, attempting fallback:', err);
      try {
        const fallbackRes = await fetchFindingExplanation(finding);
        setAiExplanation(fallbackRes);
      } catch {
        setAiError(err.message || 'Failed to generate AI analysis.');
      }
    } finally {
      setAiLoading(false);
    }
  };

  const handleCopyQuery = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedQuery(true);
    setTimeout(() => setCopiedQuery(false), 2000);
  };

  if (!finding) return null;

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!rationale.trim()) {
      setErrorMsg('A clear reviewer rationale is required before recording a decision.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg(null);
      await onReviewSubmitted({
        findingId: finding.finding_id,
        decision,
        reviewerId: 'Clinical Data Reviewer',
        rationale: rationale.trim(),
      });
      setSuccessMsg('Human review decision successfully recorded in the audit trail.');
    } catch (err) {
      setErrorMsg(err.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const ecrf = finding.ecrf_evidence;
  const lab = finding.lab_evidence;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      right: 0,
      bottom: 0,
      width: '580px',
      maxWidth: '100vw',
      backgroundColor: '#fff',
      boxShadow: '-4px 0 24px rgba(0,0,0,0.18)',
      zIndex: 50,
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Top Header */}
      <div style={{
        padding: '20px 24px',
        borderBottom: '1px solid var(--slate-200)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'var(--slate-50)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span className="mono" style={{ fontSize: '15px', fontWeight: 700 }}>{finding.finding_id}</span>
          <span className="badge badge-neutral">{finding.discrepancy_type}</span>
          <span className={`badge ${finding.severity === 'HIGH' ? 'badge-danger' : finding.severity === 'MEDIUM' ? 'badge-warning' : 'badge-info'}`}>
            {finding.severity}
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          style={{
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            padding: '4px',
            color: 'var(--slate-400)',
          }}
        >
          <X size={20} />
        </button>
      </div>

      {/* Main Body */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
      }}>
        {/* Discrepancy Statement */}
        <div>
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--slate-400)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
            Flagged Discrepancy
          </div>
          <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--navy-900)', lineHeight: 1.4 }}>
            {finding.description}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--slate-500)', marginTop: '4px' }}>
            Rule Triggered: <span className="mono" style={{ color: 'var(--navy-800)' }}>{finding.rule_triggered}</span>
          </div>
        </div>

        {/* Key Metadata Table */}
        <div style={{
          backgroundColor: 'var(--slate-50)',
          border: '1px solid var(--slate-200)',
          borderRadius: 'var(--radius-md)',
          padding: '12px 16px',
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '12px',
        }}>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--slate-400)' }}>Study ID</div>
            <div className="mono" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--navy-900)' }}>{finding.study_id || '—'}</div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--slate-400)' }}>Participant ID</div>
            <div className="mono" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--navy-900)' }}>{finding.participant_id || '—'}</div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--slate-400)' }}>Sample ID</div>
            <div className="mono" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--navy-900)' }}>{finding.sample_id || '—'}</div>
          </div>
        </div>

        {/* Evidence Side-by-Side Comparison */}
        <div>
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--slate-400)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
            Data Evidence Comparison
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {/* eCRF Evidence */}
            <div style={{
              border: '1px solid var(--slate-200)',
              borderRadius: 'var(--radius-md)',
              padding: '14px',
              backgroundColor: ecrf ? '#fff' : 'var(--slate-50)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
                <Database size={16} color="var(--teal-600)" />
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--navy-900)' }}>eCRF Record</span>
                {ecrf && <span className="mono" style={{ fontSize: '11px', color: 'var(--slate-400)', marginLeft: 'auto' }}>Row {ecrf.row_number}</span>}
              </div>

              {ecrf ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
                  <div>
                    <span style={{ color: 'var(--slate-400)' }}>Analyte: </span>
                    <span style={{ fontWeight: 600, color: 'var(--navy-800)' }}>{ecrf.analyte || '—'}</span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--slate-400)' }}>Result Value: </span>
                    <span className="mono" style={{ fontWeight: 600, color: 'var(--navy-900)' }}>{ecrf.value || '—'}</span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--slate-400)' }}>Unit: </span>
                    <span style={{ color: 'var(--navy-800)' }}>{ecrf.unit || '—'}</span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--slate-400)' }}>Collection Date: </span>
                    <span className="mono" style={{ color: 'var(--navy-800)' }}>{ecrf.collection_date || '—'}</span>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--rose-600)', fontSize: '12px', padding: '12px 0' }}>
                  <ShieldAlert size={16} />
                  <span>No record found in eCRF</span>
                </div>
              )}
            </div>

            {/* Central Lab Evidence */}
            <div style={{
              border: '1px solid var(--slate-200)',
              borderRadius: 'var(--radius-md)',
              padding: '14px',
              backgroundColor: lab ? '#fff' : 'var(--slate-50)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
                <Database size={16} color="var(--indigo-600)" />
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--navy-900)' }}>Central Lab</span>
                {lab && <span className="mono" style={{ fontSize: '11px', color: 'var(--slate-400)', marginLeft: 'auto' }}>Row {lab.row_number}</span>}
              </div>

              {lab ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
                  <div>
                    <span style={{ color: 'var(--slate-400)' }}>Analyte: </span>
                    <span style={{ fontWeight: 600, color: 'var(--navy-800)' }}>{lab.analyte || '—'}</span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--slate-400)' }}>Result Value: </span>
                    <span className="mono" style={{ fontWeight: 600, color: 'var(--navy-900)' }}>{lab.value || '—'}</span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--slate-400)' }}>Unit: </span>
                    <span style={{ color: 'var(--navy-800)' }}>{lab.unit || '—'}</span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--slate-400)' }}>Collection Date: </span>
                    <span className="mono" style={{ color: 'var(--navy-800)' }}>{lab.collection_date || '—'}</span>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--rose-600)', fontSize: '12px', padding: '12px 0' }}>
                  <ShieldAlert size={16} />
                  <span>No accession in Central Lab</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recommended Investigation Step */}
        <div style={{
          backgroundColor: 'var(--teal-50)',
          border: '1px solid var(--teal-200)',
          borderRadius: 'var(--radius-md)',
          padding: '14px 16px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--teal-600)', fontWeight: 600, fontSize: '12px', marginBottom: '4px' }}>
            <ArrowRight size={14} />
            <span>Recommended Investigation Step</span>
          </div>
          <div style={{ fontSize: '13px', color: 'var(--navy-800)', lineHeight: 1.4 }}>
            {finding.suggested_investigation_step}
          </div>
        </div>

        {/* AI Clinical Assistant (Powered by Google Gemini NLP) */}
        <div style={{
          border: '1px solid rgba(20, 184, 166, 0.35)',
          borderRadius: 'var(--radius-md)',
          padding: '16px',
          backgroundColor: '#f8fafc',
          boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '3px 8px',
                borderRadius: '6px',
                backgroundColor: 'rgba(20, 184, 166, 0.12)',
                color: '#0d9488',
                fontSize: '11px',
                fontWeight: 700,
              }}>
                <Sparkles size={14} />
                <span>Gemini NLP Clinical Assistant</span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {onOpenAISettings && (
                <button
                  type="button"
                  onClick={onOpenAISettings}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    fontSize: '11px',
                    color: '#64748b',
                    textDecoration: 'underline',
                  }}
                >
                  {hasGeminiKey() ? 'API Key Active' : 'Set Gemini Key'}
                </button>
              )}
              {!geminiAnalysis && !aiExplanation && (
                <button
                  type="button"
                  onClick={handleRequestAiExplanation}
                  disabled={aiLoading}
                  className="btn btn-primary"
                  style={{ fontSize: '12px', padding: '5px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Sparkles size={14} />
                  <span>{aiLoading ? 'Analyzing NLP...' : 'Run Gemini Analysis'}</span>
                </button>
              )}
            </div>
          </div>

          {aiError && (
            <div style={{ fontSize: '12px', color: 'var(--rose-600)', marginBottom: '8px' }}>
              {aiError}
            </div>
          )}

          {/* 1. Deep Gemini NLP Output */}
          {geminiAnalysis ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '12px' }}>
              {/* Executive Summary */}
              <div style={{ padding: '10px 14px', backgroundColor: '#eff6ff', borderRadius: '8px', borderLeft: '4px solid #3b82f6' }}>
                <div style={{ fontWeight: 700, color: '#1e40af', marginBottom: '2px' }}>Executive Clinical Summary</div>
                <div style={{ color: '#1e293b', lineHeight: 1.5 }}>{geminiAnalysis.plainSummary}</div>
              </div>

              {/* Regulatory Risk Rating */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '8px 12px',
                borderRadius: '8px',
                backgroundColor: geminiAnalysis.regulatoryRisk === 'HIGH' ? '#fff1f2' : '#fefce8',
                border: `1px solid ${geminiAnalysis.regulatoryRisk === 'HIGH' ? '#fecdd3' : '#fef08a'}`,
              }}>
                <span className={`badge ${geminiAnalysis.regulatoryRisk === 'HIGH' ? 'badge-danger' : 'badge-warning'}`}>
                  {geminiAnalysis.regulatoryRisk} REGULATORY RISK
                </span>
                <span style={{ color: '#475569', fontSize: '12px' }}>{geminiAnalysis.riskExplanation}</span>
              </div>

              {/* Probable Root Causes */}
              <div>
                <strong style={{ color: 'var(--navy-900)' }}>Probable Root Causes (NLP Synthesized):</strong>
                <ul style={{ paddingLeft: '18px', marginTop: '4px', color: '#334155', lineHeight: 1.5 }}>
                  {geminiAnalysis.rootCauses?.map((c, i) => (
                    <li key={i}>{c}</li>
                  ))}
                </ul>
              </div>

              {/* Investigation Next Steps */}
              <div>
                <strong style={{ color: 'var(--navy-900)' }}>Actionable Investigation Next Steps:</strong>
                <ol style={{ paddingLeft: '18px', marginTop: '4px', color: '#334155', lineHeight: 1.5 }}>
                  {geminiAnalysis.investigationSteps?.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ol>
              </div>

              {/* Draft Site Query Letter with 1-click Copy */}
              {geminiAnalysis.siteQueryDraft && (
                <div style={{
                  marginTop: '6px',
                  padding: '12px',
                  borderRadius: '8px',
                  backgroundColor: '#f1f5f9',
                  border: '1px solid #cbd5e1',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: '#334155' }}>
                      <Mail size={14} color="#0d9488" />
                      <span>Draft Site Query Letter</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopyQuery(geminiAnalysis.siteQueryDraft)}
                      style={{
                        padding: '4px 8px',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        backgroundColor: '#fff',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '11px',
                        color: copiedQuery ? '#059669' : '#475569',
                      }}
                    >
                      {copiedQuery ? <Check size={12} color="#059669" /> : <Copy size={12} />}
                      <span>{copiedQuery ? 'Copied!' : 'Copy Query'}</span>
                    </button>
                  </div>
                  <pre style={{
                    margin: 0,
                    whiteSpace: 'pre-wrap',
                    fontFamily: 'inherit',
                    fontSize: '11px',
                    color: '#1e293b',
                    lineHeight: 1.5,
                  }}>
                    {geminiAnalysis.siteQueryDraft}
                  </pre>
                </div>
              )}
            </div>
          ) : aiExplanation ? (
            /* 2. Rule-Based Fallback Output */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12px' }}>
              <div style={{ padding: '8px 12px', backgroundColor: '#eff6ff', borderRadius: '4px', borderLeft: '3px solid #3b82f6' }}>
                <strong style={{ color: '#1e40af' }}>Summary:</strong> {aiExplanation.plain_language_summary}
              </div>

              <div>
                <strong style={{ color: 'var(--navy-800)' }}>Facts Supported by Evidence:</strong>
                <ul style={{ paddingLeft: '18px', marginTop: '4px', color: 'var(--navy-700)' }}>
                  {aiExplanation.supported_facts?.map((f, i) => (
                    <li key={i}>{f}</li>
                  ))}
                </ul>
              </div>

              <div>
                <strong style={{ color: 'var(--navy-800)' }}>Hypotheses:</strong>
                <ul style={{ paddingLeft: '18px', marginTop: '4px', color: 'var(--navy-700)' }}>
                  {aiExplanation.hypotheses?.map((h, i) => (
                    <li key={i}>{h}</li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <div style={{ fontSize: '12px', color: 'var(--slate-500)', lineHeight: 1.5 }}>
              Click above to generate deep NLP hypothesis synthesis, regulatory risk assessment, and a pre-drafted site inquiry query.
            </div>
          )}
        </div>

        {/* Human Review Form */}
        <div style={{
          borderTop: '1px solid var(--slate-200)',
          paddingTop: '20px',
        }}>
          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--navy-900)', marginBottom: '12px' }}>
            Human-in-the-Loop Review
          </div>

          {errorMsg && (
            <div style={{
              padding: '10px 14px',
              backgroundColor: 'var(--rose-50)',
              color: 'var(--rose-600)',
              borderRadius: 'var(--radius-md)',
              fontSize: '12px',
              marginBottom: '12px',
            }}>
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div style={{
              padding: '10px 14px',
              backgroundColor: 'var(--emerald-50)',
              color: 'var(--emerald-600)',
              borderRadius: 'var(--radius-md)',
              fontSize: '12px',
              marginBottom: '12px',
            }}>
              {successMsg}
            </div>
          )}

          <form onSubmit={handleSubmitReview} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px', color: 'var(--navy-700)' }}>
                Review Decision:
              </label>
              <select
                className="form-select"
                value={decision}
                onChange={(e) => setDecision(e.target.value)}
              >
                {PERMITTED_DECISIONS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px', color: 'var(--navy-700)' }}>
                Reviewer Rationale & Audit Note:
              </label>
              <textarea
                className="form-textarea"
                rows={3}
                placeholder="Enter clinical data review rationale..."
                value={rationale}
                onChange={(e) => setRationale(e.target.value)}
              />
              <div style={{ fontSize: '11px', color: 'var(--slate-400)', marginTop: '4px' }}>
                Review actions are permanently logged in the audit trail without mutating raw source records.
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
              <button
                type="submit"
                disabled={submitting}
                className="btn btn-primary"
                style={{ flex: 1 }}
              >
                {submitting ? 'Recording Decision...' : 'Record Review Decision'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
