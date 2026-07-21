import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { upvoteIssue } from '../../hooks/useIssues';
import { CATEGORY_LABELS, STATUS_LABELS } from '../../services/maps';

const SEVERITY_LABELS = { 1: 'Minor', 2: 'Low', 3: 'Moderate', 4: 'High', 5: 'Critical' };
const SEVERITY_COLORS = { 1: '#1D9E75', 2: '#378ADD', 3: '#EF9F27', 4: '#E24B4A', 5: '#7B1D1D' };

export default function IssueDetailModal({ issue, onClose }) {
  const { user } = useAuth();
  const [upvoting, setUpvoting] = useState(false);
const [upvoteError, setUpvoteError] = useState('');
const [hasVotedLocal, setHasVotedLocal] = useState(false);

  if (!issue) return null;

  const hasVoted = hasVotedLocal || (user && (issue.voterIds || []).includes(user.uid));
  const isOwn = user && issue.reportedBy === user.uid;

 const handleUpvote = async () => {
  if (!user || hasVoted || upvoting) return;
  setHasVotedLocal(true); // disable immediately, don't wait for Firestore
  setUpvoting(true);
  setUpvoteError('');
  try {
    await upvoteIssue(issue.id, user.uid, issue.votes, issue.voterIds);
  } catch (e) {
    setHasVotedLocal(false); // revert local state if Firestore write failed
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

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>{issue.title}</h2>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
              <span className={`badge badge-${issue.category}`}>
                {CATEGORY_LABELS[issue.category] || issue.category}
              </span>
              <span
                className="badge"
                style={{
                  background: '#F1EFE8',
                  color: SEVERITY_COLORS[issue.severity] || '#888780',
                }}
              >
                {SEVERITY_LABELS[issue.severity] || `Severity ${issue.severity}`}
              </span>
            </div>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close">×</button>
        </div>

        <div className="modal-body">
          {/* Photo */}
          {issue.photoUrl && (
            <img src={issue.photoUrl} alt="Issue" className="modal-img" />
          )}

          {/* Description */}
          <p style={{ fontSize: 13, marginBottom: 12, color: 'var(--text)' }}>
            {issue.description}
          </p>

          {/* AI Analysis card */}
          {issue.aiAnalysis && (
            <div className="ai-card">
              <div className="ai-card-header">
                🤖 AI Analysis
              </div>
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
              {issue.aiAnalysis.tags && (
                <p className="ai-desc">
                  Tags: {issue.aiAnalysis.tags.join(', ')}
                </p>
              )}
            </div>
          )}

          {/* Location & Status details */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            <div>
              <div className="form-label">Location</div>
              <p style={{ fontSize: 13 }}>{issue.address || `${issue.lat?.toFixed(4)}, ${issue.lng?.toFixed(4)}`}</p>
            </div>
            <div>
              <div className="form-label">Ward</div>
              <p style={{ fontSize: 13 }}>{issue.wardName || 'Surat'}</p>
            </div>
            <div>
              <div className="form-label">Status</div>
              <p style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span className={`status-dot status-dot-${issue.status}`} />
                {STATUS_LABELS[issue.status] || issue.status}
              </p>
            </div>
            <div>
              <div className="form-label">Reported</div>
              <p style={{ fontSize: 13 }}>{formatDate(issue.createdAtDate)}</p>
            </div>
          </div>

          {/* Community votes */}
          <div
            style={{
              display: 'flex', alignItems: 'center',
              gap: 12, padding: '12px 0',
              borderTop: '1px solid var(--border)',
            }}
          >
            <div style={{ flex: 1 }}>
              <div className="form-label" style={{ marginBottom: 2 }}>Community Support</div>
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                {issue.votes || 0} {issue.votes === 1 ? 'person' : 'people'} confirmed this issue
                {issue.votes >= 3 && (
                  <span style={{ color: 'var(--primary)', fontWeight: 500 }}>
                    {' '}· Community Verified ✓
                  </span>
                )}
              </p>
            </div>

            {user && !isOwn && (
              <button
                className={`upvote-btn${hasVoted ? ' voted' : ''}`}
                onClick={handleUpvote}
                disabled={upvoting || hasVoted}
              >
                {hasVoted ? '✓' : '▲'} {issue.votes || 0}
              </button>
            )}
            {isOwn && (
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Your report</span>
            )}
          </div>

          {upvoteError && <p className="error-msg">{upvoteError}</p>}
        </div>
      </div>
    </div>
  );
}