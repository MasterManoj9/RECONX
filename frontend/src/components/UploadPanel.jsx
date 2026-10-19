import { useRef, useState } from 'react';
import { UploadCloud, CheckCircle2, AlertTriangle, Play, Sparkles } from 'lucide-react';
import { downloadSampleCsv, postReconcileFiles } from '../services/api';

export default function UploadPanel({ onReconciliationComplete }) {
  const [ecrfFile, setEcrfFile] = useState(null);
  const [labFile, setLabFile] = useState(null);
  const [ecrfPreview, setEcrfPreview] = useState([]);
  const [labPreview, setLabPreview] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingSamples, setLoadingSamples] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const ecrfInputRef = useRef(null);
  const labInputRef = useRef(null);

  const parseCsvPreview = (file, callback) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const lines = text.split('\n').filter((l) => l.trim().length > 0);
      if (lines.length > 0) {
        const headers = lines[0].split(',').map((h) => h.trim());
        const rows = lines.slice(1, 4).map((line) => line.split(',').map((cell) => cell.trim()));
        callback({ headers, rows, totalRows: lines.length - 1 });
      }
    };
    reader.readAsText(file);
  };

  const handleEcrfChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.name.toLowerCase().endsWith('.csv')) {
        setErrorMsg('eCRF file must be a .csv file.');
        return;
      }
      setEcrfFile(file);
      setErrorMsg(null);
      parseCsvPreview(file, (data) => setEcrfPreview(data));
    }
  };

  const handleLabChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.name.toLowerCase().endsWith('.csv')) {
        setErrorMsg('Central Lab file must be a .csv file.');
        return;
      }
      setLabFile(file);
      setErrorMsg(null);
      parseCsvPreview(file, (data) => setLabPreview(data));
    }
  };

  const handleLoadSyntheticSamples = async () => {
    try {
      setLoadingSamples(true);
      setErrorMsg(null);

      const ecrfText = await downloadSampleCsv('ecrf');
      const labText = await downloadSampleCsv('lab');

      const sampleEcrf = new File([ecrfText], 'synthetic_ecrf.csv', { type: 'text/csv' });
      const sampleLab = new File([labText], 'synthetic_lab.csv', { type: 'text/csv' });

      setEcrfFile(sampleEcrf);
      setLabFile(sampleLab);

      parseCsvPreview(sampleEcrf, (data) => setEcrfPreview(data));
      parseCsvPreview(sampleLab, (data) => setLabPreview(data));
    } catch (err) {
      setErrorMsg('Failed to load built-in synthetic datasets: ' + err.message);
    } finally {
      setLoadingSamples(false);
    }
  };

  const handleRunReconciliation = async () => {
    if (!ecrfFile || !labFile) {
      setErrorMsg('Please select both eCRF and Central Lab CSV files.');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg(null);
      const result = await postReconcileFiles(ecrfFile, labFile);
      onReconciliationComplete(result);
    } catch (err) {
      setErrorMsg(err.message || 'Reconciliation failed.');
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Action Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 20px',
        backgroundColor: '#fff',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--slate-200)',
      }}>
        <div>
          <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--navy-900)' }}>
            Dataset Intake & Verification
          </div>
          <div style={{ fontSize: '13px', color: 'var(--slate-400)' }}>
            Upload raw eCRF and Central Laboratory files for deterministic cross-reconciliation.
          </div>
        </div>

        <button
          type="button"
          onClick={handleLoadSyntheticSamples}
          disabled={loadingSamples || loading}
          className="btn btn-secondary"
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <Sparkles size={16} color="var(--teal-600)" />
          {loadingSamples ? 'Loading Samples...' : 'Load Synthetic Demo Datasets'}
        </button>
      </div>

      {errorMsg && (
        <div style={{
          padding: '14px 18px',
          backgroundColor: 'var(--rose-50)',
          color: 'var(--rose-600)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid #fecdd3',
          fontSize: '13px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}>
          <AlertTriangle size={18} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Upload Dual Columns */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* eCRF Dropzone */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--navy-900)' }}>
              1. Electronic Case Report Form (eCRF)
            </span>
            <span className="badge badge-neutral">Required</span>
          </div>

          <div
            onClick={() => ecrfInputRef.current?.click()}
            style={{
              border: '2px dashed var(--slate-300)',
              borderRadius: 'var(--radius-md)',
              padding: '28px',
              textAlign: 'center',
              cursor: 'pointer',
              backgroundColor: ecrfFile ? 'var(--teal-50)' : 'var(--slate-50)',
              borderColor: ecrfFile ? 'var(--teal-500)' : 'var(--slate-300)',
            }}
          >
            <input
              type="file"
              accept=".csv"
              ref={ecrfInputRef}
              onChange={handleEcrfChange}
              style={{ display: 'none' }}
            />
            {ecrfFile ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={32} color="var(--teal-600)" />
                <div style={{ fontWeight: 600, color: 'var(--navy-900)' }}>{ecrfFile.name}</div>
                <div style={{ fontSize: '12px', color: 'var(--slate-400)' }}>
                  {formatFileSize(ecrfFile.size)} • Click to replace
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <UploadCloud size={32} color="var(--slate-400)" />
                <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--navy-700)' }}>
                  Click to select eCRF CSV
                </div>
                <div style={{ fontSize: '11px', color: 'var(--slate-400)' }}>
                  Max 10 MB • Must include study_id, participant_id, sample_id
                </div>
              </div>
            )}
          </div>

          {/* eCRF Preview */}
          {ecrfPreview?.rows && (
            <div style={{ fontSize: '12px' }}>
              <div style={{ color: 'var(--slate-400)', marginBottom: '4px' }}>
                Dataset Preview ({ecrfPreview.totalRows} records detected):
              </div>
              <div style={{ overflowX: 'auto', border: '1px solid var(--slate-200)', borderRadius: 'var(--radius-sm)' }}>
                <table className="clinical-table" style={{ fontSize: '11px' }}>
                  <thead>
                    <tr>
                      {ecrfPreview.headers.slice(0, 5).map((h, i) => (
                        <th key={i}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {ecrfPreview.rows.map((row, rIdx) => (
                      <tr key={rIdx}>
                        {row.slice(0, 5).map((cell, cIdx) => (
                          <td key={cIdx}>{cell}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Lab Dropzone */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--navy-900)' }}>
              2. Central Laboratory Results (Lab)
            </span>
            <span className="badge badge-neutral">Required</span>
          </div>

          <div
            onClick={() => labInputRef.current?.click()}
            style={{
              border: '2px dashed var(--slate-300)',
              borderRadius: 'var(--radius-md)',
              padding: '28px',
              textAlign: 'center',
              cursor: 'pointer',
              backgroundColor: labFile ? 'var(--blue-50)' : 'var(--slate-50)',
              borderColor: labFile ? 'var(--blue-500)' : 'var(--slate-300)',
            }}
          >
            <input
              type="file"
              accept=".csv"
              ref={labInputRef}
              onChange={handleLabChange}
              style={{ display: 'none' }}
            />
            {labFile ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={32} color="var(--blue-600)" />
                <div style={{ fontWeight: 600, color: 'var(--navy-900)' }}>{labFile.name}</div>
                <div style={{ fontSize: '12px', color: 'var(--slate-400)' }}>
                  {formatFileSize(labFile.size)} • Click to replace
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <UploadCloud size={32} color="var(--slate-400)" />
                <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--navy-700)' }}>
                  Click to select Central Lab CSV
                </div>
                <div style={{ fontSize: '11px', color: 'var(--slate-400)' }}>
                  Max 10 MB • Must include study_id, participant_id, sample_id
                </div>
              </div>
            )}
          </div>

          {/* Lab Preview */}
          {labPreview?.rows && (
            <div style={{ fontSize: '12px' }}>
              <div style={{ color: 'var(--slate-400)', marginBottom: '4px' }}>
                Dataset Preview ({labPreview.totalRows} records detected):
              </div>
              <div style={{ overflowX: 'auto', border: '1px solid var(--slate-200)', borderRadius: 'var(--radius-sm)' }}>
                <table className="clinical-table" style={{ fontSize: '11px' }}>
                  <thead>
                    <tr>
                      {labPreview.headers.slice(0, 5).map((h, i) => (
                        <th key={i}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {labPreview.rows.map((row, rIdx) => (
                      <tr key={rIdx}>
                        {row.slice(0, 5).map((cell, cIdx) => (
                          <td key={cIdx}>{cell}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Run Reconciliation Button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
        <button
          type="button"
          onClick={handleRunReconciliation}
          disabled={!ecrfFile || !labFile || loading}
          className="btn btn-primary"
          style={{ padding: '12px 28px', fontSize: '15px' }}
        >
          <Play size={18} />
          {loading ? 'Executing Deterministic Matching...' : 'Run Reconciliation'}
        </button>
      </div>
    </div>
  );
}
