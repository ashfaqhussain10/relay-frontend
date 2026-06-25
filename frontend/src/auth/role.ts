// Swap point (§6.1): reads VITE_ROLE_STUB until /api/me/ returns role.
// When the backend ships Profile.role, remove the env-var branch and return user.role.
export type Role = 'admin' | 'support' | 'client';

export function getRole(user: { role?: string } | null): Role {
  const stub = import.meta.env.VITE_ROLE_STUB as Role | undefined;
  if (stub === 'admin' || stub === 'support' || stub === 'client') return stub;
  if (!user) return 'client';
  const r = user.role as Role | undefined;
  if (r === 'admin' || r === 'support' || r === 'client') return r;
  return 'admin'; // safe fallback until backend ships role
}
