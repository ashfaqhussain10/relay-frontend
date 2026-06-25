import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

export type ToastKind = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  message: string;
  kind: ToastKind;
}

interface ToastCtx {
  toast: (message: string, kind?: ToastKind) => void;
}

const Ctx = createContext<ToastCtx | null>(null);
let _id = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, kind: ToastKind = 'success') => {
    const id = ++_id;
    setToasts(prev => [...prev, { id, message, kind }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 2600);
  }, []);

  return (
    <Ctx.Provider value={{ toast }}>
      {children}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="false"
        style={{
          position: 'fixed',
          bottom: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          zIndex: 9999,
          pointerEvents: 'none',
        }}
      >
        {toasts.map(t => (
          <div key={t.id} role="alert" aria-atomic="true" style={{
            background: t.kind === 'error' ? 'var(--danger)' : 'var(--ink)',
            color: '#fff',
            padding: '10px 18px',
            borderRadius: '100px',
            fontSize: '13px',
            fontWeight: 600,
            whiteSpace: 'nowrap',
            boxShadow: 'var(--shadow-md)',
            animation: 'toastIn 160ms ease',
          }}>
            {t.kind === 'success' && '✓ '}{t.message}
          </div>
        ))}
      </div>
      <style>{`@keyframes toastIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:none; } }`}</style>
    </Ctx.Provider>
  );
}

export function useToast(): ToastCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useToast must be inside <ToastProvider>');
  return ctx;
}
