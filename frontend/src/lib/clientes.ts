// src/lib/clientes.ts
/**
 * Servicios de Clientes (API) — ahora centralizado con API_BASE de lib/api
 * Endpoints:
 *  - POST /clientes/            (crear)
 *  - POST /clientes/search      (búsqueda paginada)
 *  - GET  /clientes/:id         (detalle)
 *  - PUT  /clientes/:id         (actualizar)
 */
import { API_BASE } from "./api";

/* ========= Tipos ========= */
export type ClienteEstado = "activo" | "inactivo";

export type ClienteListItem = {
  id: number;
  nro_cliente: string;
  nombre: string;
  apellido?: string | null;
  documento: string;
  telefono?: string | null;
  email?: string | null;
  direccion?: string | null;
  estado: ClienteEstado;
};

export type ClienteDetail = ClienteListItem & {
  creado_en?: string | null;
};

export type ClienteSearchResponse = {
  items: ClienteListItem[];
  page: number;
  limit: number;
  total_count: number;
  total_pages: number;
  has_prev: boolean;
  has_next: boolean;
};

export type ClienteSearchParams = {
  page: number;
  limit: number;
  buscar?: string;
  estado?: ClienteEstado | "";
  ordenar_por: "id" | "apellido" | "nro_cliente" | "creado_en";
  orden: "asc" | "desc";
  activos_primero: boolean;
};

export type ClienteCreateBody = {
  nombre: string;
  apellido: string;
  documento: string;   // 6–11 dígitos
  direccion: string;
  telefono?: string;
  email?: string;
};

export type ClienteUpdateBody = Partial<{
  nombre: string;
  apellido: string;
  documento: string;
  telefono: string | null;
  email: string | null;
  direccion: string;
  estado: ClienteEstado;
}>;

/* ========= Helpers ========= */
function authHeaders(): Record<string, string> {
  const token =
    localStorage.getItem("token") ||
    sessionStorage.getItem("token") ||
    "";
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function parse<T>(res: Response): Promise<T> {
  const ct = res.headers.get("content-type") || "";
  const isJson = ct.includes("application/json");
  const data = isJson ? await res.json() : (null as any);

  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    if (data) {
      if (data.message) msg = data.message;
      else if (Array.isArray(data.detail) && data.detail.length) {
        const d = data.detail[0];
        const loc = Array.isArray(d.loc) ? d.loc.join(".") : d.loc;
        msg = `${loc} -> ${d.msg || d.type}`;
      } else if (data.detail) {
        msg = typeof data.detail === "string" ? data.detail : JSON.stringify(data.detail);
      }
    }
    throw new Error(msg);
  }
  return data as T;
}

/* ========= Llamadas ========= */
export async function createCliente(body: ClienteCreateBody): Promise<ClienteDetail> {
  const res = await fetch(`${API_BASE}/clientes/`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(body),
  });
  return parse<ClienteDetail>(res);
}

export async function searchClientesPaged(params: ClienteSearchParams): Promise<ClienteSearchResponse> {
  const res = await fetch(`${API_BASE}/clientes/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(params),
  });
  return parse<ClienteSearchResponse>(res);
}

export async function getCliente(id: number): Promise<ClienteDetail> {
  const res = await fetch(`${API_BASE}/clientes/${id}`, { headers: authHeaders() });
  return parse<ClienteDetail>(res);
}

export async function updateCliente(
  id: number,
  body: ClienteUpdateBody | Record<string, unknown>
): Promise<{ message: string }> {
  const res = await fetch(`${API_BASE}/clientes/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(body),
  });
  return parse<{ message: string }>(res);
}
