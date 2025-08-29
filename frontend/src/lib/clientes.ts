// src/lib/clientes.ts
import { authHeader } from "./api";

export type Cliente = {
  id: number;
  nombre: string;
  documento: string;
  email?: string;
  telefono?: string;
  direccion?: string;
  activo?: boolean;
};

const API = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000";

async function getJSON<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: authHeader() });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json() as Promise<T>;
}

// 🔎 búsqueda
export async function searchClientes(term: string): Promise<Cliente[]> {
  const q = encodeURIComponent(term.trim());
  const candidates = [
    `${API}/clientes/search/?q=${q}`,
    `${API}/clientes/search?q=${q}`,
    `${API}/cliente/search/?q=${q}`,
    `${API}/cliente/search?q=${q}`,
  ];
  for (const url of candidates) {
    try { return await getJSON<Cliente[]>(url); } catch {}
  }
  throw new Error("No se pudo resolver el endpoint de búsqueda de clientes.");
}

// 📄 listado
export async function listClientes(limit = 20): Promise<Cliente[]> {
  const candidates = [
    `${API}/clientes/?limit=${limit}`,  // ← evita 307 usando /.../
    `${API}/clientes?limit=${limit}`,
    `${API}/cliente/?limit=${limit}`,   // por si tu ruta es singular
    `${API}/cliente?limit=${limit}`,
  ];
  for (const url of candidates) {
    try { return await getJSON<Cliente[]>(url); } catch {}
  }
  throw new Error("No se pudo listar clientes.");
}
