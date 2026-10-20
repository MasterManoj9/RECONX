import { 
  ArrowRight, 
  Database, 
  GitCompare, 
  ShieldCheck, 
  Sparkles, 
  Layers, 
  FileSpreadsheet,
  Activity
} from 'lucide-react';
import logoImg from '../assets/logo.png';

export default function Home({ onEnterDashboard, onStartRecon }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '48px', paddingBottom: '40px' }}>
      {/* Hero Section */}
      <section style={{
        position: 'relative',
        background: 'linear-gradient(135deg, #0a0f1d 0%, #0f172a 50%, #132438 100%)',
        borderRadius: '16px',
        padding: '56px 48px',
        color: '#ffffff',
        overflow: 'hidden',
        boxShadow: '0 20px 40px -15px rgba(10, 15, 29, 0.4)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
      }}>
        {/* Glow Accents */}
        <div style={{
          position: 'absolute',
          top: '-80px',
          right: '-80px',
          width: '320px',
          height: '320px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(20, 184, 166, 0.25) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute',
          bottom: '-100px',
          left: '20%',
          width: '280px',
          height: '280px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(37, 99, 235, 0.2) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{
          position: 'relative',
          display: 'grid',
          gridTemplateColumns: '1.2fr 0.8fr',
          gap: '40px',
          alignItems: 'center',
        }}>
          <div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 14px',
              borderRadius: '9999px',
              backgroundColor: 'rgba(20, 184, 166, 0.12)',
              border: '1px solid rgba(20, 184, 166, 0.3)',
              color: 'var(--teal-400)',
              fontSize: '12px',
              fontWeight: 600,
              marginBottom: '20px',
              letterSpacing: '0.04em',
            }}>
              <Activity size={14} />
              CLINICAL TRIAL DATA INTELLIGENCE
            </div>

            <h1 style={{
              fontSize: '44px',
              fontWeight: 800,
              letterSpacing: '-1.2px',
              lineHeight: 1.15,
              color: '#ffffff',
              margin: '0 0 16px 0',
            }}>
              Detect the mismatch.<br />
              Explain the risk.<br />
              <span style={{
                background: 'linear-gradient(90deg, #2dd4bf 0%, #38bdf8 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                Resolve with confidence.
              </span>
            </h1>

            <p style={{
              fontSize: '16px',
              lineHeight: 1.6,
              color: 'var(--slate-300)',
              maxWidth: '560px',
              marginBottom: '32px',
            }}>
              ReconX is the next-generation clinical reconciliation platform that deterministically cross-checks Electronic Case Report Forms (eCRF) against Central Laboratory records. Powered by live Supabase cloud persistence and an AI-assisted explanation assistant.
            </p>

            <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={onEnterDashboard}
                className="btn btn-primary"
                style={{
                  padding: '14px 28px',
                  fontSize: '15px',
                  borderRadius: '10px',
                  boxShadow: '0 4px 14px rgba(13, 148, 136, 0.4)',
                }}
              >
                <span>Enter Dashboard</span>
                <ArrowRight size={18} />
              </button>

              <button
                type="button"
                onClick={onStartRecon}
                className="btn btn-secondary"
                style={{
                  padding: '14px 24px',
                  fontSize: '15px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  borderColor: 'rgba(255, 255, 255, 0.18)',
                  color: '#ffffff',
                }}
              >
                <GitCompare size={18} color="var(--teal-400)" />
                <span>Upload & Reconcile</span>
              </button>
            </div>
          </div>

          {/* Logo Showcase Card */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '20px',
            padding: '36px',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
          }}>
            <img
              src={logoImg}
              alt="ReconX Official Logo"
              style={{
                width: '100%',
                maxWidth: '260px',
                borderRadius: '16px',
                boxShadow: '0 12px 30px rgba(0,0,0,0.4)',
                objectFit: 'contain',
                backgroundColor: '#ffffff',
                padding: '8px',
              }}
            />
            <div style={{
              marginTop: '16px',
              textAlign: 'center',
              fontSize: '12px',
              color: 'var(--slate-400)',
            }}>
              Enterprise Clinical Data Reconciliation • Supabase Cloud Verified
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--navy-900)', margin: '0 0 8px 0' }}>
            How ReconX Works
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--slate-400)', lineHeight: 1.5 }}>
            Automate clinical trial discrepancy detection in 4 deterministic, regulatory-compliant steps.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
          {/* Step 1 */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '14px', position: 'relative' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              backgroundColor: 'var(--teal-50)',
              color: 'var(--teal-600)',
              border: '1px solid #99f6e4',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
            }}>
              <Layers size={20} />
            </div>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--teal-600)', textTransform: 'uppercase' }}>
                Step 1
              </div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--navy-900)', margin: '4px 0 6px 0' }}>
                Intake & Verification
              </div>
              <div style={{ fontSize: '13px', color: 'var(--navy-600)', lineHeight: 1.4 }}>
                Upload eCRF and Central Laboratory CSVs. Files are validated for schema, mandatory columns, size limits, and formatted headers.
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              backgroundColor: '#eff6ff',
              color: '#2563eb',
              border: '1px solid #bfdbfe',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <GitCompare size={20} />
            </div>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#2563eb', textTransform: 'uppercase' }}>
                Step 2
              </div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--navy-900)', margin: '4px 0 6px 0' }}>
                Deterministic Matching
              </div>
              <div style={{ fontSize: '13px', color: 'var(--navy-600)', lineHeight: 1.4 }}>
                Records are matched via the compound key: <code>study_id + participant_id + sample_id</code> across 11 regulatory discrepancy rules.
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              backgroundColor: '#f5f3ff',
              color: '#7c3aed',
              border: '1px solid #ddd6fe',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Sparkles size={20} />
            </div>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#7c3aed', textTransform: 'uppercase' }}>
                Step 3
              </div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--navy-900)', margin: '4px 0 6px 0' }}>
                AI Evidence Explanation
              </div>
              <div style={{ fontSize: '13px', color: 'var(--navy-600)', lineHeight: 1.4 }}>
                Reviewers receive side-by-side evidence, deterministic rule triggers, factual hypotheses, and actionable next investigation steps.
              </div>
            </div>
          </div>

          {/* Step 4 */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              backgroundColor: '#ecfdf5',
              color: '#059669',
              border: '1px solid #a7f3d0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <ShieldCheck size={20} />
            </div>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#059669', textTransform: 'uppercase' }}>
                Step 4
              </div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--navy-900)', margin: '4px 0 6px 0' }}>
                Audit & Supabase Sync
              </div>
              <div style={{ fontSize: '13px', color: 'var(--navy-600)', lineHeight: 1.4 }}>
                Reviewers record rationales under controlled decisions. Every event is saved in immutable Supabase PostgreSQL tables.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Discrepancy Rules Grid */}
      <section className="card" style={{ padding: '32px' }}>
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--navy-900)', margin: '0 0 6px 0' }}>
            11 Deterministic Discrepancy Categories Detected
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--slate-400)' }}>
            Every finding is backed by deterministic rules without black-box alterations.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
          {[
            { name: 'MISSING_IDENTIFIER', desc: 'Missing study, participant, or sample ID in source record.' },
            { name: 'DUPLICATE_KEY', desc: 'Duplicate compound identifier found within the same dataset.' },
            { name: 'MISSING_ECRF_RECORD', desc: 'Sample accessioned in lab with no corresponding eCRF entry.' },
            { name: 'MISSING_LAB_RECORD', desc: 'Sample recorded in eCRF but missing in central laboratory.' },
            { name: 'INVALID_DATE', desc: 'Unparseable or malformed collection timestamps.' },
            { name: 'DATE_MISMATCH', desc: 'Collection dates differ between eCRF and Central Lab.' },
            { name: 'ANALYTE_MISMATCH', desc: 'Analyte biomarker names diverge between records.' },
            { name: 'MISSING_VALUE', desc: 'Missing or empty result value where expected.' },
            { name: 'INVALID_NUMERIC_VALUE', desc: 'Non-numeric string recorded for quantitative test.' },
            { name: 'UNIT_MISMATCH', desc: 'Incompatible units of measure (e.g. g/dL vs mg/dL).' },
            { name: 'VALUE_MISMATCH', desc: 'Quantitative measurement discrepancy exceeding tolerance.' },
          ].map((cat, idx) => (
            <div
              key={idx}
              style={{
                padding: '14px',
                borderRadius: '8px',
                backgroundColor: 'var(--slate-50)',
                border: '1px solid var(--slate-200)',
              }}
            >
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--navy-900)', fontFamily: 'var(--font-mono)' }}>
                {cat.name}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--navy-600)', marginTop: '4px', lineHeight: 1.4 }}>
                {cat.desc}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Cloud & Architecture Callout */}
      <section style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '20px',
      }}>
        <div className="card" style={{ borderLeft: '4px solid var(--teal-500)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--teal-600)', fontWeight: 700 }}>
            <Database size={18} />
            <span>Supabase Cloud Database</span>
          </div>
          <div style={{ fontSize: '13px', color: 'var(--navy-700)', lineHeight: 1.5 }}>
            All reconciliation runs, findings, and human review decisions persist directly to your Supabase PostgreSQL cluster (<code>vjshgqdtshyhhnpjfbzv.supabase.co</code>). Audit trails survive refreshes and server reboots.
          </div>
        </div>

        <div className="card" style={{ borderLeft: '4px solid #2563eb', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#2563eb', fontWeight: 700 }}>
            <FileSpreadsheet size={18} />
            <span>Formula-Safe Clinical Export</span>
          </div>
          <div style={{ fontSize: '13px', color: 'var(--navy-700)', lineHeight: 1.5 }}>
            Download regulatory CSV reports containing source row numbers, reviewer decisions, and rationales, with built-in CSV formula injection protection (sanitizing <code>=, +, -, @</code>).
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <div style={{
        textAlign: 'center',
        padding: '36px',
        backgroundColor: '#fff',
        borderRadius: '16px',
        border: '1px solid var(--slate-200)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '16px',
      }}>
        <h3 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--navy-900)', margin: 0 }}>
          Ready to Reconcile Clinical Trial Datasets?
        </h3>
        <p style={{ fontSize: '14px', color: 'var(--slate-400)', maxWidth: '480px', margin: 0 }}>
          Launch the interactive dashboard to inspect synthetic trial data, review discrepancies, or upload custom study datasets.
        </p>
        <button
          type="button"
          onClick={onEnterDashboard}
          className="btn btn-primary"
          style={{ padding: '12px 32px', fontSize: '15px', borderRadius: '8px' }}
        >
          Launch Dashboard Now
        </button>
      </div>
    </div>
  );
}
