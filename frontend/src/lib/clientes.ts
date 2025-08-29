// src/lib/clientes.ts
import { authHeader } from "./api";

/** Item que devuelve /clientes/search */
export type ClienteListItem = {
  id: number;
  nro_cliente: string;
  nombre: string;
  apellido: string | null;
  documento: string;
  telefono: string | null;
  email: string | null;
  direccion: string | null;
  estado: "activo" | "inactivo";
  creado_en: string | null;
};

/** Body de /clientes/search (coincide con tu Pydantic) */
export type ClienteSearchBody = {
  page: number;
  limit: number;
  buscar?: string;
  estado?: "activo" | "inactivo";
  creado_desde?: string; // YYYY-MM-DD
  creado_hasta?: string; // YYYY-MM-DD
  ordenar_por: "id" | "apellido" | "nro_cliente" | "creado_en";
  orden: "asc" | "desc";
  activos_primero: boolean;
};

/** Respuesta de /clientes/search */
export type ClienteSearchResponse = {
  items: ClienteListItem[];
  page: number;
  limit: number;
  total_count: number;
  total_pages: number;
  has_prev: boolean;
  has_next: boolean;
};

const API = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000";

/** Normaliza headers evitando el error de tipo en RequestInit.headers */
function jsonHeaders(): HeadersInit {
  const base: Record<string, string> = { "Content-Type": "application/json" };
  const ah = authHeader() as Record<string, string | undefined>;
  if (ah?.Authorization) base.Authorization = ah.Authorization;
  return base;
}

/** POST /clientes/search — paginado con filtros */
export async function searchClientesPaged(
  body: Partial<ClienteSearchBody>
): Promise<ClienteSearchResponse> {
  const payload: ClienteSearchBody = {
    page: body.page ?? 1,
    limit: body.limit ?? 20,
    buscar: body.buscar?.trim() || undefined,
    estado: body.estado,
    creado_desde: body.creado_desde,
    creado_hasta: body.creado_hasta,
    ordenar_por: body.ordenar_por ?? "id",
    orden: body.orden ?? "asc",
    activos_primero: body.activos_primero ?? false,
  };

  const res = await fetch(`${API}/clientes/search`, {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const msg = await res.text().catch(() => "");
    throw new Error(msg || `HTTP ${res.status} ${res.statusText}`);
  }
  return (await res.json()) as ClienteSearchResponse;
}

/** GET /clientes/{id} — detalle */
export type ClienteDetalle = ClienteListItem;

export async function getClienteDetalle(id: number): Promise<ClienteDetalle> {
  const res = await fetch(`${API}/clientes/${id}`, {
    headers: jsonHeaders(),
  });
  if (!res.ok) {
    const msg = await res.text().catch(() => "");
    throw new Error(msg || `HTTP ${res.status} ${res.statusText}`);
  }
  return (await res.json()) as ClienteDetalle;
}
