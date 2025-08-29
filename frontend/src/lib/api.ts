/**
 * API client mínimo del frontend.
 * - login({ documento|email, password }): POST /users/login, guarda token (localStorage).
 * - me(): GET /me con Authorization Bearer.
 * - authHeader(): devuelve headers con el token para peticiones autenticadas.
 */

// src/lib/api.ts
const API_URL = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000';

type LoginBody = { email?: string; documento?: string; password: string };

/** Devuelve headers siempre como Record<string,string> (compatible con HeadersInit) */
export function authHeader(): Record<string, string> {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function login(body: LoginBody) {
  const res = await fetch(`${API_URL}/users/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeader(), // no molesta si no hay token
    },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || 'Error en login');
  if (data?.token) localStorage.setItem('token', data.token);
  return data;
}

export async function me() {
  const res = await fetch(`${API_URL}/me`, {
    headers: { ...authHeader() },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.detail || data?.message || 'Error en /me');
  return data;
}
