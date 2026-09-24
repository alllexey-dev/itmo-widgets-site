import { createContext, useContext } from 'react';

export type ToastTone = 'neutral' | 'success' | 'error';

export interface ToastOptions {
  message: string;
  tone?: ToastTone;
  /** One short action, e.g. «Повторить». */
  action?: { label: string; onClick: () => void };
  /** Milliseconds before it hides; errors stay longer by default. */
  duration?: number;
}

export interface ToastApi {
  show: (options: ToastOptions) => void;
}

export const ToastContext = createContext<ToastApi | null>(null);

export function useToast(): ToastApi {
  const api = useContext(ToastContext);
  if (!api) throw new Error('useToast must be used inside ToastProvider');
  return api;
}
