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

import KpiCard from "../../components/KpiCard";
import { ClipboardList, UserPlus, Wrench, Clock, Search } from "lucide-react";
import { useMemo, useState } from "react";

const CEL = "#0DA3E3";
const CEL_DARK = "#087BBE";

const MOCK = [
  {
    nombre: "Ana Gómez",
    doc: "20000000000",
    plan: "100 Mbps",
    estado: "Activo",
  },
  {
    nombre: "Carlos Díaz",
    doc: "20000000001",
    plan: "50 Mbps",
    estado: "Suspendido",
  },
  {
    nombre: "María López",
    doc: "20000000002",
    plan: "200 Mbps",
    estado: "Activo",
  },
];

export default function Operador() {
  const [q, setQ] = useState("");
  const results = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return MOCK;
    return MOCK.filter(
      (c) => c.nombre.toLowerCase().includes(s) || c.doc.includes(s)
    );
  }, [q]);

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
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-left text-slate-500 dark:text-slate-400">
              <tr>
                <th className="py-2">Nombre</th>
                <th>Documento</th>
                <th>Plan</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {results.map((c, i) => (
                <tr
                  key={i}
                  className="border-t border-slate-100 dark:border-slate-800"
                >
                  <td className="py-2">{c.nombre}</td>
                  <td>{c.doc}</td>
                  <td>{c.plan}</td>
                  <td>{c.estado}</td>
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
            Alta de cliente
          </button>
          <button className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm dark:border-slate-700">
            <Wrench className="h-4 w-4" />
            Programar visita
          </button>
        </div>
      </div>
    </div>
  );
}
