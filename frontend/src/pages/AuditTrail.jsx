import { useEffect, useState } from 'react';
import { Shield, RefreshCw } from 'lucide-react';
import { fetchAuditTrail } from '../services/api';

export default function AuditTrail() {
  const [auditData, setAuditData] = useState({ events: [], total_events: 0, storage_mode: '' });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const loadAudit = () => {
    setLoading(true);
    setErrorMsg(null);
    fetchAuditTrail()
      .then((data) => {
        setAuditData(data);
      })
      .catch((err) => {
        setErrorMsg(err.message || 'Failed to fetch audit log.');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    let isMounted = true;
    fetchAuditTrail()
      .then((data) => {
        if (isMounted) setAuditData(data);
      })
      .catch((err) => {
        if (isMounted) setErrorMsg(err.message || 'Failed to fetch audit log.');
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--navy-900)', margin: 0 }}>
            Audit Trail & Adjudication Log
          </h1>
          <div style={{ fontSize: '13px', color: 'var(--slate-400)', marginTop: '4px' }}>
            Traceable log of reconciliation runs and reviewer actions. Note: Prototype storage is in-memory and resets on server restart.
          </div>
        </div>

        <button
          type="button"
          onClick={loadAudit}
          disabled={loading}
          className="btn btn-secondary"
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <RefreshCw size={15} />
          {loading ? 'Refreshing...' : 'Refresh Audit'}
        </button>
      </div>

      {errorMsg && (
        <div style={{
          padding: '12px 16px',
          backgroundColor: 'var(--rose-50)',
          color: 'var(--rose-600)',
          borderRadius: 'var(--radius-md)',
          fontSize: '13px',
        }}>
          {errorMsg}
        </div>
      )}

      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Shield size={18} color="var(--teal-600)" />
            <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--navy-900)' }}>
              Total Logged Events: {auditData.total_events}
            </span>
          </div>
          <span className="badge badge-neutral">
            {auditData.storage_mode || 'in-memory mode'}
          </span>
        </div>

        <div className="table-container">
          <table className="clinical-table">
            <thead>
              <tr>
                <th>Timestamp (UTC)</th>
                <th>Event ID</th>
                <th>Action Type</th>
                <th>Finding ID</th>
                <th>Reviewer</th>
                <th>Decision / Details</th>
                <th>Rationale</th>
              </tr>
            </thead>
            <tbody>
              {auditData.events.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '36px', color: 'var(--slate-400)' }}>
                    No audit events recorded yet. Run a reconciliation or record a human review decision.
                  </td>
                </tr>
              ) : (
                auditData.events.map((evt, idx) => (
                  <tr key={idx}>
                    <td className="mono" style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>
                      {evt.timestamp ? evt.timestamp.replace('T', ' ').slice(0, 19) : '—'}
                    </td>
                    <td className="mono">{evt.event_id || '—'}</td>
                    <td>
                      <span className={`badge ${evt.action === 'HUMAN_REVIEW_DECISION' ? 'badge-info' : 'badge-neutral'}`}>
                        {evt.action}
                      </span>
                    </td>
                    <td className="mono" style={{ fontWeight: 600 }}>{evt.finding_id || '—'}</td>
                    <td>{evt.reviewer_id}</td>
                    <td>
                      {evt.decision ? (
                        <strong>{evt.decision}</strong>
                      ) : evt.details ? (
                        <span style={{ fontSize: '12px', color: 'var(--slate-400)' }}>
                          {evt.details.total_discrepancies} findings, {evt.details.matched_records} matched
                        </span>
                      ) : '—'}
                    </td>
                    <td style={{ maxWidth: '300px', whiteSpace: 'normal', fontSize: '12px' }}>
                      {evt.rationale || '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
