import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { cx } from './cx';
import { Icon } from './Icon';
import { IconButton } from './IconButton';
import { ToastContext, type ToastOptions } from './toast';
import styles from './Toast.module.css';

interface ToastEntry extends ToastOptions {
  id: number;
}

const MAX_VISIBLE = 3;
const DEFAULT_DURATION = 4000;
const ERROR_DURATION = 8000;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastEntry[]>([]);
  const nextId = useRef(0);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());

  const dismiss = useCallback((id: number) => {
    clearTimeout(timers.current.get(id));
    timers.current.delete(id);
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const show = useCallback(
    (options: ToastOptions) => {
      const id = nextId.current++;
      const duration =
        options.duration ?? (options.tone === 'error' ? ERROR_DURATION : DEFAULT_DURATION);
      setToasts((current) => [...current, { ...options, id }].slice(-MAX_VISIBLE));
      timers.current.set(
        id,
        setTimeout(() => dismiss(id), duration),
      );
    },
    [dismiss],
  );

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach((timer) => clearTimeout(timer));
  }, []);

  const api = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      {createPortal(
        <div className={styles.region} role="region" aria-label="Уведомления">
          <div aria-live="polite" aria-atomic="false" className={styles.stack}>
            {toasts.map((toast) => (
              <div
                key={toast.id}
                className={cx(styles.toast, toast.tone === 'error' && styles.error)}
                role={toast.tone === 'error' ? 'alert' : 'status'}
              >
                {toast.tone === 'success' && <Icon name="check_circle" size={20} />}
                {toast.tone === 'error' && <Icon name="error" size={20} />}
                <span className={styles.message}>{toast.message}</span>
                {toast.action && (
                  <button
                    type="button"
                    className={styles.action}
                    onClick={() => {
                      toast.action?.onClick();
                      dismiss(toast.id);
                    }}
                  >
                    {toast.action.label}
                  </button>
                )}
                <IconButton
                  icon="close"
                  label="Скрыть"
                  className={styles.close}
                  onClick={() => dismiss(toast.id)}
                />
              </div>
            ))}
          </div>
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  );
}
