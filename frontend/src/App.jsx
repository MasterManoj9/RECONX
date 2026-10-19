import { useEffect, useState } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Reconciliation from './pages/Reconciliation';
import Findings from './pages/Findings';
import ReviewQueue from './pages/ReviewQueue';
import AuditTrail from './pages/AuditTrail';
import Reports from './pages/Reports';
import FindingDetail from './components/FindingDetail';
import { fetchHealth, submitFindingReview } from './services/api';
import { UserCheck } from 'lucide-react';
import './index.css';

export default function App() {
  const [currentTab, setCurrentTab] = useState('overview');
  const [reconResult, setReconResult] = useState(null);
  const [selectedFinding, setSelectedFinding] = useState(null);
  const [backendStatus, setBackendStatus] = useState('checking'); // 'healthy' | 'unreachable' | 'checking'

  // Initial Health Check
  useEffect(() => {
    let isMounted = true;
    fetchHealth()
      .then(() => {
        if (isMounted) setBackendStatus('healthy');
      })
      .catch(() => {
        if (isMounted) setBackendStatus('unreachable');
      });

    const interval = setInterval(() => {
      fetchHealth()
        .then(() => {
          if (isMounted) setBackendStatus('healthy');
        })
        .catch(() => {
          if (isMounted) setBackendStatus('unreachable');
        });
    }, 15000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const handleReconciliationComplete = (result) => {
    setReconResult(result);
    setCurrentTab('overview');
  };

  const handleReviewSubmitted = async (reviewData) => {
    await submitFindingReview({
      ...reviewData,
      reconciliationId: reconResult?.reconciliation_id,
    });

    // Update local state finding immediately
    if (reconResult) {
      const updatedFindings = reconResult.discrepancies.map((f) => {
        if (f.finding_id === reviewData.findingId) {
          return {
            ...f,
            review_status: reviewData.decision,
            reviewed_by: reviewData.reviewerId,
            reviewer_rationale: reviewData.rationale,
            reviewed_at: new Date().toISOString(),
          };
        }
        return f;
      });

      setReconResult({
        ...reconResult,
        discrepancies: updatedFindings,
      });

      if (selectedFinding?.finding_id === reviewData.findingId) {
        setSelectedFinding({
          ...selectedFinding,
          review_status: reviewData.decision,
          reviewed_by: reviewData.reviewerId,
          reviewer_rationale: reviewData.rationale,
          reviewed_at: new Date().toISOString(),
        });
      }
    }
  };

  const findings = reconResult?.discrepancies || [];
  const pendingCount = findings.filter((f) => f.review_status === 'Needs Review').length;

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setCurrentTab(tab);
          setSelectedFinding(null);
        }}
        findingsCount={findings.length}
        pendingReviewCount={pendingCount}
      />

      {/* Main Content Area */}
      <div className="main-content">
        {/* Top Header */}
        <header className="top-header">
          <div className="header-left">
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--navy-900)' }}>
              ReconX Studio
            </span>
            <span style={{ color: 'var(--slate-300)' }}>•</span>
            <span style={{ fontSize: '12px', color: 'var(--slate-400)' }}>
              Protocol: RCX-101 (Phase II Oncology Synthetic Trial)
            </span>
          </div>

          <div className="header-right">
            {/* Backend Service Indicator */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor:
                    backendStatus === 'healthy'
                      ? '#10b981'
                      : backendStatus === 'checking'
                      ? '#f59e0b'
                      : '#f43f5e',
                }}
              />
              <span style={{ color: 'var(--navy-700)', fontWeight: 500 }}>
                {backendStatus === 'healthy'
                  ? 'FastAPI Connected'
                  : backendStatus === 'checking'
                  ? 'Checking API...'
                  : 'API Unreachable'}
              </span>
            </div>

            <span style={{ color: 'var(--slate-300)' }}>|</span>

            {/* User Indicator */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--navy-800)' }}>
              <UserCheck size={15} color="var(--teal-600)" />
              <span>Dr. E. Adams (Data Reviewer)</span>
            </div>
          </div>
        </header>

        {/* Tab Body */}
        <main className="page-body">
          {currentTab === 'overview' && (
            <Dashboard
              reconResult={reconResult}
              onNavigateTab={(tab) => setCurrentTab(tab)}
              onSelectFinding={(f) => setSelectedFinding(f)}
            />
          )}

          {currentTab === 'reconciliation' && (
            <Reconciliation onReconciliationComplete={handleReconciliationComplete} />
          )}

          {currentTab === 'findings' && (
            <Findings
              findings={findings}
              onSelectFinding={(f) => setSelectedFinding(f)}
              selectedFindingId={selectedFinding?.finding_id}
            />
          )}

          {currentTab === 'review_queue' && (
            <ReviewQueue
              findings={findings}
              onSelectFinding={(f) => setSelectedFinding(f)}
              selectedFindingId={selectedFinding?.finding_id}
            />
          )}

          {currentTab === 'audit_trail' && <AuditTrail />}

          {currentTab === 'reports' && <Reports reconResult={reconResult} />}
        </main>
      </div>

      {/* Slide-in Finding Detail Drawer */}
      {selectedFinding && (
        <FindingDetail
          finding={selectedFinding}
          onClose={() => setSelectedFinding(null)}
          onReviewSubmitted={handleReviewSubmitted}
        />
      )}
    </div>
  );
}
