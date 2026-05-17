import { api, clearToken, setToken } from '../api';

export type LoginInput = {
  email: string;
  password: string;
};

export type SignupInput = {
  companyName?: string;
  email: string;
  password: string;
};

export type ChangePasswordInput = {
  currentPassword: string;
  newPassword: string;
};

type AuthResponse = {
  token?: string;
  requiresOtp?: boolean;
  email?: string;
  purpose?: 'signup' | 'login' | 'reset-password';
  user?: {
    email: string;
    roleId: 'utilisateur' | 'superadministrateur';
    isActive: boolean;
    mustChangePassword: boolean;
    company: unknown;
  };
};

type OtpPurpose = 'signup' | 'login' | 'reset-password';

export function useAuth() {
  async function login(payload: LoginInput) {
    const response = await api<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    if (response.token) setToken(response.token);
    return response;
  }

  async function signup(payload: SignupInput) {
    const response = await api<AuthResponse>('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    if (response.token) setToken(response.token);
    return response;
  }

  async function forgotPassword(email: string) {
    return api('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email })
    });
  }

  async function resetPassword(token: string, password: string) {
    return api('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password })
    });
  }

  async function resetPasswordWithOtp(email: string, code: string, password: string) {
    return api('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email, code, password })
    });
  }

  async function verifyOtp(email: string, code: string, purpose: OtpPurpose) {
    const response = await api<AuthResponse | { ok: boolean }>('/api/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email, code, purpose })
    });

    if ('token' in response && response.token) {
      setToken(response.token);
    }

    return response;
  }

  async function resendOtp(email: string, purpose: OtpPurpose) {
    return api<{ ok: boolean; email: string; purpose: OtpPurpose }>('/api/auth/resend-otp', {
      method: 'POST',
      body: JSON.stringify({ email, purpose })
    });
  }

  async function changePassword(payload: ChangePasswordInput) {
    return api('/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  function logout() {
    clearToken();
  }

  return { login, signup, forgotPassword, resetPassword, resetPasswordWithOtp, verifyOtp, resendOtp, changePassword, logout };
}
