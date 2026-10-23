import { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  X, 
  Send, 
  Bot, 
  User, 
  Settings, 
  Key, 
  Check, 
  MessageSquare,
  HelpCircle
} from 'lucide-react';
import { sendChatMessage, getGeminiKey, setGeminiKey } from '../services/chatService';

let messageSeq = 0;
function getNextId(prefix = 'msg') {
  messageSeq += 1;
  return `${prefix}_${messageSeq}`;
}

export default function ReconXAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'assistant',
      text: "👋 **Hello! I'm your ReconX AI Assistant.**\n\nI can answer questions about your clinical data reconciliations, discrepancy rules, regulatory compliance (21 CFR Part 11 / ALCOA+), or anything else.\n\nPick a starter question below or type your own!",
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState(getGeminiKey());
  const [keySaved, setKeySaved] = useState(false);

  const messagesEndRef = useRef(null);

  const starterQuestions = [
    'What is ReconX and how does it work?',
    'How do I upload and reconcile eCRF vs Lab datasets?',
    'Explain the 11 clinical discrepancy rules.',
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (textToSend) => {
    const q = (textToSend || inputText).trim();
    if (!q || loading) return;

    const userMsg = {
      id: getNextId('usr'),
      sender: 'user',
      text: q,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setLoading(true);

    try {
      const reply = await sendChatMessage(q, messages);
      const botMsg = {
        id: getNextId('bot'),
        sender: 'assistant',
        text: reply.text,
        source: reply.source,
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      console.warn('Chat error:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: getNextId('bot_err'),
          sender: 'assistant',
          text: "I'm having trouble connecting right now. Please try asking again!",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveApiKey = () => {
    setGeminiKey(apiKeyInput);
    setKeySaved(true);
    setTimeout(() => {
      setKeySaved(false);
      setShowSettings(false);
    }, 1200);
  };

  // Format message text with basic markdown bolding & newlines
  const renderMessageContent = (text) => {
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      // Bold handling
      const parts = line.split(/(\*\*.*?\*\*)/g);
      return (
        <div key={idx} style={{ marginBottom: line.trim() === '' ? '6px' : '3px', minHeight: '14px' }}>
          {parts.map((p, pIdx) => {
            if (p.startsWith('**') && p.endsWith('**')) {
              return <strong key={pIdx} style={{ color: '#2dd4bf', fontWeight: 600 }}>{p.slice(2, -2)}</strong>;
            }
            return <span key={pIdx}>{p}</span>;
          })}
        </div>
      );
    });
  };

  return (
    <>
      {/* Floating Action Button (Bottom-Right) */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 999,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '12px 18px',
            borderRadius: '50px',
            backgroundColor: 'rgba(15, 23, 42, 0.92)',
            border: '1px solid rgba(45, 212, 191, 0.45)',
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.5), 0 0 20px rgba(20, 184, 166, 0.35)',
            backdropFilter: 'blur(12px)',
            cursor: 'pointer',
            color: '#ffffff',
            transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-3px) scale(1.03)';
            e.currentTarget.style.boxShadow = '0 12px 35px rgba(0, 0, 0, 0.6), 0 0 28px rgba(20, 184, 166, 0.5)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0) scale(1)';
            e.currentTarget.style.boxShadow = '0 8px 30px rgba(0, 0, 0, 0.5), 0 0 20px rgba(20, 184, 166, 0.35)';
          }}
          title="Open ReconX AI Assistant"
        >
          <div style={{ position: 'relative' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: 'rgba(20, 184, 166, 0.2)',
              border: '1px solid rgba(20, 184, 166, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#2dd4bf',
            }}>
              <Sparkles size={17} />
            </div>
            {/* Pulsing Green Dot */}
            <span style={{
              position: 'absolute',
              top: '-1px',
              right: '-1px',
              width: '9px',
              height: '9px',
              borderRadius: '50%',
              backgroundColor: '#10b981',
              boxShadow: '0 0 6px #10b981',
            }} />
          </div>

          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '-0.2px', color: '#f1f5f9' }}>
              ReconX AI
            </div>
            <div style={{ fontSize: '11px', color: '#94a3b8' }}>
              Ask assistant
            </div>
          </div>
        </button>
      )}

      {/* Floating Chat Modal Window */}
      {isOpen && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          width: '390px',
          maxWidth: 'calc(100vw - 32px)',
          height: '540px',
          maxHeight: 'calc(100vh - 80px)',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'rgba(15, 23, 42, 0.94)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: '20px',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8), 0 0 30px rgba(20, 184, 166, 0.25)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          overflow: 'hidden',
          animation: 'reconxFadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        }}>
          {/* Top Chat Header */}
          <div style={{
            padding: '14px 18px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            backgroundColor: 'rgba(30, 41, 59, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                position: 'relative',
                width: '34px',
                height: '34px',
                borderRadius: '10px',
                backgroundColor: 'rgba(20, 184, 166, 0.2)',
                border: '1px solid rgba(20, 184, 166, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#2dd4bf',
              }}>
                <Bot size={18} />
                <span style={{
                  position: 'absolute',
                  bottom: '-2px',
                  right: '-2px',
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: '#10b981',
                  boxShadow: '0 0 5px #10b981',
                }} />
              </div>

              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>ReconX AI Assistant</span>
                  <span style={{
                    fontSize: '9px',
                    fontWeight: 700,
                    padding: '2px 5px',
                    borderRadius: '4px',
                    backgroundColor: 'rgba(20, 184, 166, 0.2)',
                    color: '#2dd4bf',
                    border: '1px solid rgba(20, 184, 166, 0.3)',
                  }}>AI</span>
                </div>
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                  Online • Ask anything
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                type="button"
                onClick={() => setShowSettings(!showSettings)}
                style={{
                  background: showSettings ? 'rgba(20, 184, 166, 0.2)' : 'rgba(255, 255, 255, 0.06)',
                  border: 'none',
                  borderRadius: '8px',
                  width: '28px',
                  height: '28px',
                  color: showSettings ? '#2dd4bf' : '#94a3b8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                }}
                title="API Key Settings"
              >
                <Settings size={15} />
              </button>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                style={{
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: 'none',
                  borderRadius: '8px',
                  width: '28px',
                  height: '28px',
                  color: '#94a3b8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                }}
                title="Close Assistant"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Settings Drawer (if toggled) */}
          {showSettings && (
            <div style={{
              padding: '12px 16px',
              backgroundColor: 'rgba(30, 41, 59, 0.95)',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              fontSize: '11px',
              color: '#cbd5e1',
            }}>
              <div style={{ fontWeight: 600, color: '#f1f5f9', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Key size={13} color="#2dd4bf" />
                <span>Google Gemini API Key (Optional)</span>
              </div>
              <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '8px' }}>
                Add your free key for open-ended AI conversation, or leave empty to use built-in clinical intelligence.
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <input
                  type="password"
                  placeholder="Paste Gemini API key (AIzaSy...)"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '6px 10px',
                    borderRadius: '6px',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    backgroundColor: 'rgba(15, 23, 42, 0.8)',
                    color: '#ffffff',
                    fontSize: '11px',
                    outline: 'none',
                  }}
                />
                <button
                  type="button"
                  onClick={handleSaveApiKey}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: '#0d9488',
                    color: '#ffffff',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontSize: '11px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  {keySaved ? <Check size={12} /> : null}
                  <span>{keySaved ? 'Saved' : 'Save'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Messages Area */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}>
            {messages.map((m) => {
              const isUser = m.sender === 'user';
              return (
                <div
                  key={m.id}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '8px',
                    flexDirection: isUser ? 'row-reverse' : 'row',
                  }}
                >
                  {/* Avatar */}
                  <div style={{
                    width: '26px',
                    height: '26px',
                    borderRadius: '8px',
                    backgroundColor: isUser ? 'rgba(56, 189, 248, 0.2)' : 'rgba(20, 184, 166, 0.2)',
                    border: `1px solid ${isUser ? 'rgba(56, 189, 248, 0.4)' : 'rgba(20, 184, 166, 0.4)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: isUser ? '#38bdf8' : '#2dd4bf',
                    flexShrink: 0,
                    marginTop: '2px',
                  }}>
                    {isUser ? <User size={13} /> : <Bot size={13} />}
                  </div>

                  {/* Message Bubble */}
                  <div style={{
                    maxWidth: '82%',
                    padding: '10px 14px',
                    borderRadius: isUser ? '14px 4px 14px 14px' : '4px 14px 14px 14px',
                    backgroundColor: isUser ? 'rgba(13, 148, 136, 0.85)' : 'rgba(30, 41, 59, 0.85)',
                    border: `1px solid ${isUser ? 'rgba(45, 212, 191, 0.3)' : 'rgba(255, 255, 255, 0.08)'}`,
                    color: '#ffffff',
                    fontSize: '12px',
                    lineHeight: 1.5,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                    wordBreak: 'break-word',
                  }}>
                    {renderMessageContent(m.text)}
                  </div>
                </div>
              );
            })}

            {/* Starter Questions (Shown when only welcome message exists) */}
            {messages.length === 1 && (
              <div style={{
                marginTop: '6px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}>
                <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <HelpCircle size={12} color="#2dd4bf" />
                  <span>Frequently Asked Questions:</span>
                </div>
                {starterQuestions.map((sq, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleSend(sq)}
                    style={{
                      textAlign: 'left',
                      padding: '8px 12px',
                      borderRadius: '10px',
                      backgroundColor: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: '#cbd5e1',
                      fontSize: '11px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(20, 184, 166, 0.15)';
                      e.currentTarget.style.borderColor = 'rgba(20, 184, 166, 0.4)';
                      e.currentTarget.style.color = '#2dd4bf';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.04)';
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                      e.currentTarget.style.color = '#cbd5e1';
                    }}
                  >
                    <MessageSquare size={12} color="#2dd4bf" style={{ flexShrink: 0 }} />
                    <span>{sq}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Loading Indicator */}
            {loading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(20, 184, 166, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#2dd4bf',
                }}>
                  <Bot size={13} />
                </div>
                <div style={{
                  padding: '8px 12px',
                  borderRadius: '4px 14px 14px 14px',
                  backgroundColor: 'rgba(30, 41, 59, 0.85)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  color: '#94a3b8',
                  fontSize: '11px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}>
                  <Sparkles size={12} className="spin" color="#2dd4bf" />
                  <span>ReconX Assistant is typing...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Bottom Chat Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            style={{
              padding: '12px 14px',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              backgroundColor: 'rgba(15, 23, 42, 0.9)',
              display: 'flex',
              gap: '8px',
              alignItems: 'center',
            }}
          >
            <input
              type="text"
              placeholder="Ask anything..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={loading}
              style={{
                flex: 1,
                padding: '9px 12px',
                borderRadius: '10px',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                color: '#ffffff',
                fontSize: '12px',
                outline: 'none',
              }}
              onFocus={(e) => (e.target.style.borderColor = 'rgba(45, 212, 191, 0.5)')}
              onBlur={(e) => (e.target.style.borderColor = 'rgba(255, 255, 255, 0.12)')}
            />

            <button
              type="submit"
              disabled={loading || !inputText.trim()}
              style={{
                padding: '9px 14px',
                borderRadius: '10px',
                border: 'none',
                backgroundColor: inputText.trim() ? '#0d9488' : 'rgba(255, 255, 255, 0.08)',
                color: inputText.trim() ? '#ffffff' : '#64748b',
                cursor: inputText.trim() ? 'pointer' : 'default',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s',
              }}
              title="Send message"
            >
              <Send size={14} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
