// En developpement, Vite proxifie /api vers le backend. Un seul tunnel HTTPS
// vers 5173 couvre donc Telegram Web App et les appels API.
const API_URL = import.meta.env.VITE_API_URL || '';

type ApiOptions = RequestInit & {
  raw?: boolean;
};

type ApiError = {
  message?: string;
};

export function getToken(): string | null {
  return localStorage.getItem('qr_feedback_token');
}

export function setToken(token: string): void {
  localStorage.setItem('qr_feedback_token', token);
}

export function clearToken(): void {
  localStorage.removeItem('qr_feedback_token');
}

export async function api<T = unknown>(path: string, options: ApiOptions = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined)
  };

  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    const error = await response.json().catch((): ApiError => ({ message: 'Erreur reseau.' })) as ApiError;
    throw new Error(error.message || 'Erreur reseau.');
  }

  if (options.raw) return response as T;
  return response.json() as Promise<T>;
}

export { API_URL };
