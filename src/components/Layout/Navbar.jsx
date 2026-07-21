import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <nav className="navbar">
      <span className="navbar-brand">
        🗺️ Community<span>Hero</span>
      </span>

      <div className="navbar-nav">
        <NavLink
          to="/"
          className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}
        >
          Map
        </NavLink>
        <NavLink
          to="/dashboard"
          className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}
        >
          Dashboard
        </NavLink>
      </div>

      <button className="nav-btn-report" onClick={() => navigate('/report')}>
        + Report Issue
      </button>

      {user && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 8 }}>
          <img src={user.photoURL} alt={user.displayName} className="nav-avatar" />
          <button
            className="nav-link"
            onClick={logout}
            style={{ fontSize: 12, color: 'var(--text-muted)' }}
          >
            Sign out
          </button>
        </div>
      )}
    </nav>
  );
}