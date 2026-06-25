import { useAuth } from './AuthContext';
import type { Role } from './role';

interface Props {
  roles: Role[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export default function RequireRole({ roles, children, fallback = null }: Props) {
  const { role } = useAuth();
  return roles.includes(role) ? <>{children}</> : <>{fallback}</>;
}
