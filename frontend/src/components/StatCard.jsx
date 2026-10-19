export default function StatCard({ title, value, subtitle, icon: Icon, color = 'blue' }) {
  const colorMap = {
    blue: { bg: '#eff6ff', text: '#2563eb', border: '#bfdbfe' },
    teal: { bg: '#f0fdfa', text: '#0d9488', border: '#99f6e4' },
    emerald: { bg: '#ecfdf5', text: '#059669', border: '#a7f3d0' },
    amber: { bg: '#fffbeb', text: '#d97706', border: '#fde68a' },
    rose: { bg: '#fff1f2', text: '#e11d48', border: '#fecdd3' },
  };

  const scheme = colorMap[color] || colorMap.blue;

  return (
    <div className="card" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
      <div>
        <div style={{ fontSize: '13px', color: 'var(--navy-600)', fontWeight: 500, marginBottom: '6px' }}>
          {title}
        </div>
        <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--navy-900)', lineHeight: 1.1 }}>
          {value}
        </div>
        {subtitle && (
          <div style={{ fontSize: '12px', color: 'var(--slate-400)', marginTop: '6px' }}>
            {subtitle}
          </div>
        )}
      </div>
      {Icon && (
        <div style={{
          padding: '10px',
          borderRadius: 'var(--radius-md)',
          backgroundColor: scheme.bg,
          color: scheme.text,
          border: `1px solid ${scheme.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <Icon size={20} />
        </div>
      )}
    </div>
  );
}
