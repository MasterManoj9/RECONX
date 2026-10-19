import { AlertCircle, CheckCircle } from 'lucide-react';
import FindingsTable from '../components/FindingsTable';

export default function ReviewQueue({ findings = [], onSelectFinding, selectedFindingId }) {
  const pendingFindings = findings.filter((f) => f.review_status === 'Needs Review');
  const reviewedFindings = findings.filter((f) => f.review_status !== 'Needs Review');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--navy-900)', margin: 0 }}>
          Human Review Queue
        </h1>
        <div style={{ fontSize: '13px', color: 'var(--slate-400)', marginTop: '4px' }}>
          Human-in-the-loop clinical adjudication. Discrepancies are never auto-resolved without explicit reviewer sign-off.
        </div>
      </div>

      {/* Queue Stat Banner */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '14px', borderLeft: '4px solid #f59e0b' }}>
          <AlertCircle size={24} color="#f59e0b" />
          <div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--navy-900)' }}>
              {pendingFindings.length} Pending Adjudication
            </div>
            <div style={{ fontSize: '12px', color: 'var(--slate-400)' }}>
              Awaiting clinical data reviewer rationale and decision.
            </div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '14px', borderLeft: '4px solid #10b981' }}>
          <CheckCircle size={24} color="#10b981" />
          <div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--navy-900)' }}>
              {reviewedFindings.length} Adjudicated Findings
            </div>
            <div style={{ fontSize: '12px', color: 'var(--slate-400)' }}>
              Logged in audit trail with reviewer rationale.
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--navy-900)', marginBottom: '14px' }}>
          Items Requiring Human Review
        </div>
        <FindingsTable
          findings={pendingFindings}
          onSelectFinding={onSelectFinding}
          selectedFindingId={selectedFindingId}
        />
      </div>
    </div>
  );
}
