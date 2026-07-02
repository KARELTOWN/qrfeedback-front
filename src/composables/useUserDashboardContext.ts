import { inject, type InjectionKey } from 'vue';

export type UserDashboardContext = Record<string, any>;
export const userDashboardContextKey: InjectionKey<UserDashboardContext> = Symbol('userDashboardContext');

export function useUserDashboardContext() {
  const context = inject(userDashboardContextKey);
  if (!context) throw new Error('User dashboard context is not available.');
  return context;
}
