import { useState, useEffect } from 'react';
import { LogIn, UserPlus, X, Lock, Mail, User, CheckCircle2, MailCheck, AlertCircle } from 'lucide-react';
import { signInUser, signUpUser } from '../services/api';

export default function AuthModal({
  isOpen,
  onClose,
  onSuccess,
  initialMode = 'login',
  initialMessage = null,
  initialEmail = '',
}) {
  const [mode, setMode] = useState(initialMode); // 'login' | 'signup'
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(initialMessage);
  const [verificationPending, setVerificationPending] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');

  // Sync state whenever modal is opened or initial props change
  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMode(initialMode || 'login');
      if (initialEmail) setEmail(initialEmail);
      if (initialMessage) setSuccessMsg(initialMessage);
      setErrorMsg(null);
      setVerificationPending(false);
      setPassword('');
    }
  }, [isOpen, initialMode, initialMessage, initialEmail]);

  if (!isOpen) return null;

  const handleClose = () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setVerificationPending(false);
    setPassword('');
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (mode === 'signup') {
        if (!email.trim() || !password.trim()) {
          throw new Error('Please enter both email and password.');
        }
        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters.');
        }

        const result = await signUpUser(email.trim(), password, fullName.trim());

        if (result.requiresConfirmation) {
          // Switch to verification pending screen
          setSubmittedEmail(email.trim());
          setVerificationPending(true);
          setPassword('');
        } else {
          // In case email confirmation is disabled in Supabase
          setSuccessMsg('Account created successfully! Logging you in...');
          setTimeout(() => {
            onSuccess(result.user || result);
            handleClose();
          }, 800);
        }
      } else {
        if (!email.trim() || !password.trim()) {
          throw new Error('Please enter your email and password.');
        }
        const user = await signInUser(email.trim(), password);
        onSuccess(user);
        handleClose();
      }
    } catch (err) {
      console.error('Auth error:', err);
      setErrorMsg(err.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.78)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      padding: '20px',
    }}>
      <div style={{
        position: 'relative',
        width: '100%',
        maxWidth: '440px',
        background: 'rgba(15, 23, 42, 0.92)',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        borderRadius: '24px',
        padding: '36px 32px',
        boxShadow: '0 25px 60px rgba(0, 0, 0, 0.85), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
        color: '#ffffff',
      }}>
        {/* Close Button */}
        <button
          type="button"
          onClick={handleClose}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'rgba(255, 255, 255, 0.08)',
            border: 'none',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            color: '#94a3b8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'background 0.2s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)')}
        >
          <X size={18} />
        </button>

        {/* VERIFICATION PENDING STATE (When signup submitted) */}
        {verificationPending ? (
          <div style={{ textAlign: 'center', padding: '8px 0 4px 0' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '64px',
              height: '64px',
              borderRadius: '20px',
              backgroundColor: 'rgba(20, 184, 166, 0.15)',
              border: '1px solid rgba(20, 184, 166, 0.35)',
              color: '#2dd4bf',
              marginBottom: '16px',
              boxShadow: '0 0 25px rgba(20, 184, 166, 0.3)',
            }}>
              <MailCheck size={32} />
            </div>

            <h2 style={{ fontSize: '22px', fontWeight: 700, margin: '0 0 6px 0', letterSpacing: '-0.5px' }}>
              Check Your Email
            </h2>

            <p style={{ fontSize: '13px', color: '#94a3b8', margin: '0 0 14px 0', lineHeight: 1.5 }}>
              A confirmation link has been sent to:
            </p>

            <div style={{
              display: 'inline-block',
              padding: '8px 16px',
              borderRadius: '10px',
              backgroundColor: 'rgba(20, 184, 166, 0.1)',
              border: '1px solid rgba(20, 184, 166, 0.25)',
              color: '#2dd4bf',
              fontWeight: 600,
              fontSize: '13px',
              marginBottom: '18px',
              wordBreak: 'break-all',
            }}>
              {submittedEmail}
            </div>

            <div style={{
              padding: '14px 16px',
              borderRadius: '12px',
              backgroundColor: 'rgba(30, 41, 59, 0.7)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              color: '#cbd5e1',
              fontSize: '12px',
              textAlign: 'left',
              lineHeight: 1.6,
              marginBottom: '22px',
            }}>
              <div style={{ fontWeight: 600, color: '#f1f5f9', marginBottom: '6px' }}>
                Next Steps:
              </div>
              <ol style={{ margin: 0, paddingLeft: '18px' }}>
                <li style={{ marginBottom: '4px' }}>Open the confirmation email in your inbox.</li>
                <li style={{ marginBottom: '4px' }}>Click the <strong>Confirm your mail</strong> button.</li>
                <li>You will be redirected back here to sign in with your credentials.</li>
              </ol>
              <div style={{ marginTop: '10px', fontSize: '11px', color: '#94a3b8', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '8px' }}>
                * If you do not see the email, please check your <strong>Spam / Junk folder</strong>.
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setVerificationPending(false);
                setMode('login');
                setEmail(submittedEmail);
                setPassword('');
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '14px',
                borderRadius: '10px',
                fontWeight: 600,
                boxShadow: '0 4px 18px rgba(13, 148, 136, 0.4)',
              }}
            >
              Back to Sign In
            </button>
          </div>
        ) : (
          /* STANDARD LOGIN / SIGNUP VIEW */
          <>
            {/* Modal Header */}
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '52px',
                height: '52px',
                borderRadius: '16px',
                backgroundColor: 'rgba(20, 184, 166, 0.15)',
                border: '1px solid rgba(20, 184, 166, 0.35)',
                color: '#2dd4bf',
                marginBottom: '14px',
                boxShadow: '0 0 20px rgba(20, 184, 166, 0.25)',
              }}>
                {mode === 'login' ? <LogIn size={26} /> : <UserPlus size={26} />}
              </div>
              <h2 style={{ fontSize: '24px', fontWeight: 700, margin: '0 0 6px 0', letterSpacing: '-0.5px' }}>
                {mode === 'login' ? 'Sign In to ReconX' : 'Create Reviewer Account'}
              </h2>
              <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>
                {mode === 'login'
                  ? 'Access your private clinical reconciliation workspace'
                  : 'Each user receives an isolated, dedicated dashboard'}
              </p>
            </div>

            {/* Tab Toggle */}
            <div style={{
              display: 'flex',
              background: 'rgba(255, 255, 255, 0.06)',
              borderRadius: '12px',
              padding: '4px',
              marginBottom: '20px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}>
              <button
                type="button"
                onClick={() => { setMode('login'); setErrorMsg(null); }}
                style={{
                  flex: 1,
                  padding: '8px 14px',
                  border: 'none',
                  borderRadius: '9px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  backgroundColor: mode === 'login' ? 'rgba(20, 184, 166, 0.2)' : 'transparent',
                  color: mode === 'login' ? '#2dd4bf' : '#94a3b8',
                  boxShadow: mode === 'login' ? '0 2px 8px rgba(0,0,0,0.3)' : 'none',
                  transition: 'all 0.2s',
                }}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setMode('signup'); setErrorMsg(null); }}
                style={{
                  flex: 1,
                  padding: '8px 14px',
                  border: 'none',
                  borderRadius: '9px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  backgroundColor: mode === 'signup' ? 'rgba(20, 184, 166, 0.2)' : 'transparent',
                  color: mode === 'signup' ? '#2dd4bf' : '#94a3b8',
                  boxShadow: mode === 'signup' ? '0 2px 8px rgba(0,0,0,0.3)' : 'none',
                  transition: 'all 0.2s',
                }}
              >
                New Sign Up
              </button>
            </div>

            {/* Error Notification */}
            {errorMsg && (
              <div style={{
                padding: '10px 14px',
                borderRadius: '10px',
                backgroundColor: 'rgba(244, 63, 94, 0.15)',
                border: '1px solid rgba(244, 63, 94, 0.35)',
                color: '#fda4af',
                fontSize: '12px',
                marginBottom: '16px',
                lineHeight: 1.4,
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px',
              }}>
                <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Success / Email Confirmed Notification */}
            {successMsg && (
              <div style={{
                padding: '12px 14px',
                borderRadius: '10px',
                backgroundColor: 'rgba(52, 211, 153, 0.15)',
                border: '1px solid rgba(52, 211, 153, 0.35)',
                color: '#a7f3d0',
                fontSize: '13px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                lineHeight: 1.4,
              }}>
                <CheckCircle2 size={18} color="#34d399" style={{ flexShrink: 0 }} />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {mode === 'signup' && (
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                    Full Name / Reviewer Title
                  </label>
                  <div style={{ position: 'relative' }}>
                    <User size={16} color="#64748b" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                      type="text"
                      placeholder="e.g. Dr. Jane Smith"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '11px 12px 11px 38px',
                        borderRadius: '10px',
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        color: '#ffffff',
                        fontSize: '14px',
                        outline: 'none',
                      }}
                    />
                  </div>
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                  Work Email
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} color="#64748b" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="email"
                    required
                    placeholder="name@organization.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '11px 12px 11px 38px',
                      borderRadius: '10px',
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      color: '#ffffff',
                      fontSize: '14px',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} color="#64748b" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '11px 12px 11px 38px',
                      borderRadius: '10px',
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      color: '#ffffff',
                      fontSize: '14px',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
                style={{
                  padding: '13px',
                  fontSize: '14px',
                  borderRadius: '10px',
                  fontWeight: 600,
                  marginTop: '8px',
                  boxShadow: '0 4px 18px rgba(13, 148, 136, 0.4)',
                }}
              >
                {loading
                  ? 'Processing...'
                  : mode === 'login'
                  ? 'Sign In & Enter Dashboard'
                  : 'Create Reviewer Account'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
