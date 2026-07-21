import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Layout/Navbar';
import Login from './pages/Login';
import Home from './pages/Home';
import Report from './pages/Report';
import Dashboard from './pages/Dashboard';

// Guards: redirect to /login if not authenticated
function PrivateRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <BrowserRouter>
      {user && <Navbar />}
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={<PrivateRoute><Home /></PrivateRoute>}
        />
        <Route
          path="/report"
          element={<PrivateRoute><Report /></PrivateRoute>}
        />
        <Route
          path="/dashboard"
          element={<PrivateRoute><Dashboard /></PrivateRoute>}
        />
        {/* Catch-all → home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}