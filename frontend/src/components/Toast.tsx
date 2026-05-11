import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';

type ToastKind = 'success' | 'error' | 'info';

export type ToastItem = {
  id: string;
  kind: ToastKind;
  title: string;
  message?: string;
};

type ToastContextValue = {
  push: (t: Omit<ToastItem, 'id'> & { durationMs?: number }) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

function uid() {
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const timers = useRef<Map<string, number>>(new Map());
  const [items, setItems] = useState<ToastItem[]>([]);

  const remove = useCallback((id: string) => {
    const t = timers.current.get(id);
    if (t) window.clearTimeout(t);
    timers.current.delete(id);
    setItems((prev) => prev.filter((x) => x.id !== id));
  }, []);

  const push = useCallback(
    (t: Omit<ToastItem, 'id'> & { durationMs?: number }) => {
      const id = uid();
      const durationMs = t.durationMs ?? 3500;
      const item: ToastItem = { id, kind: t.kind, title: t.title, message: t.message };
      setItems((prev) => [item, ...prev].slice(0, 4));
      const timer = window.setTimeout(() => remove(id), durationMs);
      timers.current.set(id, timer);
    },
    [remove],
  );

  const value = useMemo(() => ({ push }), [push]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-viewport" role="region" aria-label="Notifications">
        {items.map((t) => (
          <div key={t.id} className={`toast toast-${t.kind}`}>
            <div className="toast-head">
              <div className="toast-title">{t.title}</div>
              <button className="toast-x" onClick={() => remove(t.id)} aria-label="Dismiss">
                ×
              </button>
            </div>
            {t.message ? <div className="toast-msg">{t.message}</div> : null}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

