import { inject, type InjectionKey } from 'vue';

export type AdminContext = Record<string, any>;
export const adminContextKey: InjectionKey<AdminContext> = Symbol('adminContext');

export function useAdminContext() {
  const context = inject(adminContextKey);
  if (!context) throw new Error('Admin context is not available.');
  return context;
}
