// frontend/src/lib/api.ts
// Cliente centralizado: base URL, token, headers y endpoints clave

export type Role = "gerente" | "operador" | "cliente";
export type MeUser = {
  user_id?: number;
  username?: string;
  role?: Role;
  cliente_id?: number | null;
};

type Json = Record<string, any>;

// --- BASE de la API ---
const ENV_BASE = (import.meta as any).env?.VITE_API_URL as string | undefined;
export const API_BASE =
  (ENV_BASE && ENV_BASE.trim()) ||
  (typeof location !== "undefined"
    ? `${location.protocol}//${location.host}`
    : "http://127.0.0.1:8000");

// --- Token helpers ---
const TOKEN_KEY = "token";
const ROLE_KEY = "role";
const CLIENTE_ID_KEY = "cliente_id";

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}
export function setToken(t: string) {
  try {
    localStorage.setItem(TOKEN_KEY, t);
  } catch {}
}
export function clearAuthStorage() {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(ROLE_KEY);
    localStorage.removeItem(CLIENTE_ID_KEY);
  } catch {}
}

// --- Core request ---
async function request<T = any>(
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
  path: string,
  body?: Json | FormData,
  init?: RequestInit
): Promise<T> {
  const url = path.startsWith("http") ? path : `${API_BASE}${path}`;

  const headers: HeadersInit = {};
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const finalInit: RequestInit = { method, headers, ...init };

  if (body instanceof FormData) {
    finalInit.body = body;
  } else if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    finalInit.body = JSON.stringify(body);
  }

  const res = await fetch(url, finalInit);

  const ct = res.headers.get("content-type") || "";
  const isJson = ct.includes("application/json");

  if (!res.ok) {
    const payload = isJson ? await res.json().catch(() => ({})) : await res.text();
    throw new Error(
      `HTTP ${res.status} ${res.statusText} @ ${path}\n` +
        (typeof payload === "string" ? payload : JSON.stringify(payload))
    );
  }

  return (isJson ? res.json() : (await res.text())) as T;
}

// Atajos
export const api = {
  get: <T = any>(p: string, init?: RequestInit) => request<T>("GET", p, undefined, init),
  post: <T = any>(p: string, body?: Json | FormData, init?: RequestInit) =>
    request<T>("POST", p, body, init),
  put:  <T = any>(p: string, body?: Json | FormData, init?: RequestInit) =>
    request<T>("PUT", p, body, init),
  patch:<T = any>(p: string, body?: Json | FormData, init?: RequestInit) =>
    request<T>("PATCH", p, body, init),
  delete:<T = any>(p: string, init?: RequestInit) =>
    request<T>("DELETE", p, undefined, init),
};

// --- Endpoints Auth/Usuarios (alineados al backend: backend/routes/usuario.py) ---
/**
 * POST /users/login
 * body: { email?: string, documento?: string, password: string }
 * resp: { token: string, user: { role: string, ... }, ... }
 */
export async function login(body: { email?: string; documento?: string; password: string }) {
  const resp = await api.post<{ token: string; user?: { role?: string } }>("/users/login", body);
  if (resp?.token) setToken(resp.token);
  // Persistimos role si viene en la respuesta (ayuda en primeras vistas)
  const r = resp?.user?.role;
  if (r && typeof r === "string") {
    try { localStorage.setItem(ROLE_KEY, r); } catch {}
  }
  return resp;
}

/**
 * GET /me
 * headers: Authorization: Bearer <token>
 * resp: { user_id, username, role, cliente_id }
 */
export function me() {
  return api.get<MeUser>("/me");
}
