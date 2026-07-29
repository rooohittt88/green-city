import { useState } from 'react';
import IssueMap from '../components/Map/IssueMap';
import IssueDetailModal from '../components/Issue/IssueDetailModal';
import { useIssues } from '../hooks/useIssues';
import { CATEGORY_LABELS, STATUS_LABELS, CATEGORY_COLORS, CITY_PRESETS } from '../services/maps';

const STATUS_DOT = {
  reported: '#9ca3af',
  verified: '#10b981',
  in_progress: '#f59e0b',
  resolved: '#059669',
};

const FILTER_CATEGORIES = [
  { key: 'all', label: 'All' },
  { key: 'pothole', label: '🕳 Pothole' },
  { key: 'water_leak', label: '💧 Water Leak' },
  { key: 'streetlight', label: '💡 Light' },
  { key: 'waste', label: '🗑 Waste' },
  { key: 'other', label: 'Other' },
];

export default function Home() {
  const { issues, loading } = useIssues();
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState('all');
  const [activeCity, setActiveCity] = useState(CITY_PRESETS[0]);

  const filtered = filter === 'all'
    ? issues
    : issues.filter((i) => i.category === filter);

  return (
    <div className="page">
      <div className="map-layout">
        {/* ── Sidebar ── */}
        <aside className="sidebar">
          {/* Header */}
          <div className="sidebar-header">
            <h3>🇮🇳 Issues Across India</h3>
            <span className="sidebar-count">
              {loading ? '…' : filtered.length} report{filtered.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* City Chips */}
          <div className="city-chips-bar">
            {CITY_PRESETS.map((city) => (
              <button
                key={city.name}
                className={`city-chip${activeCity.name === city.name ? ' active' : ''}`}
                onClick={() => { setActiveCity(city); setSelected(null); }}
              >
                {city.name === 'All India' ? '🇮🇳 All' : city.name}
              </button>
            ))}
          </div>

          {/* Category Filter */}
          <div className="category-filter-bar">
            {FILTER_CATEGORIES.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                style={{
                  padding: '4px 11px', borderRadius: 99,
                  border: '1.5px solid',
                  borderColor: filter === key
                    ? (CATEGORY_COLORS[key] || 'var(--primary)')
                    : 'var(--border)',
                  background: filter === key
                    ? (CATEGORY_COLORS[key] || 'var(--primary)')
                    : 'var(--card)',
                  color: filter === key ? '#fff' : 'var(--text-muted)',
                  fontSize: 11.5, fontWeight: 700,
                  cursor: 'pointer', fontFamily: 'inherit',
                  transition: 'all 0.18s ease',
                  flexShrink: 0,
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Issue List */}
          <div className="issue-list">
            {loading ? (
              <div className="loading-center">
                <span className="spinner" style={{ width: 24, height: 24 }} />
                <p>Loading community reports…</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="empty-state">
                <span style={{ fontSize: 40 }}>📭</span>
                <p style={{ fontWeight: 700 }}>No reports found</p>
                <p style={{ fontSize: 12, color: 'var(--text-subtle)' }}>
                  Be the first to report an issue in your city!
                </p>
              </div>
            ) : (
              filtered.map((issue, i) => (
                <div
                  key={issue.id}
                  className={`issue-card${selected?.id === issue.id ? ' selected' : ''}`}
                  onClick={() => setSelected(issue)}
                  style={{ animationDelay: `${Math.min(i * 0.04, 0.4)}s` }}
                >
                  <div className="issue-card-title">{issue.title}</div>
                  <div className="issue-card-addr">📍 {issue.address || 'India'}</div>
                  <div className="issue-card-meta">
                    <span className={`badge badge-${issue.category}`}>
                      {CATEGORY_LABELS[issue.category]}
                    </span>
                    <span
                      className="status-dot"
                      style={{ background: STATUS_DOT[issue.status] || '#9ca3af' }}
                    />
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>
                      {STATUS_LABELS[issue.status]}
                    </span>
                    <span style={{
                      marginLeft: 'auto', fontSize: 11.5,
                      color: 'var(--primary)', fontWeight: 800,
                    }}>
                      ▲ {issue.votes || 0}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </aside>

        {/* ── Map ── */}
        <main className="map-container">
          <IssueMap
            issues={filtered}
            selectedIssue={selected}
            activeCity={activeCity}
            onIssueClick={setSelected}
          />
        </main>
      </div>

      {selected && (
        <IssueDetailModal
          issue={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}