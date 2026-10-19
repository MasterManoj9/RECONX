import { 
  FileSpreadsheet, 
  Users, 
  CheckCircle, 
  AlertCircle, 
  ArrowUpRight
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import StatCard from '../components/StatCard';
import FindingsTable from '../components/FindingsTable';

export default function Dashboard({
  reconResult,
  onNavigateTab,
  onSelectFinding,
}) {
  const summary = reconResult?.summary || {
    total_ecrf_records: 0,
    total_lab_records: 0,
    matched_records: 0,
    total_discrepancies: 0,
    discrepancies_by_category: {},
    discrepancies_by_priority: {},
  };

  const findings = reconResult?.discrepancies || [];

  // Category chart data
  const categoryData = Object.entries(summary.discrepancies_by_category || {}).map(([key, count]) => ({
    name: key.replace(/_/g, ' '),
    count,
  }));

  // Review status chart data
  const statusCounts = findings.reduce(
    (acc, f) => {
      if (f.review_status === 'Needs Review') {
        acc.needsReview += 1;
      } else {
        acc.reviewed += 1;
      }
      return acc;
    },
    { needsReview: 0, reviewed: 0 }
  );

  const statusData = [
    { name: 'Needs Review', value: statusCounts.needsReview, color: '#f59e0b' },
    { name: 'Reviewed', value: statusCounts.reviewed, color: '#10b981' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Overview Header Banner */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '20px 24px',
        backgroundColor: '#fff',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--slate-200)',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--navy-900)', margin: 0 }}>
              Reconciliation Dashboard
            </h1>
            {reconResult && (
              <span className="badge badge-info">{reconResult.reconciliation_id}</span>
            )}
          </div>
          <div style={{ fontSize: '13px', color: 'var(--slate-400)', marginTop: '4px' }}>
            Study: <strong>RCX-101 (Synthetic Clinical Trial)</strong> • Engine: Deterministic Composite Key
          </div>
        </div>

        <button
          type="button"
          onClick={() => onNavigateTab('reconciliation')}
          className="btn btn-primary"
        >
          <span>New Reconciliation</span>
          <ArrowUpRight size={16} />
        </button>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        <StatCard
          title="Total eCRF Records"
          value={summary.total_ecrf_records}
          subtitle="Electronic Case Report Form"
          icon={FileSpreadsheet}
          color="teal"
        />
        <StatCard
          title="Total Lab Records"
          value={summary.total_lab_records}
          subtitle="Central Laboratory Manifest"
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Matched Compound Keys"
          value={summary.matched_records}
          subtitle="1:1 Study / Subject / Sample"
          icon={CheckCircle}
          color="emerald"
        />
        <StatCard
          title="Total Discrepancies"
          value={summary.total_discrepancies}
          subtitle={`${summary.discrepancies_by_priority?.HIGH || 0} High Priority Review`}
          icon={AlertCircle}
          color="rose"
        />
      </div>

      {/* Charts Section */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
        {/* Discrepancies by Category */}
        <div className="card">
          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--navy-900)', marginBottom: '16px' }}>
            Discrepancy Breakdown by Category
          </div>
          {categoryData.length > 0 ? (
            <div style={{ height: '220px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} margin={{ top: 10, right: 20, left: -20, bottom: 40 }}>
                  <XAxis 
                    dataKey="name" 
                    angle={-25} 
                    textAnchor="end" 
                    interval={0} 
                    tick={{ fontSize: 11, fill: 'var(--navy-600)' }} 
                  />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '6px', fontSize: '12px', border: '1px solid var(--slate-200)' }}
                  />
                  <Bar dataKey="count" fill="var(--teal-600)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--slate-400)', fontSize: '13px' }}>
              No discrepancy data available. Run a reconciliation to populate metrics.
            </div>
          )}
        </div>

        {/* Review Status Donut */}
        <div className="card">
          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--navy-900)', marginBottom: '16px' }}>
            Human Review Queue Status
          </div>
          {findings.length > 0 ? (
            <div style={{ height: '220px', width: '100%', position: 'relative' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '16px',
                fontSize: '12px',
                marginTop: '4px',
              }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#f59e0b' }} />
                  Needs Review: {statusCounts.needsReview}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981' }} />
                  Reviewed: {statusCounts.reviewed}
                </span>
              </div>
            </div>
          ) : (
            <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--slate-400)', fontSize: '13px' }}>
              No review records yet.
            </div>
          )}
        </div>
      </div>

      {/* Recent Findings Preview */}
      <div className="card">
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '16px',
        }}>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--navy-900)' }}>
              Recent Findings
            </div>
            <div style={{ fontSize: '12px', color: 'var(--slate-400)' }}>
              Deterministic discrepancies detected across loaded clinical datasets.
            </div>
          </div>
          {findings.length > 0 && (
            <button
              type="button"
              onClick={() => onNavigateTab('findings')}
              className="btn btn-secondary"
              style={{ fontSize: '12px', padding: '6px 12px' }}
            >
              View All {findings.length} Findings
            </button>
          )}
        </div>

        {findings.length > 0 ? (
          <FindingsTable
            findings={findings.slice(0, 5)}
            onSelectFinding={onSelectFinding}
          />
        ) : (
          <div style={{ padding: '30px', textAlign: 'center', color: 'var(--slate-400)', fontSize: '13px' }}>
            No findings recorded yet. Navigate to <strong>Reconciliation</strong> to upload and process datasets.
          </div>
        )}
      </div>
    </div>
  );
}
