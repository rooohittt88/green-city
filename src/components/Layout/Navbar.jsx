import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const closeMobile = () => setMobileOpen(false);

  return (
    <nav className="navbar">
      {/* Brand */}
      <div
        className="navbar-brand"
        onClick={() => { navigate('/'); closeMobile(); }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && navigate('/')}
      >
        🗺️ Community<span>Hero</span>
        <span className="flag-badge">INDIA 🇮🇳</span>
      </div>

      {/* Desktop nav */}
      <div className={`navbar-nav${mobileOpen ? ' mobile-open' : ''}`}>
        <NavLink
          to="/"
          end
          className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
          onClick={closeMobile}
        >
          📍 Issue Map
        </NavLink>
        <NavLink
          to="/dashboard"
          className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
          onClick={closeMobile}
        >
          📊 Dashboard
        </NavLink>

        <button
          className="nav-btn-report"
          onClick={() => { navigate('/report'); closeMobile(); }}
        >
          + Report
        </button>

        {/* Theme toggle */}
        <button
          className="theme-toggle-btn"
          onClick={toggleTheme}
          title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
          aria-label="Toggle theme"
        >
          {theme === 'light' ? '🌙' : '☀️'}
        </button>

        {/* User avatar */}
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || 'User'}
                className="nav-avatar"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  const sibling = e.currentTarget.nextSibling;
                  if (sibling) sibling.style.display = 'flex';
                }}
              />
            ) : null}
            <div
              className="nav-avatar-fallback"
              style={{ display: user.photoURL ? 'none' : 'flex' }}
            >
              {(user.displayName || user.email || 'U')[0]}
            </div>
            <button
              onClick={logout}
              style={{
                background: 'none', border: 'none',
                fontSize: 12, color: 'var(--text-muted)',
                fontWeight: 600, padding: '4px 6px', borderRadius: 6,
              }}
            >
              Sign out
            </button>
          </div>
        )}
      </div>

      {/* Mobile hamburger — always render last so it shows on mobile */}
      <button
        className="mobile-menu-toggle"
        onClick={() => setMobileOpen((prev) => !prev)}
        aria-label="Toggle menu"
        aria-expanded={mobileOpen}
      >
        {mobileOpen ? '✕' : '☰'}
      </button>
    </nav>
  );
}