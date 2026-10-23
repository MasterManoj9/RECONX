import { useState } from 'react';
import FindingsTable from '../components/FindingsTable';
import { Sparkles, Search, X, Loader2, Lightbulb, Filter } from 'lucide-react';
import { askReconXNLP, hasGeminiKey } from '../services/geminiNLP';

export default function Findings({ findings = [], onSelectFinding, selectedFindingId, onOpenAISettings }) {
  const [nlQuery, setNlQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState(null);
  const [activeFilterIds, setActiveFilterIds] = useState(null);

  const samplePrompts = [
    'Potassium & electrolyte mismatches',
    'Samples missing from Central Lab',
    'Unreviewed critical findings',
    'Collection date divergences',
  ];

  const handleAskAI = async (queryText) => {
    const q = (queryText || nlQuery).trim();
    if (!q) return;
    setLoading(true);
    setNlQuery(q);

    try {
      const res = await askReconXNLP(q, findings);
      setAiResponse(res);
      if (res.matchingFindingIds && res.matchingFindingIds.length > 0) {
        setActiveFilterIds(new Set(res.matchingFindingIds));
      } else {
        setActiveFilterIds(null);
      }
    } catch (err) {
      console.warn('NLP search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClearFilter = () => {
    setNlQuery('');
    setAiResponse(null);
    setActiveFilterIds(null);
  };

  // Apply active AI filter if present
  const displayedFindings = activeFilterIds
    ? findings.filter((f) => activeFilterIds.has(f.finding_id))
    : findings;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header & Title */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--navy-900)', margin: 0 }}>
            Clinical Discrepancy Findings
          </h1>
          <div style={{ fontSize: '13px', color: 'var(--slate-400)', marginTop: '4px' }}>
            Explore, filter, and investigate findings using deterministic rules or natural language search.
          </div>
        </div>

        {onOpenAISettings && (
          <button
            type="button"
            onClick={onOpenAISettings}
            className="btn btn-secondary"
            style={{ fontSize: '12px', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Sparkles size={14} color="#0d9488" />
            <span>{hasGeminiKey() ? 'Gemini NLP: Connected' : 'Connect Gemini Key'}</span>
          </button>
        )}
      </div>

      {/* Natural Language Search Bar Card */}
      <div style={{
        padding: '18px 20px',
        backgroundColor: '#fff',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--teal-200)',
        boxShadow: '0 4px 20px rgba(13, 148, 136, 0.06)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            color: '#0d9488',
            fontWeight: 700,
            fontSize: '13px',
          }}>
            <Sparkles size={16} />
            <span>Ask ReconX Natural Language AI</span>
          </div>
          <span style={{ fontSize: '11px', color: 'var(--slate-400)' }}>• Powered by Gemini NLP</span>
        </div>

        {/* Query Input */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAskAI();
          }}
          style={{ display: 'flex', gap: '10px' }}
        >
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={16} color="#0d9488" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Ask in plain English: 'Which subjects have potassium differences > 0.5?' or 'Summarize high-risk issues'..."
              value={nlQuery}
              onChange={(e) => setNlQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '11px 14px 11px 40px',
                borderRadius: '10px',
                border: '1px solid var(--slate-300)',
                fontSize: '13px',
                outline: 'none',
                backgroundColor: 'var(--slate-50)',
                color: 'var(--navy-900)',
                transition: 'border 0.2s',
              }}
              onFocus={(e) => (e.target.style.borderColor = 'var(--teal-500)')}
              onBlur={(e) => (e.target.style.borderColor = 'var(--slate-300)')}
            />
          </div>

          <button
            type="submit"
            disabled={loading || !nlQuery.trim()}
            className="btn btn-primary"
            style={{ padding: '0 20px', fontSize: '13px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            {loading ? <Loader2 size={16} className="spin" /> : <Sparkles size={16} />}
            <span>{loading ? 'Thinking...' : 'Ask AI'}</span>
          </button>
        </form>

        {/* Suggestion Chips */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px', alignItems: 'center' }}>
          <span style={{ fontSize: '11px', color: 'var(--slate-400)', fontWeight: 600 }}>Suggested:</span>
          {samplePrompts.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => handleAskAI(p)}
              style={{
                background: 'rgba(20, 184, 166, 0.08)',
                border: '1px solid rgba(20, 184, 166, 0.25)',
                color: '#0f766e',
                fontSize: '11px',
                padding: '4px 10px',
                borderRadius: '16px',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => (e.target.style.backgroundColor = 'rgba(20, 184, 166, 0.18)')}
              onMouseLeave={(e) => (e.target.style.backgroundColor = 'rgba(20, 184, 166, 0.08)')}
            >
              ⚡ {p}
            </button>
          ))}
        </div>

        {/* AI Answer & Filter Card */}
        {aiResponse && (
          <div style={{
            marginTop: '16px',
            padding: '16px',
            borderRadius: '12px',
            backgroundColor: '#f0fdfa',
            border: '1px solid #99f6e4',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="badge badge-success" style={{ fontSize: '11px' }}>
                  {aiResponse.provider || 'Gemini NLP'}
                </span>
                <span style={{ fontSize: '12px', color: '#0f766e', fontWeight: 600 }}>
                  Clinical Intelligence Response
                </span>
              </div>
              <button
                type="button"
                onClick={handleClearFilter}
                style={{
                  border: 'none',
                  background: 'transparent',
                  color: '#64748b',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '12px',
                }}
              >
                <X size={14} />
                <span>Clear Filter</span>
              </button>
            </div>

            <div style={{ fontSize: '13px', color: '#134e4a', lineHeight: 1.5, fontWeight: 500 }}>
              {aiResponse.answer}
            </div>

            {aiResponse.insights && aiResponse.insights.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' }}>
                {aiResponse.insights.map((ins, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#0f766e' }}>
                    <Lightbulb size={13} color="#0d9488" style={{ flexShrink: 0 }} />
                    <span>{ins}</span>
                  </div>
                ))}
              </div>
            )}

            {activeFilterIds && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: '8px',
                borderTop: '1px solid #ccfbf1',
                fontSize: '12px',
                color: '#0d9488',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Filter size={13} />
                  <span>Displaying <strong>{displayedFindings.length}</strong> matching finding(s) out of {findings.length}</span>
                </div>
                <button
                  type="button"
                  onClick={handleClearFilter}
                  style={{
                    color: '#0d9488',
                    textDecoration: 'underline',
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    fontSize: '11px',
                    fontWeight: 600,
                  }}
                >
                  Show all {findings.length} findings
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Findings Table */}
      <div className="card">
        <FindingsTable
          findings={displayedFindings}
          onSelectFinding={onSelectFinding}
          selectedFindingId={selectedFindingId}
        />
      </div>
    </div>
  );
}
