import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { apiFetch } from '../lib/api';
import { getRole, type Role } from './role';

export interface RelayUser {
  id: number;
  username: string;
  email: string;
  role?: string;
  tenant_id?: number | null;
}

interface AuthCtx {
  user: RelayUser | null;
  role: Role;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<RelayUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem('relay_access');
    localStorage.removeItem('relay_refresh');
    setUser(null);
  }, []);

  // Listen for logout events fired by apiFetch on failed refresh
  useEffect(() => {
    const handler = () => setUser(null);
    window.addEventListener('relay:logout', handler);
    return () => window.removeEventListener('relay:logout', handler);
  }, []);

  // On mount, rehydrate session from stored token
  useEffect(() => {
    const token = localStorage.getItem('relay_access');
    if (!token) { setIsLoading(false); return; }

    apiFetch('/api/me/')
      .then(res => (res.ok ? res.json() : null))
      .then((data: RelayUser | null) => {
        if (data) setUser(data);
        else logout();
      })
      .catch(() => logout())
      .finally(() => setIsLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const login = async (email: string, password: string) => {
    const res = await apiFetch('/api/auth/token/', {
      method: 'POST',
      body: JSON.stringify({ username: email, password }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.detail ?? 'Invalid credentials. Check your email and password.');
    }
    const { access, refresh } = await res.json();
    localStorage.setItem('relay_access', access);
    localStorage.setItem('relay_refresh', refresh);

    const meRes = await apiFetch('/api/me/');
    if (!meRes.ok) throw new Error('Logged in but could not load your account.');
    const me: RelayUser = await meRes.json();
    setUser(me);
  };

  const role = getRole(user);

  return (
    <Ctx.Provider value={{ user, role, isLoading, login, logout }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth(): AuthCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAuth must be inside <AuthProvider>');
  return ctx;
}
