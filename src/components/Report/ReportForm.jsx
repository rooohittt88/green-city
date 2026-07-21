import { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { analyzeIssuePhoto } from '../../services/gemini';
import { uploadIssuePhoto, fileToBase64 } from '../../services/storage';
import { createIssue } from '../../hooks/useIssues';
import { reverseGeocode, extractWard, CATEGORY_LABELS } from '../../services/maps';

const MAX_FILE_SIZE_MB = 10;

export default function ReportForm({ onSuccess }) {
  const { user } = useAuth();
  const fileRef = useRef(null);

  // Step 1 = pick photo, Step 2 = AI analyzed, Step 3 = submitted
  const [step, setStep] = useState(1);
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [aiResult, setAiResult] = useState(null);
  const [location, setLocation] = useState(null);
  const [address, setAddress] = useState('');
  const [title, setTitle] = useState('');

  const [analyzing, setAnalyzing] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // ── Step 1: Pick a photo ──────────────────────────────────────────────────

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (!selected.type.startsWith('image/')) {
      setError('Please select an image file (JPG, PNG, WEBP, etc.)');
      return;
    }

    const sizeMB = selected.size / 1024 / 1024;
    if (sizeMB > MAX_FILE_SIZE_MB) {
      setError(`File too large. Max ${MAX_FILE_SIZE_MB}MB.`);
      return;
    }

    setFile(selected);
    setPreviewUrl(URL.createObjectURL(selected));
    setAiResult(null);
    setError('');
    setStep(1);
  };

  // ── Step 1b: Get location ─────────────────────────────────────────────────

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported by your browser. Try a different browser.');
      return;
    }

    setGettingLocation(true);
    setError('');

    navigator.geolocation.getCurrentPosition(
  async (pos) => {
    const { latitude, longitude } = pos.coords;
    setLocation({ lat: latitude, lng: longitude });
    const addr = await reverseGeocode(latitude, longitude);
    if (addr) {
      setAddress(addr);
    } else {
      // Geocoding failed — set a meaningful fallback instead of coordinates
      setAddress('Surat, Gujarat, India');
      console.warn('Geocoding failed, using fallback address');
    }
    setGettingLocation(false);
  },
      (err) => {
        console.warn('Geolocation denied:', err.message);
        // Fallback to Surat centre — the demo still works
        setLocation({ lat: 21.1702, lng: 72.8311 });
        setAddress('Surat, Gujarat, India');
        setGettingLocation(false);
      },
      { timeout: 10000 }
    );
  };

  // ── Step 2: Analyze photo with Gemini ────────────────────────────────────

  const handleAnalyze = async () => {
    if (!file) { setError('Please select a photo first.'); return; }

    setAnalyzing(true);
    setError('');

    try {
      const base64 = await fileToBase64(file);
      const result = await analyzeIssuePhoto(base64, file.type);

      if (!result.isIssue) {
        setError('The AI did not detect a civic issue in this photo. Try a clearer image of the problem.');
        setAnalyzing(false);
        return;
      }

      setAiResult(result);
      // Pre-fill title from AI result
      const cat = CATEGORY_LABELS[result.category] || result.category;
      const ward = extractWard(address);
      setTitle(`${cat} near ${ward}`);
      setStep(2);
    } catch (err) {
      setError(`AI analysis failed: ${err.message}. Check your Gemini API key in .env.`);
    } finally {
      setAnalyzing(false);
    }
  };

  // ── Step 3: Submit ────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!file) { setError('No photo selected.'); return; }
    if (!aiResult) { setError('Please analyze the photo first.'); return; }
    if (!location) { setError('Please set a location.'); return; }

    setSubmitting(true);
    setError('');

    try {
      const photoUrl = await uploadIssuePhoto(file, user.uid);

      await createIssue({
        title: title.trim() || `${CATEGORY_LABELS[aiResult.category]} — ${extractWard(address)}`,
        description: aiResult.description,
        category: aiResult.category,
        severity: aiResult.severity,
        location,
        address,
        wardName: extractWard(address),
        photoUrl,
        aiAnalysis: aiResult,
        userId: user.uid,
      });

      setStep(3);
      setTimeout(() => onSuccess?.(), 1200);
    } catch (err) {
      setError(`Submission failed: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Success screen ────────────────────────────────────────────────────────

  if (step === 3) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 20px' }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
        <h2 style={{ fontWeight: 700, marginBottom: 8 }}>Issue Reported!</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
          Your report is live on the map. The community can now verify it.
        </p>
      </div>
    );
  }

  // ── Main form ─────────────────────────────────────────────────────────────

  return (
    <div>
      {/* Step indicator */}
      <div className="step-indicator">
        <div className={`step ${step >= 1 ? 'active' : ''}`}>
          <span className="step-num">1</span> Photo
        </div>
        <div className="step-sep" />
        <div className={`step ${step >= 2 ? 'active' : ''}`}>
          <span className="step-num">2</span> AI Analysis
        </div>
        <div className="step-sep" />
        <div className={`step ${step >= 3 ? 'done' : ''}`}>
          <span className="step-num">3</span> Submit
        </div>
      </div>

      {/* Error banner */}
      {error && <div className="alert alert-error">{error}</div>}

      {/* ── STEP 1: Photo + Location ── */}
      <div className="form-group">
        <label className="form-label">Photo of the issue *</label>
        <input
          type="file"
          accept="image/*"
          capture="environment"   /* opens camera on mobile */
          ref={fileRef}
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
        <div className="photo-dropzone" onClick={() => fileRef.current?.click()}>
          {previewUrl ? (
            <img src={previewUrl} alt="Preview" className="photo-preview" />
          ) : (
            <>
              <div className="photo-dropzone-icon">📷</div>
              <p><strong>Tap to take a photo</strong> or upload from gallery</p>
              <p style={{ marginTop: 4, fontSize: 11 }}>JPG, PNG, WEBP — max 10MB</p>
            </>
          )}
        </div>
        {previewUrl && (
          <button
            className="btn btn-outline btn-sm"
            style={{ marginTop: 8 }}
            onClick={() => fileRef.current?.click()}
          >
            Change photo
          </button>
        )}
      </div>

      <div className="form-group">
        <label className="form-label">Location *</label>
        <div className="location-row">
          <input
            type="text"
            className="form-input"
            placeholder="Address will appear here after detection"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
          <button
            className="btn btn-outline"
            onClick={handleGetLocation}
            disabled={gettingLocation}
            style={{ flexShrink: 0 }}
          >
            {gettingLocation ? (
              <><span className="spinner" style={{ width: 14, height: 14 }} /> Locating…</>
            ) : (
              '📍 Detect'
            )}
          </button>
        </div>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
          Click Detect to use your current GPS location. Or type an address.
        </p>
      </div>

      {/* Analyze button (step 1 → step 2) */}
      {step === 1 && (
        <button
          className="btn btn-primary btn-block"
          onClick={handleAnalyze}
          disabled={!file || analyzing}
        >
          {analyzing ? (
            <><span className="spinner" style={{ width: 16, height: 16, borderTopColor: '#fff' }} /> Analyzing with AI…</>
          ) : (
            '🤖 Analyze Photo with AI'
          )}
        </button>
      )}

      {/* ── STEP 2: Show AI result + confirm ── */}
      {step === 2 && aiResult && (
        <>
          <div className="ai-card">
            <div className="ai-card-header">🤖 AI Detected</div>
            <div className="ai-stats">
              <div className="ai-stat">
                <label>Category</label>
                <value>{CATEGORY_LABELS[aiResult.category] || aiResult.category}</value>
              </div>
              <div className="ai-stat">
                <label>Severity</label>
                <value>{aiResult.severity} / 5</value>
              </div>
              <div className="ai-stat">
                <label>Confidence</label>
                <value>{Math.round(aiResult.confidence * 100)}%</value>
              </div>
            </div>
            <p className="ai-desc">"{aiResult.description}"</p>
          </div>

          <div className="form-group">
            <label className="form-label">Title (editable)</label>
            <input
              type="text"
              className="form-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Short description of the issue"
            />
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button
              className="btn btn-outline"
              onClick={() => { setStep(1); setAiResult(null); }}
              style={{ flex: 1 }}
            >
              ← Retake
            </button>
            <button
              className="btn btn-primary"
              onClick={handleSubmit}
              disabled={submitting}
              style={{ flex: 2 }}
            >
              {submitting ? (
                <><span className="spinner" style={{ width: 16, height: 16, borderTopColor: '#fff' }} /> Submitting…</>
              ) : (
                '✓ Submit Report'
              )}
            </button>
          </div>
        </>
      )}
    </div>
  );
}