import UploadPanel from '../components/UploadPanel';

export default function Reconciliation({ onReconciliationComplete, userId }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--navy-900)', margin: 0 }}>
          New Reconciliation Run
        </h1>
        <div style={{ fontSize: '13px', color: 'var(--slate-400)', marginTop: '4px' }}>
          Execute strict clinical rules across eCRF and Central Laboratory datasets with complete auditability.
        </div>
      </div>
      <UploadPanel onReconciliationComplete={onReconciliationComplete} userId={userId} />
    </div>
  );
}
