import { Navigate, Outlet } from 'react-router-dom';
import { useAppSelector } from '../store/hooks';

export function ProtectedRoute() {
  const { token, user, status } = useAppSelector((s) => s.auth);
  if (status === 'loading' && token && !user) {
    return <div className="muted">Checking session…</div>;
  }
  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}
