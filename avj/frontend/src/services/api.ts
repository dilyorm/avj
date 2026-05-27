/**
 * Typed API client — adds JWT auth header, handles 401 logout, throws on errors.
 */

const BASE = '/api';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

function getToken(): string | null {
  return localStorage.getItem('avj_token');
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const isFormData = options.body instanceof FormData;

  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  });

  if (res.status === 401) {
    localStorage.removeItem('avj_token');
    // Trigger full reload to kick user to login
    window.dispatchEvent(new Event('avj:logout'));
    throw new ApiError(401, 'Session expired');
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: `HTTP ${res.status}` }));
    throw new ApiError(res.status, body.detail ?? 'Request failed');
  }

  // 204 No Content
  if (res.status === 204) return null as T;

  return res.json() as Promise<T>;
}

export const api = {
  get:    <T>(path: string)                            => request<T>(path),
  post:   <T>(path: string, body: unknown)             => request<T>(path, { method: 'POST',   body: JSON.stringify(body) }),
  patch:  <T>(path: string, body: unknown)             => request<T>(path, { method: 'PATCH',  body: JSON.stringify(body) }),
  delete: <T>(path: string)                            => request<T>(path, { method: 'DELETE' }),
  put:    <T>(path: string, body: unknown)             => request<T>(path, { method: 'PUT',    body: JSON.stringify(body) }),
};
