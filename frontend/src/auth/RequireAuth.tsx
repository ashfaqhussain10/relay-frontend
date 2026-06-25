import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import Spinner from '../components/Spinner';

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <Spinner fullPage />;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  return <>{children}</>;
}
