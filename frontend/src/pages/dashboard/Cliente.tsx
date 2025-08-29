/**
 * Dashboard · Cliente
 * Contenedor base para ver estado de cuenta, pagos y soporte.
 * (Lugar para tarjetas/resumen del cliente autenticado).
 */

import KpiCard from "../../components/KpiCard";
import { Wifi, CreditCard, FileText, LifeBuoy } from "lucide-react";

const CEL = "#0DA3E3";
const CEL_DARK = "#087BBE";

export default function Cliente() {
  const movimientos = [
    { detalle: "Pago recibido", fecha: "2025-08-01", monto: "$8.500" },
    { detalle: "Debito de plan", fecha: "2025-07-01", monto: "$8.500" },
  ];

  return (
    <div className="space-y-6">
      {/* KPIs resumidos */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard
          title="Plan"
          value="100 Mbps"
          icon={Wifi}
          hint="Última actualización: 2025-07-10"
        />
        <KpiCard
          title="Estado"
          value="Activo"
          icon={FileText}
          hint="Sin incidencias"
        />
        <KpiCard
          title="Saldo"
          value="$ 0"
          icon={CreditCard}
          hint="Próx. venc.: 01/09 (placeholder)"
        />
      </div>

      {/* Bloques */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div
          className="rounded-xl border bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
          style={{ borderTopWidth: 4, borderTopColor: CEL }}
        >
          <h3 className="mb-3 text-sm font-semibold">
            Mis movimientos (placeholder)
          </h3>
          <ul className="space-y-2 text-sm">
            {movimientos.map((m, i) => (
              <li
                key={i}
                className="flex items-center justify-between border-t border-slate-100 py-2 first:border-0 dark:border-slate-800"
              >
                <span>{m.detalle}</span>
                <span className="text-slate-500 dark:text-slate-400">
                  {m.fecha} · {m.monto}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div
          className="rounded-xl border bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
          style={{ borderTopWidth: 4, borderTopColor: CEL }}
        >
          <h3 className="mb-3 text-sm font-semibold">Acciones</h3>
          <div className="flex flex-wrap gap-2">
            <button
              className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-white shadow-sm"
              style={{
                backgroundImage: `linear-gradient(90deg, ${CEL}, ${CEL_DARK})`,
              }}
            >
              <CreditCard className="h-4 w-4" />
              Pagar ahora (próx.)
            </button>
            <button className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm dark:border-slate-700">
              <LifeBuoy className="h-4 w-4" />
              Crear ticket
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
