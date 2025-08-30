// src/lib/clientes.ts
/**
 * Servicios de Clientes (API)
 * - Búsqueda paginada (POST /clientes/search)
 * - Detalle (GET /clientes/:id)
 * - Actualizar (PUT /clientes/:id)
 */

const BASE_URL: string =
  (import.meta as any)?.env?.VITE_API_URL || "http://localhost:8000";

function authHeaders(): Record<string, string> {
  const token =
    localStorage.getItem("token") || sessionStorage.getItem("token") || "";
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function parse<T>(res: Response): Promise<T> {
  const ct = res.headers.get("content-type") || "";
  const data = ct.includes("application/json") ? await res.json() : null;
  if (!res.ok) {
    const msg =
      (data && (data.message || data.detail)) || `Error HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data as T;
}

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

export type ClienteUpdateBody = Partial<{
  nombre: string;
  apellido: string;
  documento: string;
  telefono: string;
  email: string;
  direccion: string;
  estado: ClienteEstado;
}>;

export async function searchClientesPaged(
  params: ClienteSearchParams
): Promise<ClienteSearchResponse> {
  const res = await fetch(`${BASE_URL}/clientes/search`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    } as HeadersInit,
    body: JSON.stringify(params),
  });
  return parse<ClienteSearchResponse>(res);
}

export async function getCliente(id: number): Promise<ClienteDetail> {
  const res = await fetch(`${BASE_URL}/clientes/${id}`, {
    headers: authHeaders() as HeadersInit,
  });
  return parse<ClienteDetail>(res);
}

export async function updateCliente(
  id: number,
  body: ClienteUpdateBody | Record<string, unknown>
): Promise<{ message: string }> {
  const res = await fetch(`${BASE_URL}/clientes/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    } as HeadersInit,
    body: JSON.stringify(body),
  });
  return parse<{ message: string }>(res);
}
