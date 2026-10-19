import { useState } from 'react';
import { 
  X, 
  ShieldAlert, 
  ArrowRight, 
  Database
} from 'lucide-react';

const PERMITTED_DECISIONS = [
  'Confirmed discrepancy',
  'Requires further investigation',
  'Not a discrepancy, with justification',
  'Resolved after external verification',
];

export default function FindingDetail({ finding, onClose, onReviewSubmitted }) {
  const [decision, setDecision] = useState(
    finding.review_status !== 'Needs Review' ? finding.review_status : 'Confirmed discrepancy'
  );
  const [rationale, setRationale] = useState(finding.reviewer_rationale || '');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

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
        reviewerId: 'demo_reviewer_dr_adams',
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
      width: '560px',
      maxWidth: '100vw',
      backgroundColor: '#fff',
      boxShadow: '-4px 0 24px rgba(0,0,0,0.15)',
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

      {/* Scrollable Body */}
      <div style={{ padding: '24px', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Factual Description & Rule */}
        <div>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--slate-400)', fontWeight: 600, marginBottom: '6px' }}>
            Deterministic Finding Rationale
          </div>
          <div style={{ fontSize: '15px', color: 'var(--navy-900)', fontWeight: 500, lineHeight: 1.5 }}>
            {finding.description}
          </div>
          <div style={{
            marginTop: '10px',
            padding: '8px 12px',
            backgroundColor: 'var(--slate-100)',
            borderRadius: 'var(--radius-md)',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <ShieldAlert size={14} color="var(--navy-600)" />
            <span>Rule Triggered: <strong>{finding.rule_triggered}</strong></span>
          </div>
        </div>

        {/* Side-by-Side Source Evidence */}
        <div>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--slate-400)', fontWeight: 600, marginBottom: '10px' }}>
            Source Record Comparison
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {/* eCRF Card */}
            <div style={{
              border: '1px solid var(--slate-200)',
              borderRadius: 'var(--radius-md)',
              padding: '14px',
              backgroundColor: ecrf ? '#fff' : 'var(--slate-50)',
            }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--teal-600)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                <Database size={14} />
                <span>eCRF Record {ecrf?.row_number ? `(Row ${ecrf.row_number})` : ''}</span>
              </div>
              {ecrf ? (
                <div style={{ fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div><strong>Participant:</strong> {ecrf.participant_id || '—'}</div>
                  <div><strong>Sample:</strong> {ecrf.sample_id || '—'}</div>
                  <div><strong>Date:</strong> {ecrf.collection_date || '—'}</div>
                  <div><strong>Analyte:</strong> {ecrf.analyte || '—'}</div>
                  <div><strong>Value:</strong> <span className="mono">{ecrf.value ?? '—'}</span> {ecrf.unit || ''}</div>
                </div>
              ) : (
                <div style={{ color: 'var(--slate-400)', fontSize: '12px', fontStyle: 'italic', padding: '12px 0' }}>
                  No corresponding eCRF record exists.
                </div>
              )}
            </div>

            {/* Central Lab Card */}
            <div style={{
              border: '1px solid var(--slate-200)',
              borderRadius: 'var(--radius-md)',
              padding: '14px',
              backgroundColor: lab ? '#fff' : 'var(--slate-50)',
            }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--blue-600)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                <Database size={14} />
                <span>Central Lab {lab?.row_number ? `(Row ${lab.row_number})` : ''}</span>
              </div>
              {lab ? (
                <div style={{ fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div><strong>Participant:</strong> {lab.participant_id || '—'}</div>
                  <div><strong>Sample:</strong> {lab.sample_id || '—'}</div>
                  <div><strong>Date:</strong> {lab.collection_date || '—'}</div>
                  <div><strong>Analyte:</strong> {lab.analyte || '—'}</div>
                  <div><strong>Value:</strong> <span className="mono">{lab.value ?? '—'}</span> {lab.unit || ''}</div>
                </div>
              ) : (
                <div style={{ color: 'var(--slate-400)', fontSize: '12px', fontStyle: 'italic', padding: '12px 0' }}>
                  No accession record in central lab.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Suggested Investigation Step */}
        <div style={{
          backgroundColor: '#f0fdfa',
          border: '1px solid #99f6e4',
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
