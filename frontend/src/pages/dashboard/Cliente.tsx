/**
 * Dashboard · Cliente
 * Contenedor base para ver estado de cuenta, pagos y soporte.
 * (Lugar para tarjetas/resumen del cliente autenticado).
 */

export default function Cliente() {
  return (
    <div className="mx-auto max-w-6xl p-6">
      <h2 className="text-2xl font-bold">Dashboard · Cliente</h2>
      <p className="text-sm text-slate-600 dark:text-slate-300">
        Resumen de cuenta y contratos.
      </p>
    </div>
  );
}
