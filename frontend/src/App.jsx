import { useEffect, useState } from 'react';
import Sidebar from './components/Sidebar';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Reconciliation from './pages/Reconciliation';
import Findings from './pages/Findings';
import ReviewQueue from './pages/ReviewQueue';
import AuditTrail from './pages/AuditTrail';
import Reports from './pages/Reports';
import FindingDetail from './components/FindingDetail';
import AuthModal from './components/AuthModal';
import { 
  fetchHealth, 
  submitFindingReview, 
  getStoredSession, 
  signOutUser, 
  fetchUserLatestReconciliation 
} from './services/api';
import { LogOut } from 'lucide-react';
import logoImg from './assets/logo.png';
import './index.css';

export default function App() {
  const [currentTab, setCurrentTab] = useState('home');
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [reconResult, setReconResult] = useState(null);
  const [selectedFinding, setSelectedFinding] = useState(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Check stored session on mount
  useEffect(() => {
    getStoredSession().then((user) => {
      if (user) {
        setCurrentUser(user);
        fetchUserLatestReconciliation(user.id).then((recon) => {
          if (recon) setReconResult(recon);
        });
      }
    });

    // Health ping
    fetchHealth().catch(() => {});
  }, []);

  const handleAuthSuccess = async (user) => {
    setCurrentUser(user);
    // User isolation: fetch only this user's reconciliation run
    const userRecon = await fetchUserLatestReconciliation(user.id);
    setReconResult(userRecon || null);
    setCurrentTab('overview');
  };

  const handleSignOut = async () => {
    await signOutUser();
    setCurrentUser(null);
    setReconResult(null);
    setSelectedFinding(null);
    setCurrentTab('home');
  };

  const handleEnterDashboard = () => {
    if (currentUser) {
      setCurrentTab('overview');
    } else {
      setIsAuthOpen(true);
    }
  };

  const handleStartRecon = () => {
    if (currentUser) {
      setCurrentTab('reconciliation');
    } else {
      setIsAuthOpen(true);
    }
  };

  const handleReconciliationComplete = (result) => {
    setReconResult(result);
    setCurrentTab('overview');
  };

  const handleReviewSubmitted = async (reviewData) => {
    const reviewerName = currentUser?.displayName || currentUser?.email || 'Clinical Data Reviewer';
    await submitFindingReview({
      ...reviewData,
      reviewerId: reviewerName,
      reconciliationId: reconResult?.reconciliation_id,
    });

    // Update local state finding immediately
    if (reconResult) {
      const updatedFindings = reconResult.discrepancies.map((f) => {
        if (f.finding_id === reviewData.findingId) {
          return {
            ...f,
            review_status: reviewData.decision,
            reviewed_by: reviewerName,
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
          reviewed_by: reviewerName,
          reviewer_rationale: reviewData.rationale,
          reviewed_at: new Date().toISOString(),
        });
      }
    }
  };

  const findings = reconResult?.discrepancies || [];
  const pendingCount = findings.filter((f) => f.review_status === 'Needs Review').length;

  // 1. Full-screen Home View
  if (currentTab === 'home') {
    return (
      <>
        <Home 
          onEnterDashboard={handleEnterDashboard}
          onStartRecon={handleStartRecon}
          currentUser={currentUser}
          onOpenAuth={() => setIsAuthOpen(true)}
          onSignOut={handleSignOut}
        />
        <AuthModal
          isOpen={isAuthOpen}
          onClose={() => setIsAuthOpen(false)}
          onSuccess={handleAuthSuccess}
        />
      </>
    );
  }

  // 2. Clinical Intelligence Dashboard & Workspace View
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
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      {/* Main Content Area */}
      <div className="main-content">
        {/* Top Header */}
        <header className="top-header">
          <div className="header-left">
            <button
              type="button"
              onClick={() => setCurrentTab('overview')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                padding: '4px 8px',
                borderRadius: '6px',
              }}
              title="Overview Dashboard"
            >
              <img 
                src={logoImg} 
                alt="Logo" 
                style={{ width: '28px', height: '28px', borderRadius: '6px', objectFit: 'contain' }} 
              />
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--navy-900)' }}>
                ReconX Studio
              </span>
            </button>
            <span style={{ color: 'var(--slate-300)' }}>•</span>
            <span style={{ fontSize: '12px', color: 'var(--slate-400)' }}>
              Protocol: RCX-101 (Phase II Oncology Synthetic Trial)
            </span>
          </div>

          <div className="header-right">
            {/* Authenticated User Profile */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: 'rgba(20, 184, 166, 0.15)',
                color: 'var(--teal-600)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '13px',
                border: '1px solid rgba(20, 184, 166, 0.3)',
              }}>
                {(currentUser?.displayName || currentUser?.email || 'U').charAt(0).toUpperCase()}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontWeight: 600, color: 'var(--navy-900)', fontSize: '13px', lineHeight: 1.2 }}>
                  {currentUser?.displayName || currentUser?.email || 'Clinical Reviewer'}
                </span>
                <span style={{ fontSize: '11px', color: 'var(--slate-400)', lineHeight: 1.2 }}>
                  {currentUser?.email || 'Authenticated Reviewer'}
                </span>
              </div>
            </div>

            <span style={{ color: 'var(--slate-300)' }}>|</span>

            {/* Logout Action */}
            <button
              type="button"
              onClick={handleSignOut}
              className="btn btn-secondary"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                fontSize: '12px',
                borderRadius: '6px',
              }}
              title="Sign Out of Session"
            >
              <LogOut size={14} />
              <span>Log Out</span>
            </button>
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
            <Reconciliation 
              onReconciliationComplete={handleReconciliationComplete}
              userId={currentUser?.id}
            />
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

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
}
