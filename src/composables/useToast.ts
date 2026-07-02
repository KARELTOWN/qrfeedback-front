import { readonly, ref } from 'vue';

export type ToastKind = 'success' | 'error' | 'info';

export type ToastItem = {
  id: number;
  message: string;
  kind: ToastKind;
};

const toasts = ref<ToastItem[]>([]);
let nextToastId = 1;

export function useToast() {
  function removeToast(id: number) {
    toasts.value = toasts.value.filter((toast) => toast.id !== id);
  }

  function showToast(message: string, kind: ToastKind = 'success', duration = 2800) {
    const id = nextToastId++;
    toasts.value.push({ id, message, kind });
    window.setTimeout(() => removeToast(id), duration);
  }

  return {
    toasts: readonly(toasts),
    showToast,
    removeToast
  };
}
