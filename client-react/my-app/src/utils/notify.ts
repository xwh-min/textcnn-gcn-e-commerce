export type ToastType = 'success' | 'error' | 'info';

export interface ToastDetail {
  type: ToastType;
  message: string;
}

export function notify(type: ToastType, message: string) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent<ToastDetail>('app-toast', { detail: { type, message } }));
}

export const notifySuccess = (message: string) => notify('success', message);
export const notifyError = (message: string) => notify('error', message);
export const notifyInfo = (message: string) => notify('info', message);
