import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

export default function ClientGuard({ children }: { children: React.ReactNode }) {
  const { role, user } = useAuth();
  if (role === 'client' && user?.tenant_id) {
    return <Navigate to={`/clients/${user.tenant_id}`} replace />;
  }
  return <>{children}</>;
}
