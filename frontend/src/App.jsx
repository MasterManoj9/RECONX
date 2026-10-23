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
import AISettingsModal from './components/AISettingsModal';
import { 
  fetchHealth, 
  submitFindingReview, 
  getStoredSession, 
  signOutUser, 
  fetchUserLatestReconciliation 
} from './services/api';
import { LogOut, Sparkles } from 'lucide-react';
import logoImg from './assets/logo.png';
import './index.css';

export default function App() {
  const [currentTab, setCurrentTab] = useState('home');
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isAISettingsOpen, setIsAISettingsOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [authMessage, setAuthMessage] = useState(null);
  const [authEmail, setAuthEmail] = useState('');
  const [reconResult, setReconResult] = useState(null);
  const [selectedFinding, setSelectedFinding] = useState(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Check stored session or email confirmation callback on mount
  useEffect(() => {
    const hash = window.location.hash || '';
    const search = window.location.search || '';

    // Check for Supabase error returned in redirect
    const hasAuthError = hash.includes('error=') || search.includes('error=');
    if (hasAuthError) {
      window.history.replaceState({}, document.title, window.location.pathname);
      signOutUser().finally(() => {
        setCurrentUser(null);
        setCurrentTab('home');
        setAuthMode('login');
        setAuthMessage(null);
        setIsAuthOpen(true);
      });
      return;
    }

    // Detect if returning from Supabase confirmation email redirect
    const isVerificationRedirect = 
      search.includes('verified=true') || 
      hash.includes('type=signup') || 
      search.includes('type=signup') ||
      hash.includes('type=email_change') ||
      hash.includes('confirmation_token=');

    if (isVerificationRedirect) {
      window.history.replaceState({}, document.title, window.location.pathname);

      // Extract verified email if Supabase minted a session, then force sign out
      getStoredSession().then(async (tempUser) => {
        const confirmedEmail = tempUser?.email || '';
        await signOutUser();
        setCurrentUser(null);
        setCurrentTab('home');
        setAuthMode('login');
        if (confirmedEmail) setAuthEmail(confirmedEmail);
        setAuthMessage('Email confirmed successfully! Please sign in with your credentials to access your dashboard.');
        setIsAuthOpen(true);
      }).catch(async () => {
        await signOutUser();
        setCurrentUser(null);
        setCurrentTab('home');
        setAuthMode('login');
        setAuthMessage('Email confirmed successfully! Please sign in with your credentials to access your dashboard.');
        setIsAuthOpen(true);
      });
      return;
    }

    // Regular session retrieval
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

  const handleOpenAuth = (mode = 'login') => {
    setAuthMode(mode);
    setAuthMessage(null);
    setIsAuthOpen(true);
  };

  const handleEnterDashboard = () => {
    if (currentUser) {
      setCurrentTab('overview');
    } else {
      handleOpenAuth('login');
    }
  };

  const handleStartRecon = () => {
    if (currentUser) {
      setCurrentTab('reconciliation');
    } else {
      handleOpenAuth('login');
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
          onOpenAuth={() => handleOpenAuth('login')}
          onSignOut={handleSignOut}
        />
        <AuthModal
          isOpen={isAuthOpen}
          onClose={() => {
            setIsAuthOpen(false);
            setAuthMessage(null);
          }}
          onSuccess={handleAuthSuccess}
          initialMode={authMode}
          initialMessage={authMessage}
          initialEmail={authEmail}
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

            {/* Gemini AI Settings */}
            <button
              type="button"
              onClick={() => setIsAISettingsOpen(true)}
              className="btn btn-secondary"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                fontSize: '12px',
                borderRadius: '6px',
                color: 'var(--teal-600)',
                backgroundColor: 'var(--teal-50)',
                border: '1px solid var(--teal-200)',
              }}
              title="Configure Google Gemini NLP"
            >
              <Sparkles size={14} />
              <span>Gemini AI</span>
            </button>

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
              onOpenAISettings={() => setIsAISettingsOpen(true)}
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
          onOpenAISettings={() => setIsAISettingsOpen(true)}
        />
      )}

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => {
          setIsAuthOpen(false);
          setAuthMessage(null);
        }}
        onSuccess={handleAuthSuccess}
        initialMode={authMode}
        initialMessage={authMessage}
        initialEmail={authEmail}
      />

      {/* Gemini AI Settings Modal */}
      <AISettingsModal
        isOpen={isAISettingsOpen}
        onClose={() => setIsAISettingsOpen(false)}
      />
    </div>
  );
}
