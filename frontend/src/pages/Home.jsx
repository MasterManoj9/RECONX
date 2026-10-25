import { 
  ArrowRight, 
  GitCompare, 
  ShieldCheck, 
  Sparkles, 
  Layers, 
  Activity
} from 'lucide-react';
import logoImg from '../assets/logo.png';
import CaduceusOrbits from '../components/CaduceusOrbits';
export default function Home({ onEnterDashboard, onStartRecon, currentUser, onOpenAuth }) {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0A0A0A', color: '#ffffff', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      {/* Background Orbits Canvas */}
      <div 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 0,
          pointerEvents: 'none',
          overflow: 'hidden'
        }}
        aria-hidden="true"
      >
        <CaduceusOrbits
          colors={["#2dd4bf", "#c084fc"]}
          backgroundColor={"#0A0A0A"}
          starSize={1.7}
          scale={0.92}
          centerX={0.5}
          centerY={0.5}
          glow={0.52}
          intensity={1.05}
          speed={1.0}
          paused={false}
          interactive={true}
          clickRipple={true}
          style={{ width: '100%', height: '100%' }}
        />
      </div>

      {/* Top Navbar for Home */}
      <header style={{
        height: '72px',
        padding: '0 48px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        backgroundColor: 'rgba(10, 15, 29, 0.85)',
        backdropFilter: 'blur(12px)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <img 
            src={logoImg} 
            alt="ReconX" 
            style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: '#fff', padding: '2px' }} 
          />
          <div>
            <div style={{ fontWeight: 800, fontSize: '20px', letterSpacing: '-0.5px' }}>
              Recon<span style={{ color: 'var(--teal-400)' }}>X</span>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--slate-400)', marginTop: '-2px' }}>
              Clinical Data Intelligence
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <a
            href="#how-it-works"
            style={{
              color: 'var(--slate-300)',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: 500,
              padding: '8px 12px',
              transition: 'color 0.2s',
            }}
            onMouseEnter={(e) => (e.target.style.color = '#ffffff')}
            onMouseLeave={(e) => (e.target.style.color = 'var(--slate-300)')}
          >
            How It Works
          </a>

          <a
            href="#rules"
            style={{
              color: 'var(--slate-300)',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: 500,
              padding: '8px 12px',
              transition: 'color 0.2s',
            }}
            onMouseEnter={(e) => (e.target.style.color = '#ffffff')}
            onMouseLeave={(e) => (e.target.style.color = 'var(--slate-300)')}
          >
            Discrepancy Rules
          </a>

          {currentUser ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button
                type="button"
                onClick={onEnterDashboard}
                className="btn btn-primary"
                style={{ padding: '10px 22px', fontSize: '14px', borderRadius: '8px' }}
              >
                <span>Dashboard</span>
                <ArrowRight size={16} />
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button
                type="button"
                onClick={onOpenAuth}
                className="btn btn-secondary"
                style={{ padding: '8px 16px', fontSize: '13px', borderRadius: '8px' }}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={onEnterDashboard}
                className="btn btn-primary"
                style={{ padding: '10px 22px', fontSize: '14px', borderRadius: '8px' }}
              >
                <span>Enter Dashboard</span>
                <ArrowRight size={16} />
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Home Content Container */}
      <div style={{ maxWidth: '1240px', width: '100%', margin: '0 auto', padding: '48px 24px', display: 'flex', flexDirection: 'column', gap: '48px', flex: 1, position: 'relative', zIndex: 10 }}>
      {/* Hero Section */}
      <section style={{
        position: 'relative',
        background: 'transparent',
        padding: '32px 0 16px 0',
        color: '#ffffff',
      }}>
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
              backgroundColor: 'rgba(20, 184, 166, 0.16)',
              border: '1px solid rgba(20, 184, 166, 0.4)',
              color: 'var(--teal-400)',
              fontSize: '12px',
              fontWeight: 600,
              marginBottom: '20px',
              letterSpacing: '0.04em',
              backdropFilter: 'blur(8px)',
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
              textShadow: '0 4px 24px rgba(0, 0, 0, 0.95), 0 2px 8px rgba(0, 0, 0, 0.9)',
            }}>
              Detect the mismatch.<br />
              Explain the risk.<br />
              <span style={{
                background: 'linear-gradient(90deg, #2dd4bf 0%, #38bdf8 50%, #f472b6 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                display: 'inline-block',
                textShadow: 'none',
                filter: 'drop-shadow(0 2px 10px rgba(0,0,0,0.7))',
              }}>
                Resolve with confidence.
              </span>
            </h1>

            <p style={{
              fontSize: '16px',
              lineHeight: 1.6,
              color: '#cbd5e1',
              maxWidth: '560px',
              marginBottom: '32px',
              textShadow: '0 2px 12px rgba(0, 0, 0, 0.95)',
            }}>
              ReconX is the next-generation clinical reconciliation platform that deterministically cross-checks Electronic Case Report Forms (eCRF) against Central Laboratory records with an AI-assisted explanation assistant.
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
                  boxShadow: '0 4px 20px rgba(13, 148, 136, 0.5), 0 0 25px rgba(20, 184, 166, 0.3)',
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
                  borderColor: 'rgba(255, 255, 255, 0.22)',
                  color: '#ffffff',
                  backdropFilter: 'blur(8px)',
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
            background: 'transparent',
            padding: '12px',
          }}>
            <div className="glass-logo-frame">
              <img
                src={logoImg}
                alt="ReconX Official Logo"
                style={{
                  width: '100%',
                  maxWidth: '260px',
                  borderRadius: '16px',
                  boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5)',
                  objectFit: 'contain',
                  backgroundColor: '#ffffff',
                  padding: '12px',
                  display: 'block',
                }}
              />
            </div>
            <div style={{
              marginTop: '16px',
              textAlign: 'center',
              fontSize: '12px',
              color: '#cbd5e1',
              textShadow: '0 2px 8px rgba(0, 0, 0, 0.9)',
              letterSpacing: '0.02em',
            }}>
              Enterprise Clinical Data Reconciliation Platform
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '28px', fontWeight: 700, color: '#ffffff', margin: '0 0 8px 0', textShadow: '0 2px 10px rgba(0,0,0,0.8)' }}>
            How ReconX Works
          </h2>
          <p style={{ fontSize: '14px', color: '#94a3b8', lineHeight: 1.5, textShadow: '0 1px 6px rgba(0,0,0,0.8)' }}>
            Automate clinical trial discrepancy detection in 4 deterministic, regulatory-compliant steps.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
          {/* Step 1 */}
          <div className="glass-step-card">
            <div className="glass-step-icon glass-step-icon-teal" style={{
              backgroundColor: 'rgba(20, 184, 166, 0.15)',
              color: '#2dd4bf',
              border: '1px solid rgba(20, 184, 166, 0.35)',
              boxShadow: '0 0 15px rgba(20, 184, 166, 0.2)',
            }}>
              <Layers size={22} />
            </div>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#2dd4bf', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Step 1
              </div>
              <div style={{ fontSize: '17px', fontWeight: 700, color: '#ffffff', margin: '4px 0 6px 0', letterSpacing: '-0.3px' }}>
                Intake & Verification
              </div>
              <div style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: 1.5 }}>
                Upload eCRF and Central Laboratory CSVs. Files are validated for schema, mandatory columns, size limits, and formatted headers.
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div className="glass-step-card">
            <div className="glass-step-icon glass-step-icon-blue" style={{
              backgroundColor: 'rgba(56, 189, 248, 0.15)',
              color: '#38bdf8',
              border: '1px solid rgba(56, 189, 248, 0.35)',
              boxShadow: '0 0 15px rgba(56, 189, 248, 0.2)',
            }}>
              <GitCompare size={22} />
            </div>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Step 2
              </div>
              <div style={{ fontSize: '17px', fontWeight: 700, color: '#ffffff', margin: '4px 0 6px 0', letterSpacing: '-0.3px' }}>
                Deterministic Matching
              </div>
              <div style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: 1.5 }}>
                Records are matched via the compound key: <code style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', color: '#38bdf8', padding: '2px 6px', borderRadius: '4px', fontSize: '12px' }}>study_id + participant_id + sample_id</code> across 11 regulatory discrepancy rules.
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="glass-step-card">
            <div className="glass-step-icon glass-step-icon-purple" style={{
              backgroundColor: 'rgba(168, 85, 247, 0.15)',
              color: '#c084fc',
              border: '1px solid rgba(168, 85, 247, 0.35)',
              boxShadow: '0 0 15px rgba(168, 85, 247, 0.2)',
            }}>
              <Sparkles size={22} />
            </div>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#c084fc', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Step 3
              </div>
              <div style={{ fontSize: '17px', fontWeight: 700, color: '#ffffff', margin: '4px 0 6px 0', letterSpacing: '-0.3px' }}>
                AI Evidence Explanation
              </div>
              <div style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: 1.5 }}>
                Reviewers receive side-by-side evidence, deterministic rule triggers, factual hypotheses, and actionable next investigation steps.
              </div>
            </div>
          </div>

          {/* Step 4 */}
          <div className="glass-step-card">
            <div className="glass-step-icon glass-step-icon-emerald" style={{
              backgroundColor: 'rgba(52, 211, 153, 0.15)',
              color: '#34d399',
              border: '1px solid rgba(52, 211, 153, 0.35)',
              boxShadow: '0 0 15px rgba(52, 211, 153, 0.2)',
            }}>
              <ShieldCheck size={22} />
            </div>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#34d399', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Step 4
              </div>
              <div style={{ fontSize: '17px', fontWeight: 700, color: '#ffffff', margin: '4px 0 6px 0', letterSpacing: '-0.3px' }}>
                Audit & Compliance Traceability
              </div>
              <div style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: 1.5 }}>
                Reviewers record rationales under controlled decisions. Every event is saved in tamper-evident, immutable audit tables.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Discrepancy Rules Grid */}
      <section id="rules" style={{
        padding: '36px',
        background: 'rgba(255, 255, 255, 0.04)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRadius: '24px',
        boxShadow: '0 12px 40px 0 rgba(0, 0, 0, 0.45), inset 0 1px 0 0 rgba(255, 255, 255, 0.1)',
      }}>
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#ffffff', margin: '0 0 8px 0', letterSpacing: '-0.4px', textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}>
            11 Deterministic Discrepancy Categories Detected
          </h2>
          <p style={{ fontSize: '14px', color: '#94a3b8', margin: 0, lineHeight: 1.5 }}>
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
            <div key={idx} className="glass-rule-item">
              <div style={{
                fontSize: '13px',
                fontWeight: 700,
                color: '#38bdf8',
                fontFamily: 'var(--font-mono)',
                letterSpacing: '0.02em',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span className="glass-rule-dot" />
                {cat.name}
              </div>
              <div style={{ fontSize: '12px', color: '#cbd5e1', marginTop: '8px', lineHeight: 1.45 }}>
                {cat.desc}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom CTA / Launch Dashboard Section */}
      <div className="glass-cta-card">
        <h3 style={{
          fontSize: '28px',
          fontWeight: 700,
          color: '#ffffff',
          margin: 0,
          letterSpacing: '-0.5px',
          textShadow: '0 2px 12px rgba(0, 0, 0, 0.9)',
        }}>
          Ready to Reconcile Clinical Trial Datasets?
        </h3>
        <p style={{
          fontSize: '15px',
          color: '#cbd5e1',
          maxWidth: '540px',
          margin: 0,
          lineHeight: 1.5,
          textShadow: '0 1px 6px rgba(0, 0, 0, 0.8)',
        }}>
          Launch the interactive dashboard to inspect synthetic trial data, review discrepancies, or upload custom study datasets.
        </p>
        <button
          type="button"
          onClick={onEnterDashboard}
          className="btn btn-primary"
          style={{
            padding: '14px 36px',
            fontSize: '15px',
            borderRadius: '10px',
            boxShadow: '0 4px 20px rgba(13, 148, 136, 0.5), 0 0 25px rgba(20, 184, 166, 0.3)',
            fontWeight: 600,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span>Launch Dashboard Now</span>
          <ArrowRight size={18} />
        </button>
      </div>
      </div>
    </div>
  );
}
