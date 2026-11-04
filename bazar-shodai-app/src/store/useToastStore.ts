import { create } from 'zustand';
import { haptics } from '@/services/haptics';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  title: string;
  message?: string;
  type?: ToastType;
  durationMs?: number;
  action?: {
    label: string;
    onPress: () => void;
  };
}

interface ToastState {
  toast: ToastMessage | null;
  showToast: (toast: Omit<ToastMessage, 'id'>) => void;
  hideToast: () => void;
}

export const useToastStore = create<ToastState>((set) => ({
  toast: null,
  showToast: (toast) => {
    const id = Date.now().toString();
    const type = toast.type ?? 'info';

    // Trigger matching tactile haptics
    if (type === 'success') haptics.success();
    else if (type === 'error') haptics.error();
    else if (type === 'warning') haptics.warning();
    else haptics.light();

    set({ toast: { ...toast, id, type } });
  },
  hideToast: () => set({ toast: null }),
}));

/**
 * Convenience helper to fire toasts from anywhere in the app
 */
export const toast = {
  success: (title: string, message?: string) =>
    useToastStore.getState().showToast({ title, message, type: 'success' }),
  error: (title: string, message?: string) =>
    useToastStore.getState().showToast({ title, message, type: 'error' }),
  warning: (title: string, message?: string) =>
    useToastStore.getState().showToast({ title, message, type: 'warning' }),
  info: (title: string, message?: string) =>
    useToastStore.getState().showToast({ title, message, type: 'info' }),
};

