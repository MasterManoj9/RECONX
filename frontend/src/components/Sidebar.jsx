import { 
  LayoutDashboard, 
  GitCompare, 
  AlertTriangle, 
  CheckSquare, 
  History, 
  FileSpreadsheet,
  Activity
} from 'lucide-react';
import logoImg from '../assets/logo.png';

const navItems = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'reconciliation', label: 'Reconciliation', icon: GitCompare },
  { id: 'findings', label: 'Findings', icon: AlertTriangle },
  { id: 'review_queue', label: 'Review Queue', icon: CheckSquare },
  { id: 'audit_trail', label: 'Audit Trail', icon: History },
  { id: 'reports', label: 'Reports', icon: FileSpreadsheet },
];

export default function Sidebar({ currentTab, onSelectTab, findingsCount, pendingReviewCount }) {
  return (
    <aside style={{
      width: '260px',
      backgroundColor: 'var(--navy-950)',
      color: '#fff',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
      borderRight: '1px solid var(--navy-800)',
    }}>
      {/* Brand Header */}
      <div 
        onClick={() => onSelectTab('overview')}
        style={{
          padding: '20px 18px',
          borderBottom: '1px solid var(--navy-800)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          cursor: 'pointer',
        }}
        title="Click to view Overview Dashboard"
      >
        <img 
          src={logoImg} 
          alt="ReconX Logo" 
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            objectFit: 'contain',
            backgroundColor: '#ffffff',
            padding: '2px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
          }} 
        />
        <div>
          <div style={{ fontWeight: '700', fontSize: '18px', letterSpacing: '-0.5px' }}>
            Recon<span style={{ color: 'var(--teal-400)' }}>X</span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--slate-400)' }}>
            Clinical Data Intelligence
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ padding: '16px 12px', flex: 1 }}>
        <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => onSelectTab(item.id)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    border: 'none',
                    backgroundColor: isActive ? 'var(--navy-800)' : 'transparent',
                    color: isActive ? '#fff' : 'var(--slate-300)',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: isActive ? 600 : 500,
                    textAlign: 'left',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Icon size={18} color={isActive ? 'var(--teal-400)' : 'var(--slate-400)'} />
                    <span>{item.label}</span>
                  </div>

                  {item.id === 'findings' && findingsCount > 0 && (
                    <span style={{
                      backgroundColor: 'var(--rose-500)',
                      color: '#fff',
                      fontSize: '11px',
                      padding: '2px 7px',
                      borderRadius: '9999px',
                      fontWeight: 600,
                    }}>
                      {findingsCount}
                    </span>
                  )}

                  {item.id === 'review_queue' && pendingReviewCount > 0 && (
                    <span style={{
                      backgroundColor: 'var(--amber-500)',
                      color: '#fff',
                      fontSize: '11px',
                      padding: '2px 7px',
                      borderRadius: '9999px',
                      fontWeight: 600,
                    }}>
                      {pendingReviewCount}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer Info */}
      <div style={{
        padding: '16px 20px',
        borderTop: '1px solid var(--navy-800)',
        fontSize: '11px',
        color: 'var(--slate-400)',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      }}>
        <Activity size={14} color="var(--teal-400)" />
        <span>Deterministic Rule Engine v1.0</span>
      </div>
    </aside>
  );
}
