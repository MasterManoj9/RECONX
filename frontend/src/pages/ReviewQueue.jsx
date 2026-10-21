import { useState } from 'react';
import { AlertCircle, CheckCircle, ShieldCheck, Sparkles } from 'lucide-react';
import FindingsTable from '../components/FindingsTable';

export default function ReviewQueue({ findings = [], onSelectFinding, selectedFindingId }) {
  const [activeFilter, setActiveFilter] = useState('pending'); // 'pending' | 'reviewed' | 'all'

  const pendingFindings = findings.filter((f) => f.review_status === 'Needs Review');
  const reviewedFindings = findings.filter((f) => f.review_status !== 'Needs Review');

  const displayedFindings = 
    activeFilter === 'pending'
      ? pendingFindings
      : activeFilter === 'reviewed'
      ? reviewedFindings
      : findings;

  const isAllReviewed = findings.length > 0 && pendingFindings.length === 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--navy-900)', margin: 0 }}>
          Human Review Queue
        </h1>
        <div style={{ fontSize: '13px', color: 'var(--slate-400)', marginTop: '4px' }}>
          Human-in-the-loop clinical adjudication. Under 21 CFR Part 11, discrepancies are never auto-resolved without explicit human reviewer sign-off.
        </div>
      </div>

      {/* Completion Milestone Banner */}
      {isAllReviewed && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '18px 24px',
          backgroundColor: '#ecfdf5',
          border: '1px solid #6ee7b7',
          borderRadius: '12px',
          color: '#065f46',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              backgroundColor: '#d1fae5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <ShieldCheck size={22} color="#059669" />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '15px' }}>
                Reconciliation Adjudication Complete
              </div>
              <div style={{ fontSize: '13px', color: '#047857' }}>
                All {findings.length} findings have been reviewed and documented with auditable reviewer rationales.
              </div>
            </div>
          </div>
          <span style={{
            padding: '6px 14px',
            borderRadius: '9999px',
            backgroundColor: '#059669',
            color: '#ffffff',
            fontSize: '12px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}>
            <Sparkles size={14} />
            <span>Audit-Ready Sign-off</span>
          </span>
        </div>
      )}

      {/* Queue Stat Banners with Clickable Filters */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div 
          onClick={() => setActiveFilter('pending')}
          className="card" 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '14px', 
            borderLeft: '4px solid #f59e0b',
            cursor: 'pointer',
            backgroundColor: activeFilter === 'pending' ? 'rgba(245, 158, 11, 0.05)' : '#fff',
            boxShadow: activeFilter === 'pending' ? '0 0 0 2px rgba(245, 158, 11, 0.25)' : 'var(--shadow-sm)',
          }}
        >
          <AlertCircle size={24} color="#f59e0b" />
          <div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--navy-900)' }}>
              {pendingFindings.length} Pending Adjudication
            </div>
            <div style={{ fontSize: '12px', color: 'var(--slate-400)' }}>
              Awaiting clinical data reviewer rationale and decision.
            </div>
          </div>
        </div>

        <div 
          onClick={() => setActiveFilter('reviewed')}
          className="card" 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '14px', 
            borderLeft: '4px solid #10b981',
            cursor: 'pointer',
            backgroundColor: activeFilter === 'reviewed' ? 'rgba(16, 185, 129, 0.05)' : '#fff',
            boxShadow: activeFilter === 'reviewed' ? '0 0 0 2px rgba(16, 185, 129, 0.25)' : 'var(--shadow-sm)',
          }}
        >
          <CheckCircle size={24} color="#10b981" />
          <div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--navy-900)' }}>
              {reviewedFindings.length} Adjudicated Findings
            </div>
            <div style={{ fontSize: '12px', color: 'var(--slate-400)' }}>
              Logged in audit trail with immutable reviewer rationale.
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Table Container */}
      <div className="card">
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '16px',
        }}>
          <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--navy-900)' }}>
            {activeFilter === 'pending' && 'Items Requiring Human Review'}
            {activeFilter === 'reviewed' && 'Adjudicated Findings (Completed Reviews)'}
            {activeFilter === 'all' && 'All Reconciliation Findings'}
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={() => setActiveFilter('pending')}
              className={`btn ${activeFilter === 'pending' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '6px 12px', fontSize: '12px' }}
            >
              Pending ({pendingFindings.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('reviewed')}
              className={`btn ${activeFilter === 'reviewed' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '6px 12px', fontSize: '12px' }}
            >
              Adjudicated ({reviewedFindings.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('all')}
              className={`btn ${activeFilter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '6px 12px', fontSize: '12px' }}
            >
              All ({findings.length})
            </button>
          </div>
        </div>

        <FindingsTable
          findings={displayedFindings}
          onSelectFinding={onSelectFinding}
          selectedFindingId={selectedFindingId}
        />
      </div>
    </div>
  );
}
