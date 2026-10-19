import { useState } from 'react';
import { Search, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';

export default function FindingsTable({ findings = [], onSelectFinding, selectedFindingId }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortField, setSortField] = useState('finding_id');
  const [sortAsc, setSortAsc] = useState(true);

  // Distinct categories
  const categories = ['ALL', ...Array.from(new Set(findings.map((f) => f.discrepancy_type).filter(Boolean)))];

  // Filtering
  const filtered = findings.filter((f) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      !searchTerm ||
      (f.finding_id && f.finding_id.toLowerCase().includes(q)) ||
      (f.sample_id && f.sample_id.toLowerCase().includes(q)) ||
      (f.participant_id && f.participant_id.toLowerCase().includes(q)) ||
      (f.description && f.description.toLowerCase().includes(q));

    const matchesCategory = categoryFilter === 'ALL' || f.discrepancy_type === categoryFilter;
    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'NEEDS_REVIEW' && f.review_status === 'Needs Review') ||
      (statusFilter === 'REVIEWED' && f.review_status !== 'Needs Review');

    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Sorting
  const sorted = [...filtered].sort((a, b) => {
    const aVal = a[sortField] || '';
    const bVal = b[sortField] || '';
    if (aVal < bVal) return sortAsc ? -1 : 1;
    if (aVal > bVal) return sortAsc ? 1 : -1;
    return 0;
  });

  const handleSort = (field) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const getSeverityBadge = (sev) => {
    switch (sev) {
      case 'HIGH':
        return <span className="badge badge-danger">HIGH</span>;
      case 'MEDIUM':
        return <span className="badge badge-warning">MEDIUM</span>;
      default:
        return <span className="badge badge-info">LOW</span>;
    }
  };

  const getStatusBadge = (status) => {
    if (status === 'Needs Review') {
      return <span className="badge badge-warning">Needs Review</span>;
    }
    return <span className="badge badge-success">{status}</span>;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Controls */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '12px',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        {/* Search */}
        <div style={{ position: 'relative', width: '320px' }}>
          <Search size={16} color="var(--slate-400)" style={{ position: 'absolute', left: '12px', top: '10px' }} />
          <input
            type="text"
            className="form-input"
            placeholder="Search by ID, participant, or sample..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '36px' }}
          />
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <select
            className="form-select"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            style={{ width: '220px' }}
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c === 'ALL' ? 'All Discrepancy Types' : c}
              </option>
            ))}
          </select>

          <select
            className="form-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ width: '160px' }}
          >
            <option value="ALL">All Statuses</option>
            <option value="NEEDS_REVIEW">Needs Review</option>
            <option value="REVIEWED">Reviewed</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="clinical-table">
          <thead>
            <tr>
              <th onClick={() => handleSort('finding_id')} style={{ cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  Finding ID
                  {sortField === 'finding_id' && (sortAsc ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                </div>
              </th>
              <th onClick={() => handleSort('discrepancy_type')} style={{ cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  Type
                  {sortField === 'discrepancy_type' && (sortAsc ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                </div>
              </th>
              <th>Participant / Sample</th>
              <th onClick={() => handleSort('severity')} style={{ cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  Priority
                  {sortField === 'severity' && (sortAsc ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                </div>
              </th>
              <th>Factual Description</th>
              <th onClick={() => handleSort('review_status')} style={{ cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  Review Status
                  {sortField === 'review_status' && (sortAsc ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--slate-400)' }}>
                  <AlertCircle size={24} style={{ margin: '0 auto 8px' }} />
                  <div>No discrepancies match the selected criteria.</div>
                </td>
              </tr>
            ) : (
              sorted.map((f) => {
                const isSelected = selectedFindingId === f.finding_id;
                return (
                  <tr
                    key={f.finding_id}
                    onClick={() => onSelectFinding(f)}
                    style={{
                      backgroundColor: isSelected ? 'var(--teal-50)' : undefined,
                      borderLeft: isSelected ? '3px solid var(--teal-600)' : '3px solid transparent',
                    }}
                  >
                    <td className="mono" style={{ fontWeight: 600 }}>{f.finding_id}</td>
                    <td>
                      <span className="badge badge-neutral">{f.discrepancy_type}</span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{f.participant_id || '—'}</div>
                      <div className="mono" style={{ color: 'var(--slate-400)' }}>{f.sample_id || '—'}</div>
                    </td>
                    <td>{getSeverityBadge(f.severity)}</td>
                    <td style={{ maxWidth: '340px', whiteSpace: 'normal' }}>
                      {f.description}
                    </td>
                    <td>{getStatusBadge(f.review_status)}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div style={{ fontSize: '12px', color: 'var(--slate-400)', display: 'flex', justifyContent: 'space-between' }}>
        <span>Showing {sorted.length} of {findings.length} findings</span>
        <span>Click any row to inspect source evidence and review rationale</span>
      </div>
    </div>
  );
}
