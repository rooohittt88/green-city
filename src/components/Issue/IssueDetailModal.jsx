import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { upvoteIssue } from '../../hooks/useIssues';
import { CATEGORY_LABELS, STATUS_LABELS } from '../../services/maps';

const SEVERITY_LABELS = { 1: 'Minor', 2: 'Low', 3: 'Moderate', 4: 'High', 5: 'Critical' };
const SEVERITY_COLORS = { 1: '#10b981', 2: '#3b82f6', 3: '#f59e0b', 4: '#ef4444', 5: '#7c3aed' };
const STATUS_COLORS = {
  reported: '#9ca3af',
  verified: '#10b981',
  in_progress: '#f59e0b',
  resolved: '#059669',
};

export default function IssueDetailModal({ issue, onClose }) {
  const { user } = useAuth();
  const [upvoting, setUpvoting] = useState(false);
  const [upvoteError, setUpvoteError] = useState('');
  const [hasVotedLocal, setHasVotedLocal] = useState(false);
  const [votes, setVotes] = useState(issue.votes || 0);

  if (!issue) return null;

  const hasVoted = hasVotedLocal || (user && (issue.voterIds || []).includes(user.uid));
  const isOwn = user && issue.reportedBy === user.uid;

  const handleUpvote = async () => {
    if (!user || hasVoted || upvoting) return;
    setHasVotedLocal(true);
    setVotes((v) => v + 1);
    setUpvoting(true);
    setUpvoteError('');
    try {
      await upvoteIssue(issue.id, user.uid, issue.votes, issue.voterIds);
    } catch (e) {
      setHasVotedLocal(false);
      setVotes((v) => v - 1);
      setUpvoteError(e.message);
    } finally {
      setUpvoting(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return '—';
    return new Intl.DateTimeFormat('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
    }).format(date);
  };

  const sevColor = SEVERITY_COLORS[issue.severity] || '#888';
  const statusColor = STATUS_COLORS[issue.status] || '#9ca3af';

  return (
    <div
      className="modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal">
        {/* ── Header ── */}
        <div className="modal-header">
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{ marginBottom: 8 }}>{issue.title}</h2>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
              <span className={`badge badge-${issue.category}`}>
                {CATEGORY_LABELS[issue.category] || issue.category}
              </span>
              <span
                className="badge"
                style={{
                  background: `${sevColor}18`,
                  color: sevColor,
                  border: `1px solid ${sevColor}30`,
                }}
              >
                {SEVERITY_LABELS[issue.severity] || `Severity ${issue.severity}`}
              </span>
              <span
                className="badge"
                style={{
                  background: `${statusColor}18`,
                  color: statusColor,
                  border: `1px solid ${statusColor}30`,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <span
                  style={{
                    width: 6, height: 6, borderRadius: '50%',
                    background: statusColor, flexShrink: 0,
                  }}
                />
                {STATUS_LABELS[issue.status] || issue.status}
              </span>
            </div>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        {/* ── Body ── */}
        <div className="modal-body">
          {/* Photo */}
          {issue.photoUrl && (
            <img
              src={issue.photoUrl}
              alt="Issue photograph"
              className="modal-img"
            />
          )}

          {/* Description */}
          <p style={{ fontSize: 13.5, lineHeight: 1.6, marginBottom: 16, color: 'var(--text)' }}>
            {issue.description}
          </p>

          {/* AI Analysis */}
          {issue.aiAnalysis && (
            <div className="ai-card" style={{ marginBottom: 18 }}>
              <div className="ai-card-header">🤖 AI Analysis</div>
              <div className="ai-stats">
                <div className="ai-stat">
                  <label>Category</label>
                  <value>{CATEGORY_LABELS[issue.aiAnalysis.category] || issue.aiAnalysis.category}</value>
                </div>
                <div className="ai-stat">
                  <label>Severity</label>
                  <value>{issue.aiAnalysis.severity}/5</value>
                </div>
                <div className="ai-stat">
                  <label>Confidence</label>
                  <value>{Math.round((issue.aiAnalysis.confidence || 0) * 100)}%</value>
                </div>
              </div>
              {issue.aiAnalysis.tags?.length > 0 && (
                <p className="ai-desc">
                  Tags: {issue.aiAnalysis.tags.join(' · ')}
                </p>
              )}
            </div>
          )}

          {/* Details grid */}
          <div
            style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr',
              gap: '12px 20px', marginBottom: 18,
              background: 'var(--bg-alt)', borderRadius: 10,
              padding: '14px 16px',
            }}
          >
            <div>
              <div className="form-label" style={{ marginBottom: 3 }}>📍 Location</div>
              <p style={{ fontSize: 12.5, color: 'var(--text)', lineHeight: 1.4 }}>
                {issue.address || `${issue.lat?.toFixed(4)}, ${issue.lng?.toFixed(4)}`}
              </p>
            </div>
            <div>
              <div className="form-label" style={{ marginBottom: 3 }}>🏙️ Region</div>
              <p style={{ fontSize: 12.5, color: 'var(--text)' }}>
                {issue.wardName || 'India'}
              </p>
            </div>
            <div>
              <div className="form-label" style={{ marginBottom: 3 }}>📅 Reported On</div>
              <p style={{ fontSize: 12.5, color: 'var(--text)' }}>
                {formatDate(issue.createdAtDate)}
              </p>
            </div>
            <div>
              <div className="form-label" style={{ marginBottom: 3 }}>⚡ Priority Score</div>
              <p style={{ fontSize: 12.5, color: 'var(--text)', fontWeight: 700 }}>
                {issue.priorityScore || votes * (issue.severity || 1)}
              </p>
            </div>
          </div>

          {/* Upvote section */}
          <div
            style={{
              display: 'flex', alignItems: 'center', gap: 14,
              paddingTop: 16, borderTop: '1px solid var(--border)',
            }}
          >
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 3 }}>
                Community Support
              </div>
              <p style={{ fontSize: 13, color: 'var(--text)', fontWeight: 600 }}>
                {votes} {votes === 1 ? 'person' : 'people'} confirmed this issue
                {votes >= 3 && (
                  <span style={{ color: 'var(--primary)', marginLeft: 6 }}>
                    · Community Verified ✓
                  </span>
                )}
              </p>
            </div>

            {user && !isOwn && (
              <button
                className={`upvote-btn${hasVoted ? ' voted' : ''}`}
                onClick={handleUpvote}
                disabled={upvoting || hasVoted}
                title={hasVoted ? 'You already upvoted' : 'Upvote this issue'}
              >
                {hasVoted ? '✓ Confirmed' : '▲ Confirm Issue'}
              </button>
            )}
            {isOwn && (
              <span
                style={{
                  fontSize: 11, color: 'var(--primary)', fontWeight: 700,
                  background: 'var(--primary-light)', padding: '4px 10px',
                  borderRadius: 99,
                }}
              >
                Your Report
              </span>
            )}
          </div>

          {upvoteError && (
            <p className="error-msg" style={{ marginTop: 8 }}>
              ⚠️ {upvoteError}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}