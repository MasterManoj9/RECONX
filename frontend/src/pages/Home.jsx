import { 
  ArrowRight, 
  Database, 
  GitCompare, 
  ShieldCheck, 
  Sparkles, 
  Layers, 
  FileSpreadsheet,
  Activity,
  Zap,
  CheckCircle2
} from 'lucide-react';
import logoImg from '../assets/logo.png';
import BinaryOrbits from '../components/BinaryOrbits';

export default function Home({ onEnterDashboard, onStartRecon }) {
  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#0A0A0A', 
      color: '#ffffff', 
      display: 'flex', 
      flexDirection: 'column',
      position: 'relative',
      overflowX: 'hidden'
    }}>
      {/* Binary Orbits Galaxy Canvas - Fixed Living Cosmic Background */}
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
        <BinaryOrbits
          colors={["#7B4DFF", "#FFC2EE"]}
          backgroundColor={"#0A0A0A"}
          mode={"auto"}
          stars={70000}
          starSize={1.7}
          sparkle={0.5}
          arms={3}
          twist={3.5}
          armStrength={0.5}
          dust={0.5}
          core={1}
          coreSize={0.07}
          innerVoid={0}
          thickness={0.02}
          tilt={62}
          roll={-8}
          scale={1}
          centerX={0.5}
          centerY={0.52}
          speed={1}
          twinkle={0.35}
          depth={0.4}
          glow={0.45}
          intensity={1}
          interactive
          hoverWake
          clickRipple
          wakeStrength={1}
          rippleStrength={1}
          hoverBoost={0.5}
          paused={false}
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
        backgroundColor: 'rgba(10, 10, 10, 0.72)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <img 
            src={logoImg} 
            alt="ReconX" 
            style={{ 
              width: '42px', 
              height: '42px', 
              borderRadius: '10px', 
              backgroundColor: '#fff', 
              padding: '2px',
              boxShadow: '0 0 15px rgba(123, 77, 255, 0.4)'
            }} 
          />
          <div>
            <div style={{ fontWeight: 800, fontSize: '20px', letterSpacing: '-0.5px' }}>
              Recon<span style={{ color: '#2dd4bf' }}>X</span>
            </div>
            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '-2px' }}>
              Clinical Data Intelligence
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <a
            href="#how-it-works"
            style={{
              color: '#cbd5e1',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: 500,
              padding: '8px 12px',
              borderRadius: '6px',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.target.style.color = '#ffffff';
              e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
            }}
            onMouseLeave={(e) => {
              e.target.style.color = '#cbd5e1';
              e.target.style.backgroundColor = 'transparent';
            }}
          >
            How It Works
          </a>

          <a
            href="#rules"
            style={{
              color: '#cbd5e1',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: 500,
              padding: '8px 12px',
              borderRadius: '6px',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.target.style.color = '#ffffff';
              e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
            }}
            onMouseLeave={(e) => {
              e.target.style.color = '#cbd5e1';
              e.target.style.backgroundColor = 'transparent';
            }}
          >
            Discrepancy Rules
          </a>

          <button
            type="button"
            onClick={onEnterDashboard}
            className="btn btn-primary"
            style={{ 
              padding: '10px 22px', 
              fontSize: '14px', 
              borderRadius: '8px',
              boxShadow: '0 0 20px rgba(13, 148, 136, 0.35)'
            }}
          >
            <span>Enter Dashboard</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </header>

      {/* Main Home Content Container */}
      <main style={{ 
        maxWidth: '1240px', 
        width: '100%', 
        margin: '0 auto', 
        padding: '48px 24px', 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '56px', 
        flex: 1,
        position: 'relative',
        zIndex: 10
      }}>
        {/* Hero Section */}
        <section style={{
          position: 'relative',
          background: 'radial-gradient(120% 120% at 50% 10%, rgba(30, 27, 75, 0.45) 0%, rgba(15, 23, 42, 0.55) 60%, rgba(10, 10, 10, 0.7) 100%)',
          borderRadius: '24px',
          padding: '64px 52px',
          color: '#ffffff',
          overflow: 'hidden',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.7), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)'
        }}>
          {/* Subtle Ambient Cosmic Highlights */}
          <div style={{
            position: 'absolute',
            top: '-100px',
            right: '-100px',
            width: '380px',
            height: '380px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(123, 77, 255, 0.22) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />
          <div style={{
            position: 'absolute',
            bottom: '-100px',
            left: '10%',
            width: '340px',
            height: '340px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(20, 184, 166, 0.2) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />

          <div style={{
            position: 'relative',
            display: 'grid',
            gridTemplateColumns: '1.25fr 0.75fr',
            gap: '48px',
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
                border: '1px solid rgba(45, 212, 191, 0.35)',
                color: '#2dd4bf',
                fontSize: '12px',
                fontWeight: 600,
                marginBottom: '22px',
                letterSpacing: '0.04em',
                boxShadow: '0 0 15px rgba(45, 212, 191, 0.15)'
              }}>
                <Activity size={14} />
                CLINICAL TRIAL DATA INTELLIGENCE
              </div>

              <h1 style={{
                fontSize: '48px',
                fontWeight: 800,
                letterSpacing: '-1.4px',
                lineHeight: 1.15,
                color: '#ffffff',
                margin: '0 0 18px 0',
              }}>
                Detect the mismatch.<br />
                Explain the risk.<br />
                <span style={{
                  background: 'linear-gradient(90deg, #2dd4bf 0%, #a855f7 50%, #f472b6 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}>
                  Resolve with confidence.
                </span>
              </h1>

              <p style={{
                fontSize: '16px',
                lineHeight: 1.65,
                color: '#cbd5e1',
                maxWidth: '560px',
                marginBottom: '36px',
              }}>
                ReconX is the modern clinical reconciliation platform that deterministically cross-checks Electronic Case Report Forms (eCRF) against Central Laboratory records. Powered by live Supabase cloud persistence and an AI-assisted explanation assistant.
              </p>

              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={onEnterDashboard}
                  className="btn btn-primary"
                  style={{
                    padding: '14px 30px',
                    fontSize: '15px',
                    borderRadius: '10px',
                    boxShadow: '0 0 25px rgba(20, 184, 166, 0.4)',
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
                    padding: '14px 26px',
                    fontSize: '15px',
                    borderRadius: '10px',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    borderColor: 'rgba(255, 255, 255, 0.15)',
                    color: '#ffffff',
                    backdropFilter: 'blur(8px)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                  }}
                >
                  <GitCompare size={18} color="#2dd4bf" />
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
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '24px',
              padding: '40px 32px',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
            }}>
              <img
                src={logoImg}
                alt="ReconX Official Logo"
                style={{
                  width: '100%',
                  maxWidth: '260px',
                  borderRadius: '18px',
                  boxShadow: '0 15px 35px rgba(0, 0, 0, 0.6), 0 0 30px rgba(123, 77, 255, 0.3)',
                  objectFit: 'contain',
                  backgroundColor: '#ffffff',
                  padding: '10px',
                }}
              />
              <div style={{
                marginTop: '20px',
                textAlign: 'center',
                fontSize: '12px',
                color: '#94a3b8',
                letterSpacing: '0.02em',
                fontWeight: 500
              }}>
                Enterprise Clinical Reconciliation • Supabase Cloud Verified
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          <div style={{ textAlign: 'center', maxWidth: '680px', margin: '0 auto' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              color: '#a855f7',
              fontSize: '12px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: '8px'
            }}>
              <Zap size={14} />
              Deterministic Pipeline
            </div>
            <h2 style={{ fontSize: '32px', fontWeight: 800, color: '#ffffff', margin: '0 0 10px 0', letterSpacing: '-0.5px' }}>
              How ReconX Works
            </h2>
            <p style={{ fontSize: '15px', color: '#94a3b8', lineHeight: 1.6 }}>
              Automate clinical trial discrepancy detection in 4 deterministic, regulatory-compliant steps.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '22px' }}>
            {/* Step 1 */}
            <div style={{
              background: 'rgba(15, 23, 42, 0.6)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '16px',
              padding: '28px 24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              boxShadow: '0 15px 35px rgba(0, 0, 0, 0.3)',
            }}>
              <div style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                backgroundColor: 'rgba(20, 184, 166, 0.15)',
                color: '#2dd4bf',
                border: '1px solid rgba(45, 212, 191, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
              }}>
                <Layers size={22} />
              </div>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#2dd4bf', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Step 1
                </div>
                <div style={{ fontSize: '17px', fontWeight: 700, color: '#ffffff', margin: '6px 0 8px 0' }}>
                  Intake & Verification
                </div>
                <div style={{ fontSize: '13px', color: '#94a3b8', lineHeight: 1.5 }}>
                  Upload eCRF and Central Laboratory CSVs. Files are validated for schema, mandatory columns, size limits, and clean data headers.
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div style={{
              background: 'rgba(15, 23, 42, 0.6)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '16px',
              padding: '28px 24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              boxShadow: '0 15px 35px rgba(0, 0, 0, 0.3)',
            }}>
              <div style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                backgroundColor: 'rgba(59, 130, 246, 0.15)',
                color: '#60a5fa',
                border: '1px solid rgba(96, 165, 250, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <GitCompare size={22} />
              </div>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#60a5fa', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Step 2
                </div>
                <div style={{ fontSize: '17px', fontWeight: 700, color: '#ffffff', margin: '6px 0 8px 0' }}>
                  Deterministic Matching
                </div>
                <div style={{ fontSize: '13px', color: '#94a3b8', lineHeight: 1.5 }}>
                  Records are matched via the compound key: <code style={{ color: '#60a5fa', backgroundColor: 'rgba(59, 130, 246, 0.1)', padding: '2px 4px', borderRadius: '4px' }}>study_id + participant_id + sample_id</code> across 11 regulatory rules.
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div style={{
              background: 'rgba(15, 23, 42, 0.6)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '16px',
              padding: '28px 24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              boxShadow: '0 15px 35px rgba(0, 0, 0, 0.3)',
            }}>
              <div style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                backgroundColor: 'rgba(168, 85, 247, 0.15)',
                color: '#c084fc',
                border: '1px solid rgba(192, 132, 252, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Sparkles size={22} />
              </div>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#c084fc', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Step 3
                </div>
                <div style={{ fontSize: '17px', fontWeight: 700, color: '#ffffff', margin: '6px 0 8px 0' }}>
                  AI Evidence Explanation
                </div>
                <div style={{ fontSize: '13px', color: '#94a3b8', lineHeight: 1.5 }}>
                  Reviewers receive side-by-side evidence, deterministic rule triggers, factual hypotheses, and actionable next investigation steps.
                </div>
              </div>
            </div>

            {/* Step 4 */}
            <div style={{
              background: 'rgba(15, 23, 42, 0.6)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '16px',
              padding: '28px 24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              boxShadow: '0 15px 35px rgba(0, 0, 0, 0.3)',
            }}>
              <div style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                backgroundColor: 'rgba(34, 197, 94, 0.15)',
                color: '#4ade80',
                border: '1px solid rgba(74, 222, 128, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <ShieldCheck size={22} />
              </div>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#4ade80', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Step 4
                </div>
                <div style={{ fontSize: '17px', fontWeight: 700, color: '#ffffff', margin: '6px 0 8px 0' }}>
                  Audit & Supabase Sync
                </div>
                <div style={{ fontSize: '13px', color: '#94a3b8', lineHeight: 1.5 }}>
                  Reviewers record rationales under controlled decisions. Every event is saved in immutable Supabase PostgreSQL tables.
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Discrepancy Rules Grid */}
        <section id="rules" style={{
          background: 'rgba(15, 23, 42, 0.65)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '20px',
          padding: '36px',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          boxShadow: '0 20px 45px rgba(0, 0, 0, 0.4)',
        }}>
          <div style={{ marginBottom: '26px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#ffffff', margin: '0 0 6px 0' }}>
              11 Deterministic Discrepancy Categories Detected
            </h2>
            <p style={{ fontSize: '14px', color: '#94a3b8', margin: 0 }}>
              Every finding is backed by deterministic rules without black-box alterations.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
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
                  padding: '16px',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  transition: 'background-color 0.2s',
                }}
              >
                <div style={{ 
                  fontSize: '13px', 
                  fontWeight: 700, 
                  color: '#2dd4bf', 
                  fontFamily: 'monospace',
                  letterSpacing: '0.02em'
                }}>
                  {cat.name}
                </div>
                <div style={{ fontSize: '12.5px', color: '#94a3b8', marginTop: '6px', lineHeight: 1.45 }}>
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
          gap: '24px',
        }}>
          <div style={{
            background: 'rgba(15, 23, 42, 0.65)',
            border: '1px solid rgba(20, 184, 166, 0.3)',
            borderLeft: '4px solid #2dd4bf',
            borderRadius: '16px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            boxShadow: '0 15px 35px rgba(0, 0, 0, 0.3)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#2dd4bf', fontWeight: 700, fontSize: '16px' }}>
              <Database size={20} />
              <span>Supabase Cloud Database</span>
            </div>
            <div style={{ fontSize: '13.5px', color: '#cbd5e1', lineHeight: 1.6 }}>
              All reconciliation runs, findings, and human review decisions persist directly to your Supabase PostgreSQL cluster (<code style={{ color: '#2dd4bf', backgroundColor: 'rgba(20, 184, 166, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>vjshgqdtshyhhnpjfbzv.supabase.co</code>). Audit trails survive refreshes and server reboots.
            </div>
          </div>

          <div style={{
            background: 'rgba(15, 23, 42, 0.65)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            borderLeft: '4px solid #3b82f6',
            borderRadius: '16px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            boxShadow: '0 15px 35px rgba(0, 0, 0, 0.3)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#60a5fa', fontWeight: 700, fontSize: '16px' }}>
              <FileSpreadsheet size={20} />
              <span>Formula-Safe Clinical Export</span>
            </div>
            <div style={{ fontSize: '13.5px', color: '#cbd5e1', lineHeight: 1.6 }}>
              Download regulatory CSV reports containing source row numbers, reviewer decisions, and rationales, with built-in CSV formula injection protection (sanitizing <code style={{ color: '#60a5fa', backgroundColor: 'rgba(59, 130, 246, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>=, +, -, @</code>).
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <section style={{
          textAlign: 'center',
          padding: '48px 36px',
          background: 'linear-gradient(135deg, rgba(123, 77, 255, 0.15) 0%, rgba(20, 184, 166, 0.15) 100%)',
          borderRadius: '20px',
          border: '1px solid rgba(123, 77, 255, 0.35)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '18px',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5), 0 0 30px rgba(123, 77, 255, 0.2)',
        }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            color: '#a855f7',
            fontWeight: 700,
            fontSize: '13px',
            textTransform: 'uppercase',
            letterSpacing: '0.06em'
          }}>
            <CheckCircle2 size={16} />
            Instant Reconciliation Ready
          </div>
          <h3 style={{ fontSize: '26px', fontWeight: 800, color: '#ffffff', margin: 0, letterSpacing: '-0.5px' }}>
            Ready to Reconcile Clinical Trial Datasets?
          </h3>
          <p style={{ fontSize: '15px', color: '#cbd5e1', maxWidth: '520px', margin: 0, lineHeight: 1.6 }}>
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
              boxShadow: '0 0 25px rgba(20, 184, 166, 0.45)',
              marginTop: '8px'
            }}
          >
            <span>Launch Dashboard Now</span>
            <ArrowRight size={18} />
          </button>
        </section>
      </main>
    </div>
  );
}
