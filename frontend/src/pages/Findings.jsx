import FindingsTable from '../components/FindingsTable';

export default function Findings({ findings = [], onSelectFinding, selectedFindingId }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--navy-900)', margin: 0 }}>
          Clinical Discrepancy Findings
        </h1>
        <div style={{ fontSize: '13px', color: 'var(--slate-400)', marginTop: '4px' }}>
          Explore, filter, and drill into deterministic findings flagged by the reconciliation engine.
        </div>
      </div>

      <div className="card">
        <FindingsTable
          findings={findings}
          onSelectFinding={onSelectFinding}
          selectedFindingId={selectedFindingId}
        />
      </div>
    </div>
  );
}
