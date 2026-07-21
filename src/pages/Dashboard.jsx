import { useState } from 'react';
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { useIssues } from '../hooks/useIssues';
import { generateInsights } from '../services/gemini';
import { CATEGORY_LABELS, CATEGORY_COLORS } from '../services/maps';

const STATUS_COLORS = {
  reported: '#9CA3AF',
  verified: '#1D9E75',
  in_progress: '#EF9F27',
  resolved: '#0F6E56',
};

export default function Dashboard() {
  const { issues, loading } = useIssues();
  const [insights, setInsights] = useState([]);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [insightError, setInsightError] = useState('');

  if (loading) {
    return (
      <div className="page">
        <div className="loading-center">
          <span className="spinner" /> Loading dashboard…
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

  // Ward breakdown
  const wardCounts = {};
  issues.forEach((i) => {
    const w = i.wardName || 'Unknown';
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
      setInsightError('Failed to generate insights. Check Gemini API key.');
    } finally {
      setLoadingInsights(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="page">
      <div className="dashboard-page">
        <h1>Impact Dashboard</h1>

        {/* Stat cards */}
        <div className="stat-grid">
          <div className="stat-card">
            <div className="stat-value">{total}</div>
            <div className="stat-label">Total Issues Reported</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: 'var(--primary)' }}>{verified}</div>
            <div className="stat-label">Community Verified</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: 'var(--primary-dark)' }}>{resolved}</div>
            <div className="stat-label">Resolved</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: 'var(--danger)' }}>{critical}</div>
            <div className="stat-label">Critical Issues</div>
          </div>
        </div>

        {/* Charts row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
          <div className="chart-card">
            <p className="section-title">Issues by Category</p>
            <ResponsiveContainer width="100%" height={200}>
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
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-card">
            <p className="section-title">Issues by Status</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={statusData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <XAxis dataKey="status" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {statusData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Ward breakdown */}
        <div className="chart-card" style={{ marginBottom: 20 }}>
          <p className="section-title">Issues by Ward</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={wardData} layout="vertical" margin={{ top: 0, right: 20, left: 40, bottom: 0 }}>
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="ward" tick={{ fontSize: 11 }} width={80} />
              <Tooltip />
              <Bar dataKey="count" fill="var(--primary)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* AI Insights */}
        <div className="chart-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <p className="section-title" style={{ marginBottom: 0 }}>🤖 AI-Generated Insights</p>
            <button
              className="btn btn-outline btn-sm"
              onClick={handleLoadInsights}
              disabled={loadingInsights}
            >
              {loadingInsights
                ? <><span className="spinner" style={{ width: 14, height: 14 }} /> Generating…</>
                : insights.length ? '↻ Refresh' : 'Generate Insights'
              }
            </button>
          </div>

          {insightError && <div className="alert alert-error">{insightError}</div>}

          {insights.length > 0 ? (
            <ul className="insights-list">
              {insights.map((insight, i) => (
                <li key={i} className="insight-item">{insight}</li>
              ))}
            </ul>
          ) : (
            !loadingInsights && (
              <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                Click "Generate Insights" to let the AI analyze your data and surface patterns.
              </p>
            )
          )}
        </div>
      </div>
    </div>
  );
}