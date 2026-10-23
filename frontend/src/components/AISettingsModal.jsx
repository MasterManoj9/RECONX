import { useState } from 'react';
import { Sparkles, X, Key, CheckCircle2, AlertCircle, ExternalLink } from 'lucide-react';
import { getGeminiApiKey, setGeminiApiKey, validateGeminiKey } from '../services/geminiNLP';

export default function AISettingsModal({ isOpen, onClose }) {
  const [apiKey, setApiKey] = useState(getGeminiApiKey());
  const [status, setStatus] = useState(null); // { type: 'success' | 'error' | 'loading', message: '' }
  const [testing, setTesting] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    setGeminiApiKey(apiKey);
    setStatus({
      type: 'success',
      message: apiKey.trim()
        ? 'Gemini API Key saved to browser storage!'
        : 'Gemini Key cleared. System running in smart semantic fallback mode.',
    });
    setTimeout(() => {
      onClose();
    }, 1000);
  };

  const handleTestKey = async () => {
    if (!apiKey.trim()) {
      setStatus({ type: 'error', message: 'Please enter a Gemini API Key first.' });
      return;
    }
    setTesting(true);
    setStatus({ type: 'loading', message: 'Validating key with Google Gemini...' });
    const result = await validateGeminiKey(apiKey.trim());
    setTesting(false);
    if (result.valid) {
      setGeminiApiKey(apiKey);
      setStatus({ type: 'success', message: 'Gemini Key connected and verified successfully!' });
    } else {
      setStatus({ type: 'error', message: result.message });
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 1100,
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
        maxWidth: '480px',
        background: 'rgba(15, 23, 42, 0.95)',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        borderRadius: '24px',
        padding: '32px',
        boxShadow: '0 25px 60px rgba(0, 0, 0, 0.85), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
        color: '#ffffff',
      }}>
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
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

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '46px',
            height: '46px',
            borderRadius: '14px',
            backgroundColor: 'rgba(20, 184, 166, 0.15)',
            border: '1px solid rgba(20, 184, 166, 0.35)',
            color: '#2dd4bf',
            boxShadow: '0 0 20px rgba(20, 184, 166, 0.25)',
          }}>
            <Sparkles size={24} />
          </div>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, margin: 0, letterSpacing: '-0.3px' }}>
              Google Gemini NLP Settings
            </h2>
            <p style={{ fontSize: '12px', color: '#94a3b8', margin: '2px 0 0 0' }}>
              Powers Natural Language Search & Site Query Generator
            </p>
          </div>
        </div>

        {/* Key Info Banner */}
        <div style={{
          padding: '12px 14px',
          borderRadius: '12px',
          backgroundColor: 'rgba(30, 41, 59, 0.7)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          fontSize: '12px',
          color: '#cbd5e1',
          marginBottom: '20px',
          lineHeight: 1.5,
        }}>
          <div>
            Get a 100% free API key from Google AI Studio:
          </div>
          <a
            href="https://aistudio.google.com/app/apikey"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              color: '#38bdf8',
              fontWeight: 600,
              textDecoration: 'none',
              marginTop: '6px',
            }}
          >
            <span>Generate Free Gemini Key (aistudio.google.com)</span>
            <ExternalLink size={13} />
          </a>
        </div>

        {/* Input */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '8px' }}>
            Gemini API Key
          </label>
          <div style={{ position: 'relative' }}>
            <Key size={16} color="#64748b" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="password"
              placeholder="AIzaSy..."
              value={apiKey}
              onChange={(e) => {
                setApiKey(e.target.value);
                setStatus(null);
              }}
              style={{
                width: '100%',
                padding: '11px 12px 11px 38px',
                borderRadius: '10px',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#ffffff',
                fontSize: '13px',
                outline: 'none',
              }}
            />
          </div>
        </div>

        {/* Status Notification */}
        {status && (
          <div style={{
            padding: '10px 14px',
            borderRadius: '10px',
            backgroundColor: status.type === 'success'
              ? 'rgba(52, 211, 153, 0.15)'
              : status.type === 'error'
              ? 'rgba(244, 63, 94, 0.15)'
              : 'rgba(56, 189, 248, 0.15)',
            border: `1px solid ${
              status.type === 'success'
                ? 'rgba(52, 211, 153, 0.35)'
                : status.type === 'error'
                ? 'rgba(244, 63, 94, 0.35)'
                : 'rgba(56, 189, 248, 0.35)'
            }`,
            color: status.type === 'success'
              ? '#a7f3d0'
              : status.type === 'error'
              ? '#fda4af'
              : '#bae6fd',
            fontSize: '12px',
            marginBottom: '18px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            {status.type === 'success' && <CheckCircle2 size={16} />}
            {status.type === 'error' && <AlertCircle size={16} />}
            {status.type === 'loading' && <Sparkles size={16} />}
            <span>{status.message}</span>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            disabled={testing}
            onClick={handleTestKey}
            style={{
              flex: 1,
              padding: '11px',
              borderRadius: '10px',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            {testing ? 'Testing...' : 'Test Connection'}
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="btn btn-primary"
            style={{
              flex: 1,
              padding: '11px',
              borderRadius: '10px',
              fontSize: '13px',
              fontWeight: 600,
            }}
          >
            Save Key
          </button>
        </div>
      </div>
    </div>
  );
}
