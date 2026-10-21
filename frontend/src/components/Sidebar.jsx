import { 
  LayoutDashboard, 
  GitCompare, 
  AlertTriangle, 
  CheckSquare, 
  History, 
  FileSpreadsheet,
  Activity,
  ChevronLeft,
  ChevronRight
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

export default function Sidebar({
  currentTab,
  onSelectTab,
  findingsCount,
  pendingReviewCount,
  isCollapsed,
  onToggleCollapse,
}) {
  return (
    <aside style={{
      width: isCollapsed ? '72px' : '260px',
      transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
      backgroundColor: 'var(--navy-950)',
      color: '#fff',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
      borderRight: '1px solid var(--navy-800)',
      position: 'relative',
    }}>
      {/* Brand Header */}
      <div style={{
        padding: isCollapsed ? '18px 0' : '18px 16px',
        borderBottom: '1px solid var(--navy-800)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: isCollapsed ? 'center' : 'space-between',
        height: '72px',
        boxSizing: 'border-box',
      }}>
        <div 
          onClick={() => onSelectTab('overview')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            cursor: 'pointer',
            overflow: 'hidden',
          }}
          title="ReconX Overview"
        >
          <img 
            src={logoImg} 
            alt="ReconX Logo" 
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              objectFit: 'contain',
              backgroundColor: '#ffffff',
              padding: '2px',
              flexShrink: 0,
            }} 
          />
          {!isCollapsed && (
            <div style={{ whiteSpace: 'nowrap' }}>
              <div style={{ fontWeight: '700', fontSize: '17px', letterSpacing: '-0.5px' }}>
                Recon<span style={{ color: 'var(--teal-400)' }}>X</span>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--slate-400)' }}>
                Clinical Intelligence
              </div>
            </div>
          )}
        </div>

        {/* Toggle Collapse Button */}
        <button
          type="button"
          onClick={onToggleCollapse}
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          style={{
            background: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '6px',
            color: 'var(--slate-300)',
            width: '26px',
            height: '26px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            flexShrink: 0,
            transition: 'background 0.2s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.12)')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.06)')}
        >
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      {/* Navigation */}
      <nav style={{ padding: isCollapsed ? '16px 8px' : '16px 12px', flex: 1 }}>
        <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => onSelectTab(item.id)}
                  title={item.label}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: isCollapsed ? 'center' : 'space-between',
                    padding: isCollapsed ? '10px 0' : '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    border: 'none',
                    backgroundColor: isActive ? 'var(--navy-800)' : 'transparent',
                    color: isActive ? '#fff' : 'var(--slate-300)',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: isActive ? 600 : 500,
                    textAlign: 'left',
                    position: 'relative',
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
                    {!isCollapsed && <span>{item.label}</span>}
                  </div>

                  {item.id === 'findings' && findingsCount > 0 && (
                    <span style={{
                      backgroundColor: 'var(--rose-500)',
                      color: '#fff',
                      fontSize: '11px',
                      padding: isCollapsed ? '2px 4px' : '2px 7px',
                      borderRadius: '9999px',
                      fontWeight: 600,
                      position: isCollapsed ? 'absolute' : 'static',
                      top: isCollapsed ? '4px' : 'auto',
                      right: isCollapsed ? '6px' : 'auto',
                    }}>
                      {findingsCount}
                    </span>
                  )}

                  {item.id === 'review_queue' && pendingReviewCount > 0 && (
                    <span style={{
                      backgroundColor: 'var(--amber-500)',
                      color: '#fff',
                      fontSize: '11px',
                      padding: isCollapsed ? '2px 4px' : '2px 7px',
                      borderRadius: '9999px',
                      fontWeight: 600,
                      position: isCollapsed ? 'absolute' : 'static',
                      top: isCollapsed ? '4px' : 'auto',
                      right: isCollapsed ? '6px' : 'auto',
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
        padding: isCollapsed ? '16px 0' : '16px 20px',
        borderTop: '1px solid var(--navy-800)',
        fontSize: '11px',
        color: 'var(--slate-400)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: isCollapsed ? 'center' : 'flex-start',
        gap: '8px',
      }}>
        <Activity size={14} color="var(--teal-400)" />
        {!isCollapsed && <span>Deterministic Rule Engine v1.0</span>}
      </div>
    </aside>
  );
}
