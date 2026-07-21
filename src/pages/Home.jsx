import { useState } from 'react';
import IssueMap from '../components/Map/IssueMap';
import IssueDetailModal from '../components/Issue/IssueDetailModal';
import { useIssues } from '../hooks/useIssues';
import { CATEGORY_LABELS, STATUS_LABELS, CATEGORY_COLORS } from '../services/maps';
// import { seedDatabase } from '../utils/seed';

const STATUS_ORDER = ['reported', 'verified', 'in_progress', 'resolved'];

export default function Home() {
  const { issues, loading } = useIssues();
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [filter, setFilter] = useState('all'); // all | pothole | water_leak | streetlight | waste | other

  const filtered = filter === 'all'
    ? issues
    : issues.filter((i) => i.category === filter);

  const handleIssueClick = (issue) => setSelectedIssue(issue);

  return (
    <div className="page">
        {/* {import.meta.env.DEV && (
  <button
    onClick={seedDatabase}
    style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 999,
      background: '#111', color: '#fff', padding: '8px 14px',
      borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12 }}
  >
    🌱 Seed DB (click once)
  </button>
)} */}
      <div className="map-layout">
        {/* ── Sidebar ── */}
        <aside className="sidebar">
          <div className="sidebar-header">
            <h3>Issues</h3>
            <span className="sidebar-count">{filtered.length}</span>
          </div>

          {/* Category filter tabs */}
          <div style={{ padding: '8px 16px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {['all', 'pothole', 'water_leak', 'streetlight', 'waste', 'other'].map((cat) => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                style={{
                  padding: '3px 8px', borderRadius: 99, border: 'none',
                  fontSize: 11, cursor: 'pointer', fontFamily: 'inherit',
                  background: filter === cat ? CATEGORY_COLORS[cat] || 'var(--text)' : 'var(--bg)',
                  color: filter === cat ? '#fff' : 'var(--text-muted)',
                  fontWeight: filter === cat ? 600 : 400,
                }}
              >
                {cat === 'all' ? 'All' : CATEGORY_LABELS[cat]}
              </button>
            ))}
          </div>

          {/* Issue list */}
          {loading ? (
            <div className="loading-center">
              <span className="spinner" />
              Loading issues…
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <div style={{ fontSize: 32 }}>📭</div>
              <p>No issues yet. Be the first to report one!</p>
            </div>
          ) : (
            filtered.map((issue) => (
              <div
                key={issue.id}
                className={`issue-card${selectedIssue?.id === issue.id ? ' selected' : ''}`}
                onClick={() => handleIssueClick(issue)}
              >
                <div className="issue-card-title">{issue.title}</div>
                <div className="issue-card-addr">{issue.address}</div>
                <div className="issue-card-meta">
                  <span className={`badge badge-${issue.category}`}>
                    {CATEGORY_LABELS[issue.category]}
                  </span>
                  <span className="status-dot" style={{ background: { reported: '#9CA3AF', verified: '#1D9E75', in_progress: '#EF9F27', resolved: '#0F6E56' }[issue.status] }} />
                  <span className="status-label">{STATUS_LABELS[issue.status]}</span>
                  <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-muted)' }}>
                    ▲ {issue.votes || 0}
                  </span>
                </div>
              </div>
            ))
          )}
        </aside>

        {/* ── Map ── */}
        <main className="map-container">
          <IssueMap
            issues={filtered}
            selectedIssue={selectedIssue}
            onIssueClick={handleIssueClick}
          />
        </main>
      </div>

      {/* Issue detail modal */}
      {selectedIssue && (
        <IssueDetailModal
          issue={selectedIssue}
          onClose={() => setSelectedIssue(null)}
        />
      )}
    </div>
  );
}