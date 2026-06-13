import { nanoid } from 'nanoid';
import { create } from 'zustand';

export type ToastKind = 'info' | 'success' | 'error';

interface ToastAction {
  label: string;
  run: () => void;
}

export interface Toast {
  id: string;
  kind: ToastKind;
  message: string;
  /** `| undefined` so it forwards cleanly under exactOptionalPropertyTypes. */
  action?: ToastAction | undefined;
  durationMs: number;
}

interface ToastState {
  toasts: Toast[];
  add: (toast: Omit<Toast, 'id'>) => string;
  dismiss: (id: string) => void;
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  add: (toast) => {
    const id = nanoid();
    set((s) => ({ toasts: [...s.toasts, { ...toast, id }] }));
    return id;
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

const DEFAULT_DURATION_MS = 5000;

export interface ShowToastOptions {
  action?: ToastAction | undefined;
  durationMs?: number | undefined;
}

/**
 * Queue a transient notification. Callable from anywhere — including non-React
 * modules like the PWA update service — because it talks to the store directly.
 */
export function showToast(kind: ToastKind, message: string, opts: ShowToastOptions = {}): string {
  return useToastStore.getState().add({
    kind,
    message,
    action: opts.action,
    durationMs: opts.durationMs ?? DEFAULT_DURATION_MS,
  });
}
