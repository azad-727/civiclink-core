import React, { useEffect, useState, useCallback } from 'react';
import apiClient from '../apiClient';
import './AmcDashboard.css';

const CATEGORIES = [
  'Roads & Transit',
  'Public Safety',
  'Parks & Vandalism',
  'Sanitation & Waste',
];

// Statuses an officer can actively set. REJECTED_BY_AI is shown as a badge
// but isn't offered here since it's set automatically by the AI service.
const ASSIGNABLE_STATUSES = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'REJECTED'];

function StatusBadge({ status }) {
  const cls = `status-badge status-${(status || 'unknown').toLowerCase()}`;
  return <span className={cls}>{(status || 'UNKNOWN').replace(/_/g, ' ')}</span>;
}

export default function AmcDashboard() {
  const [stats, setStats] = useState(null);
  const [issues, setIssues] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savingId, setSavingId] = useState(null);
  const [draftStatuses, setDraftStatuses] = useState({});

  const loadStats = useCallback(async () => {
    try {
      const data = await apiClient.get('/issues/admin/stats');
      setStats(data);
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  }, []);

  const loadIssues = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      if (categoryFilter) params.set('category', categoryFilter);
      const query = params.toString() ? `?${params.toString()}` : '';
      const data = await apiClient.get(`/issues/admin/all${query}`);
      setIssues(data);
    } catch (err) {
      console.error('Failed to load issues:', err);
      setError(err.message || 'Failed to load issues.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, categoryFilter]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useEffect(() => {
    loadIssues();
  }, [loadIssues]);

  const handleDraftChange = (issueId, newStatus) => {
    setDraftStatuses((prev) => ({ ...prev, [issueId]: newStatus }));
  };

  const handleApplyStatus = async (issueId) => {
    const newStatus = draftStatuses[issueId];
    if (!newStatus) return;

    setSavingId(issueId);
    try {
      await apiClient.patch(`/issues/${issueId}/status?status=${newStatus}`);
      // Update in place rather than refetching the whole list
      setIssues((prev) =>
        prev.map((issue) => (issue.id === issueId ? { ...issue, status: newStatus } : issue))
      );
      loadStats();
    } catch (err) {
      console.error('Failed to update status:', err);
      alert(err.message || 'Failed to update status.');
    } finally {
      setSavingId(null);
    }
  };

  const statusCounts = stats?.byStatus || [];
  const totalIssues = stats?.totalIssues ?? '—';

  return (
    <div className="amc-dashboard">
      <div className="amc-header">
        <h1>AMC Officer Dashboard</h1>
        <p className="amc-subtitle">Review, filter, and update reported civic issues.</p>
      </div>

      <div className="amc-stats-row">
        <div className="amc-stat-card total">
          <span className="amc-stat-value">{totalIssues}</span>
          <span className="amc-stat-label">Total Issues</span>
        </div>
        {statusCounts.map((s) => (
          <div key={s.status} className="amc-stat-card">
            <span className="amc-stat-value">{s.count}</span>
            <span className="amc-stat-label">{(s.status || '').replace(/_/g, ' ')}</span>
          </div>
        ))}
      </div>

      <div className="amc-filters">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          {ASSIGNABLE_STATUSES.map((s) => (
            <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
          ))}
          <option value="REJECTED_BY_AI">REJECTED BY AI</option>
        </select>

        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
          <option value="">All Categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        <button className="amc-refresh-btn" onClick={loadIssues}>Refresh</button>
      </div>

      {error && <div className="amc-error">{error}</div>}

      <div className="amc-table-wrapper">
        {loading ? (
          <div className="amc-loading">Loading issues…</div>
        ) : issues.length === 0 ? (
          <div className="amc-empty">No issues match the selected filters.</div>
        ) : (
          <table className="amc-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Category</th>
                <th>Reported By</th>
                <th>Status</th>
                <th>Verifications</th>
                <th>Update Status</th>
              </tr>
            </thead>
            <tbody>
              {issues.map((issue) => (
                <tr key={issue.id}>
                  <td>
                    <a href={`/issue/${issue.id}`} target="_blank" rel="noreferrer">
                      {issue.title}
                    </a>
                  </td>
                  <td>{issue.category}</td>
                  <td>{issue.reportedBy}</td>
                  <td><StatusBadge status={issue.status} /></td>
                  <td>{issue.verificationCount ?? 0}</td>
                  <td className="amc-action-cell">
                    <select
                      value={draftStatuses[issue.id] ?? issue.status}
                      onChange={(e) => handleDraftChange(issue.id, e.target.value)}
                    >
                      {ASSIGNABLE_STATUSES.map((s) => (
                        <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                      ))}
                    </select>
                    <button
                      className="amc-apply-btn"
                      disabled={
                        savingId === issue.id ||
                        (draftStatuses[issue.id] ?? issue.status) === issue.status
                      }
                      onClick={() => handleApplyStatus(issue.id)}
                    >
                      {savingId === issue.id ? 'Saving…' : 'Apply'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}