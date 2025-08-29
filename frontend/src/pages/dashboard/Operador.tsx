/**
 * Dashboard · Operador
 * Enfoque operativo: trabajo diario sobre clientes, altas y tareas técnicas.
 *
 * Contenido:
 *  - KPIs (Tickets abiertos, Altas pendientes, Cortes programados, SLA).
 *  - Búsqueda rápida de clientes (filtro local de ejemplo).
 *  - Acciones: Alta de cliente, Programar visita (placeholders).
 *
 * Estado actual:
 *  - MOCK para resultados de búsqueda; pensado para migrar a /clientes/search.
 *
 * Diseño:
 *  - Componentes sobrios, tabla responsive y controles accesibles.
 *  - Borde superior celeste en bloques, consistente con la identidad.
 *
 * Próximos pasos sugeridos:
 *  - Integrar paginación/orden con backend.
 *  - Agregar toasts y validaciones al crear tareas/altas.
 *  - Estados vacíos y manejo de permisos por rol.
 */

// src/pages/dashboard/Operador.tsx
/**
 * Dashboard · Operador
 * Ahora con búsqueda REAL contra el backend.
 * - Escribe 2+ caracteres para buscar por nombre o documento.
 * - Con 0–1 caracteres muestra una lista inicial (limit 20).
 */

import KpiCard from "../../components/KpiCard";
import { ClipboardList, UserPlus, Wrench, Clock, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { listClientes, searchClientes, type Cliente } from "../../lib/clientes";
import { toast } from "react-toastify";

const CEL = "#0DA3E3";
const CEL_DARK = "#087BBE";

export default function Operador() {
  // KPIs placeholder (igual que antes)
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [error, setError] = useState<string | null>(null);

  // cargar lista inicial
  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const data = await listClientes(20);
        if (alive) setClientes(data);
      } catch (e: any) {
        setError(e?.message || "No se pudo obtener clientes.");
        toast.error(e?.message || "No se pudo obtener clientes.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // búsqueda con debounce
  useEffect(() => {
    let alive = true;
    const term = q.trim();
    const handler = setTimeout(async () => {
      if (!alive) return;
      if (term.length < 2) {
        // con término corto, recarga lista corta
        try {
          setLoading(true);
          const data = await listClientes(20);
          if (alive) setClientes(data);
        } catch (e: any) {
          if (alive) {
            setError(e?.message || "Error al listar clientes.");
            toast.error(e?.message || "Error al listar clientes.");
          }
        } finally {
          if (alive) setLoading(false);
        }
        return;
      }
      try {
        setLoading(true);
        const data = await searchClientes(term);
        if (alive) {
          setClientes(data);
          setError(null);
        }
      } catch (e: any) {
        if (alive) {
          setError(e?.message || "Error en la búsqueda.");
          toast.error(e?.message || "Error en la búsqueda.");
        }
      } finally {
        if (alive) setLoading(false);
      }
    }, 350); // debounce

    return () => {
      alive = false;
      clearTimeout(handler);
    };
  }, [q]);

  const rows = useMemo(() => clientes ?? [], [clientes]);

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="Tickets abiertos"
          value={7}
          icon={ClipboardList}
          hint="3 urgentes"
        />
        <KpiCard
          title="Altas pendientes"
          value={5}
          icon={UserPlus}
          hint="2 programadas hoy"
        />
        <KpiCard
          title="Cortes programados"
          value={1}
          icon={Wrench}
          hint="09:00–11:00"
        />
        <KpiCard title="SLA hoy" value="96%" icon={Clock} hint="Objetivo 98%" />
      </div>

      {/* Búsqueda rápida */}
      <div
        className="rounded-xl border bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
        style={{ borderTopWidth: 4, borderTopColor: CEL }}
      >
        <h3 className="mb-3 text-sm font-semibold">
          Búsqueda rápida de clientes
        </h3>

        <div className="relative mb-3">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <Search className="h-4 w-4" />
          </span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Nombre o documento…"
            className="w-full rounded-lg border bg-white pl-9 pr-3 py-2 outline-none transition focus:ring-2 dark:border-slate-700 dark:bg-slate-950/50"
            style={{ borderColor: "#cbd5e1" }}
          />
        </div>

        {/* Tabla */}
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-left text-slate-500 dark:text-slate-400">
              <tr>
                <th className="py-2">Nombre</th>
                <th>Documento</th>
                <th>Email</th>
                <th>Teléfono</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td
                    colSpan={5}
                    className="py-6 text-center text-slate-500 dark:text-slate-400"
                  >
                    Cargando…
                  </td>
                </tr>
              )}

              {!loading && rows.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="py-6 text-center text-slate-500 dark:text-slate-400"
                  >
                    Sin resultados
                  </td>
                </tr>
              )}

              {!loading &&
                rows.map((c) => (
                  <tr
                    key={c.id}
                    className="border-t border-slate-100 dark:border-slate-800"
                  >
                    <td className="py-2">{c.nombre}</td>
                    <td>{c.documento}</td>
                    <td>{c.email ?? "-"}</td>
                    <td>{c.telefono ?? "-"}</td>
                    <td>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${
                          c.activo
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200"
                            : "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-200"
                        }`}
                      >
                        {c.activo ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* Acciones */}
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-white shadow-sm"
            style={{
              backgroundImage: `linear-gradient(90deg, ${CEL}, ${CEL_DARK})`,
            }}
          >
            <UserPlus className="h-4 w-4" />
            Alta de cliente (próx.)
          </button>
          <button className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm dark:border-slate-700">
            <Wrench className="h-4 w-4" />
            Programar visita (próx.)
          </button>
        </div>
      </div>
    </div>
  );
}
