import { Download, FileSpreadsheet, ShieldAlert } from 'lucide-react';
import { getExportUrl } from '../services/api';

export default function Reports({ reconResult }) {
  const reconId = reconResult?.reconciliation_id;
  const summary = reconResult?.summary;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--navy-900)', margin: 0 }}>
          Reconciliation Reports & Exports
        </h1>
        <div style={{ fontSize: '13px', color: 'var(--slate-400)', marginTop: '4px' }}>
          Generate regulatory-grade discrepancy exports and clinical reconciliation summaries.
        </div>
      </div>

      {reconResult ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{
                padding: '12px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--teal-50)',
                color: 'var(--teal-600)',
                border: '1px solid #99f6e4',
              }}>
                <FileSpreadsheet size={24} />
              </div>
              <div>
                <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--navy-900)' }}>
                  Reconciliation Findings Export ({reconId})
                </div>
                <div style={{ fontSize: '12px', color: 'var(--slate-400)' }}>
                  Includes finding IDs, discrepancy rules, source values, reviewer status, and rationales.
                </div>
              </div>
            </div>

            <a
              href={getExportUrl(reconId)}
              download
              className="btn btn-primary"
              style={{ textDecoration: 'none' }}
            >
              <Download size={16} />
              <span>Export CSV</span>
            </a>
          </div>

          <div className="card">
            <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--navy-900)', marginBottom: '14px' }}>
              Run Summary Statistics
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', fontSize: '13px' }}>
              <div style={{ padding: '12px', backgroundColor: 'var(--slate-50)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ color: 'var(--slate-400)' }}>Total eCRF Records</div>
                <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--navy-900)' }}>{summary?.total_ecrf_records}</div>
              </div>
              <div style={{ padding: '12px', backgroundColor: 'var(--slate-50)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ color: 'var(--slate-400)' }}>Total Lab Records</div>
                <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--navy-900)' }}>{summary?.total_lab_records}</div>
              </div>
              <div style={{ padding: '12px', backgroundColor: 'var(--slate-50)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ color: 'var(--slate-400)' }}>Total Discrepancies</div>
                <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--rose-600)' }}>{summary?.total_discrepancies}</div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="card" style={{ padding: '40px', textAlign: 'center', color: 'var(--slate-400)' }}>
          <ShieldAlert size={32} style={{ margin: '0 auto 10px', color: 'var(--slate-400)' }} />
          <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--navy-800)', marginBottom: '4px' }}>
            No Active Reconciliation Run
          </div>
          <div style={{ fontSize: '13px' }}>
            Please execute a reconciliation in the <strong>Reconciliation</strong> tab to generate downloadable reports.
          </div>
        </div>
      )}
    </div>
  );
}
