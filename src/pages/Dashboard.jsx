import { useState } from 'react';
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';
import { useIssues } from '../hooks/useIssues';
import { generateInsights } from '../services/gemini';
import { CATEGORY_LABELS, CATEGORY_COLORS } from '../services/maps';

const STATUS_COLORS = {
  reported: '#9CA3AF',
  verified: '#10b981',
  in_progress: '#f59e0b',
  resolved: '#059669',
};

export default function Dashboard() {
  const { issues, loading } = useIssues();
  const [insights, setInsights] = useState([]);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [insightError, setInsightError] = useState('');

  if (loading) {
    return (
      <div className="page">
        <div className="loading-center" style={{ minHeight: '60vh' }}>
          <span className="spinner" style={{ width: 28, height: 28 }} />
          <p>Loading Pan-India Impact Dashboard…</p>
        </div>
      </div>
    );
  }

  // ── Compute stats ──────────────────────────────────────────────────────

  const total = issues.length;
  const resolved = issues.filter((i) => i.status === 'resolved').length;
  const verified = issues.filter((i) => i.status === 'verified' || i.status === 'in_progress' || i.status === 'resolved').length;
  const critical = issues.filter((i) => i.severity >= 4).length;

  // Category breakdown for pie chart
  const catCounts = {};
  issues.forEach((i) => {
    catCounts[i.category] = (catCounts[i.category] || 0) + 1;
  });
  const catData = Object.entries(catCounts).map(([key, value]) => ({
    name: CATEGORY_LABELS[key] || key,
    value,
    color: CATEGORY_COLORS[key] || '#888780',
  }));

  // Status breakdown for bar chart
  const statusCounts = {};
  issues.forEach((i) => {
    statusCounts[i.status] = (statusCounts[i.status] || 0) + 1;
  });
  const statusData = Object.entries(statusCounts).map(([status, count]) => ({
    status: { reported: 'Reported', verified: 'Verified', in_progress: 'In Progress', resolved: 'Resolved' }[status] || status,
    count,
    fill: STATUS_COLORS[status] || '#888',
  }));

  // Ward/Region breakdown
  const wardCounts = {};
  issues.forEach((i) => {
    const w = i.wardName || 'India';
    wardCounts[w] = (wardCounts[w] || 0) + 1;
  });
  const wardData = Object.entries(wardCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([ward, count]) => ({ ward, count }));

  // ── Load AI Insights ───────────────────────────────────────────────────

  const handleLoadInsights = async () => {
    setLoadingInsights(true);
    setInsightError('');
    try {
      const summary = {
        totalIssues: total,
        resolvedIssues: resolved,
        criticalIssues: critical,
        byCategory: catCounts,
        byWard: wardCounts,
        byStatus: statusCounts,
      };
      const result = await generateInsights(summary);
      setInsights(result);
    } catch (e) {
      setInsightError('Failed to generate insights. Check Gemini API key in .env');
    } finally {
      setLoadingInsights(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="page">
      <div className="dashboard-page">
        <div style={{ marginBottom: 24 }}>
          <h1>🇮🇳 Nationwide Impact Dashboard</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            Real-time analytics and community-driven action metrics across India.
          </p>
        </div>

        {/* Stat cards */}
        <div className="stat-grid">
          <div className="stat-card">
            <div className="stat-value">{total}</div>
            <div className="stat-label">Total Reports Filed</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: 'var(--primary)' }}>{verified}</div>
            <div className="stat-label">Community Verified</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: 'var(--primary-dark)' }}>{resolved}</div>
            <div className="stat-label">Successfully Resolved</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: 'var(--danger)' }}>{critical}</div>
            <div className="stat-label">Critical Priority (Severity 4+)</div>
          </div>
        </div>

        {/* Charts row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20, marginBottom: 20 }}>
          <div className="chart-card">
            <p className="section-title">Issues by Category</p>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={catData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={75}
                  label={({ name, percent }) => `${name} ${Math.round(percent * 100)}%`}
                  labelLine={false}
                >
                  {catData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--text)' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-card">
            <p className="section-title">Issues by Status</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={statusData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                <XAxis dataKey="status" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                <Tooltip contentStyle={{ background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--text)' }} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {statusData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Region breakdown */}
        <div className="chart-card" style={{ marginBottom: 20 }}>
          <p className="section-title">Top Active Cities & Wards</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={wardData} layout="vertical" margin={{ top: 0, right: 20, left: 40, bottom: 0 }}>
              <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
              <YAxis type="category" dataKey="ward" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} width={100} />
              <Tooltip contentStyle={{ background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--text)' }} />
              <Bar dataKey="count" fill="var(--primary)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* AI Insights */}
        <div className="chart-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
            <p className="section-title" style={{ marginBottom: 0 }}>🤖 AI-Powered Urban Insights</p>
            <button
              className="btn btn-outline btn-sm"
              onClick={handleLoadInsights}
              disabled={loadingInsights}
            >
              {loadingInsights
                ? <><span className="spinner" style={{ width: 14, height: 14 }} /> Generating…</>
                : insights.length ? '↻ Refresh AI Analysis' : 'Generate Pan-India Insights'
              }
            </button>
          </div>

          {insightError && <div className="alert alert-error">{insightError}</div>}

          {insights.length > 0 ? (
            <ul className="insights-list">
              {insights.map((insight, i) => (
                <li
                  key={i}
                  className="insight-item"
                  style={{ animationDelay: `${i * 0.07}s` }}
                >
                  {insight}
                </li>
              ))}
            </ul>
          ) : (
            !loadingInsights && (
              <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                Click "Generate Pan-India Insights" to analyze nationwide report clusters using AI.
              </p>
            )
          )}
        </div>
      </div>
    </div>
  );
}