// src/pages/clientes/ClienteDetalle.tsx
/**
 * ClienteDetalle
 * - Datos básicos del cliente
 * - Acciones (editar, pago, contrato) — placeholders
 * - Bloques de historial (placeholders)
 */

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getClienteDetalle, type ClienteDetalle } from "../../lib/clientes";
import {
  Loader2,
  ArrowLeft,
  Pencil,
  CreditCard,
  FileSignature,
} from "lucide-react";
import { toast } from "react-toastify";

const CEL = "#0DA3E3";

export default function ClienteDetallePage() {
  const { id } = useParams();
  const nav = useNavigate();
  const [loading, setLoading] = useState(true);
  const [c, setC] = useState<ClienteDetalle | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        if (!id) throw new Error("ID inválido");
        const data = await getClienteDetalle(Number(id));
        if (alive) setC(data);
      } catch (e: any) {
        toast.error(e?.message || "No se pudo cargar el cliente");
        nav(-1);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [id, nav]);

  if (loading) {
    return (
      <div className="grid min-h-[40vh] place-items-center">
        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-200">
          <Loader2 className="h-4 w-4 animate-spin" />
          Cargando cliente…
        </div>
      </div>
    );
  }

  if (!c) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">Cliente #{c.nro_cliente}</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {c.apellido ? `${c.apellido}, ${c.nombre}` : c.nombre} —{" "}
            {c.documento}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm dark:border-slate-700"
            onClick={() => nav(-1)}
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </button>
          <button className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm dark:border-slate-700">
            <Pencil className="h-4 w-4" />
            Editar (próx.)
          </button>
          <button className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm dark:border-slate-700">
            <CreditCard className="h-4 w-4" />
            Generar pago (próx.)
          </button>
          <button className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm dark:border-slate-700">
            <FileSignature className="h-4 w-4" />
            Nuevo contrato (próx.)
          </button>
        </div>
      </div>

      {/* Datos básicos */}
      <div
        className="rounded-xl border bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
        style={{ borderTopWidth: 4, borderTopColor: CEL }}
      >
        <h3 className="mb-3 text-sm font-semibold">Datos del cliente</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 text-sm">
          <div>
            <span className="text-slate-500 dark:text-slate-400">Nombre:</span>{" "}
            {c.nombre}
          </div>
          <div>
            <span className="text-slate-500 dark:text-slate-400">
              Apellido:
            </span>{" "}
            {c.apellido ?? "-"}
          </div>
          <div>
            <span className="text-slate-500 dark:text-slate-400">
              Documento:
            </span>{" "}
            {c.documento}
          </div>
          <div>
            <span className="text-slate-500 dark:text-slate-400">Email:</span>{" "}
            {c.email ?? "-"}
          </div>
          <div>
            <span className="text-slate-500 dark:text-slate-400">
              Teléfono:
            </span>{" "}
            {c.telefono ?? "-"}
          </div>
          <div>
            <span className="text-slate-500 dark:text-slate-400">
              Dirección:
            </span>{" "}
            {c.direccion ?? "-"}
          </div>
          <div>
            <span className="text-slate-500 dark:text-slate-400">Estado:</span>{" "}
            {c.estado}
          </div>
          <div>
            <span className="text-slate-500 dark:text-slate-400">Creado:</span>{" "}
            {c.creado_en ? new Date(c.creado_en).toLocaleString() : "-"}
          </div>
        </div>
      </div>

      {/* Historiales (placeholders) */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div
          className="rounded-xl border bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
          style={{ borderTopWidth: 4, borderTopColor: CEL }}
        >
          <h3 className="mb-3 text-sm font-semibold">
            Historial de pagos (próx.)
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Aquí verás los pagos realizados por el cliente, con filtros por
            fecha y método.
          </p>
        </div>

        <div
          className="rounded-xl border bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
          style={{ borderTopWidth: 4, borderTopColor: CEL }}
        >
          <h3 className="mb-3 text-sm font-semibold">
            Contratos / Planes (próx.)
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Resumen de contratos, cambios de plan y vigencias asociadas al
            servicio.
          </p>
        </div>
      </div>
    </div>
  );
}
