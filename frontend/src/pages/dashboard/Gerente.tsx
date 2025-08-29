/**
 * Dashboard · Gerente
 * Enfoque de dirección/negocio: visión general de clientes, ingresos, alertas y altas.
 *
 * Contenido:
 *  - KPIs (Clientes activos, Ingresos del mes, Alertas/Morosidad, Altas del mes).
 *  - Acciones rápidas (Nuevo cliente, Registrar pago, Exportar CSV).
 *  - Tablas/placers: Pagos recientes y Clientes nuevos.
 *
 * Estado actual:
 *  - Usa datos de muestra (placeholders) para layout y estilos.
 *  - Preparado para conectar a endpoints reales (ej. /clientes, /pagos, /reportes).
 *
 * Diseño:
 *  - Borde superior celeste en bloques, consistente con la topbar.
 *  - Tipografía sobria, responsive, dark-mode solo en contenido central.
 *
 * Próximos pasos sugeridos:
 *  - Reemplazar MOCK por fetch (con cache) y filtros por fecha.
 *  - Exportar desde datos reales (CSV/XLSX).
 *  - Estados vacíos/errores y skeletons de carga.
 */

import KpiCard from "../../components/KpiCard";
import {
  Users,
  DollarSign,
  AlertTriangle,
  TrendingUp,
  PlusCircle,
  FileDown,
} from "lucide-react";
import { Link } from "react-router-dom";

const CEL = "#0DA3E3";
const CEL_DARK = "#087BBE";

export default function Gerente() {
  const pagosRecientes = [
    { cliente: "Ana Gómez", monto: "$12.000", fecha: "2025-08-05" },
    { cliente: "Carlos Díaz", monto: "$8.500", fecha: "2025-08-03" },
    { cliente: "SRL Tucumán", monto: "$21.000", fecha: "2025-08-01" },
  ];
  const altasNuevas = [
    { cliente: "María López", plan: "50 Mbps", fecha: "2025-08-06" },
    { cliente: "Tecno SA", plan: "200 Mbps", fecha: "2025-08-05" },
  ];

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="Clientes activos"
          value={1243}
          icon={Users}
          hint="+18 este mes"
          trend="up"
        />
        <KpiCard
          title="Ingresos (mes)"
          value="$ 3.250.000"
          icon={DollarSign}
          hint="Objetivo 4.1M"
        />
        <KpiCard
          title="Alertas / Morosidad"
          value={37}
          icon={AlertTriangle}
          hint="15 críticos"
          trend="down"
        />
        <KpiCard
          title="Altas (mes)"
          value={42}
          icon={TrendingUp}
          hint="+6 vs. mes anterior"
          trend="up"
        />
      </div>

      {/* Acciones rápidas */}
      <div className="flex flex-wrap gap-2">
        <Link
          to="#"
          className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-white shadow-sm"
          style={{
            backgroundImage: `linear-gradient(90deg, ${CEL}, ${CEL_DARK})`,
          }}
        >
          <PlusCircle className="h-4 w-4" />
          Nuevo cliente
        </Link>
        <Link
          to="#"
          className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm dark:border-slate-700"
        >
          Registrar pago (próx.)
        </Link>
        <button className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm dark:border-slate-700">
          <FileDown className="h-4 w-4" />
          Exportar CSV
        </button>
      </div>

      {/* Tablas */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div
          className="rounded-xl border bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
          style={{ borderTopWidth: 4, borderTopColor: CEL }}
        >
          <h3 className="mb-3 text-sm font-semibold">
            Pagos recientes (placeholder)
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-left text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="py-2">Cliente</th>
                  <th>Monto</th>
                  <th>Fecha</th>
                </tr>
              </thead>
              <tbody>
                {pagosRecientes.map((p, i) => (
                  <tr
                    key={i}
                    className="border-t border-slate-100 dark:border-slate-800"
                  >
                    <td className="py-2">{p.cliente}</td>
                    <td>{p.monto}</td>
                    <td>{p.fecha}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div
          className="rounded-xl border bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
          style={{ borderTopWidth: 4, borderTopColor: CEL }}
        >
          <h3 className="mb-3 text-sm font-semibold">Clientes nuevos</h3>
          <ul className="space-y-2 text-sm">
            {altasNuevas.map((a, i) => (
              <li
                key={i}
                className="flex items-center justify-between border-t border-slate-100 py-2 first:border-0 dark:border-slate-800"
              >
                <span>{a.cliente}</span>
                <span className="text-slate-500 dark:text-slate-400">
                  {a.plan} · {a.fecha}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
