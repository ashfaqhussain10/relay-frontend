const BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000';

let isRefreshing = false;
let pendingQueue: Array<(token: string | null) => void> = [];

function drainQueue(token: string | null) {
  pendingQueue.forEach(cb => cb(token));
  pendingQueue = [];
}

async function attemptRefresh(): Promise<string | null> {
  const refresh = localStorage.getItem('relay_refresh');
  if (!refresh) return null;
  try {
    const res = await fetch(`${BASE}/api/auth/token/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh }),
    });
    if (!res.ok) return null;
    const { access } = await res.json();
    localStorage.setItem('relay_access', access);
    return access;
  } catch {
    return null;
  }
}

function signOut() {
  localStorage.removeItem('relay_access');
  localStorage.removeItem('relay_refresh');
  window.dispatchEvent(new Event('relay:logout'));
}

export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const token = localStorage.getItem('relay_access');

  const buildHeaders = (t: string | null): HeadersInit => ({
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
    ...(t ? { Authorization: `Bearer ${t}` } : {}),
  });

  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: buildHeaders(token),
  });

  if (res.status !== 401) return res;

  // 401 path — refresh once
  if (isRefreshing) {
    return new Promise(resolve => {
      pendingQueue.push(newToken => {
        if (!newToken) { resolve(res); return; }
        resolve(fetch(`${BASE}${path}`, { ...options, headers: buildHeaders(newToken) }));
      });
    });
  }

  isRefreshing = true;
  const newToken = await attemptRefresh();
  isRefreshing = false;
  drainQueue(newToken);

  if (!newToken) { signOut(); return res; }

  return fetch(`${BASE}${path}`, { ...options, headers: buildHeaders(newToken) });
}
