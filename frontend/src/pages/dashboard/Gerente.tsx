// src/pages/dashboard/Gerente.tsx
/**
 * Dashboard · Gerente
 * - KPIs ejecutivos (ingresos, clientes, churn, SLA)
 * - Selector de periodo (7/30/90/YTD) con pausa mínima y overlay “Cargando…”
 * - Tendencia de ingresos (sparkline SVG, sin dependencias externas)
 * - Distribución de planes (barras horizontales)
 * - Alertas y Actividad reciente (placeholders listos para API)
 *
 * TODO (backend):
 * - Reemplazar 'fetchSummary(period)' por llamadas reales (e.g. /metrics/ingresos?range=30d)
 * - Conectar "Alertas" y "Actividad" a endpoints de cobranza/tickets
 */

import { useEffect, useMemo, useState } from "react";
import KpiCard from "../../components/KpiCard";
import {
  TrendingUp,
  Users,
  Activity,
  CheckCircle2,
  DollarSign,
  AlertTriangle,
  Loader2,
  CalendarDays,
  BarChart3,
} from "lucide-react";

const CEL = "#0DA3E3";
const CEL_DARK = "#087BBE";
const MIN_LOADING_MS = 250 as const;

type Period = "7d" | "30d" | "90d" | "ytd";

type Summary = {
  ingresosTotal: number;
  ingresosDelta: number; // variación %
  clientesActivos: number;
  clientesDelta: number; // variación %
  churn: number; // %
  sla: number; // %
  ingresosSerie: number[]; // para sparkline
  planes: { nombre: string; cuentas: number; pct: number }[];
  alertas: {
    id: string;
    titulo: string;
    detalle: string;
    severidad: "alta" | "media" | "baja";
  }[];
  actividad: { id: string; titulo: string; cuando: string }[];
};

// Simulación: genera datos coherentes por período
function mockSummary(period: Period): Summary {
  const baseLen =
    period === "7d" ? 7 : period === "30d" ? 30 : period === "90d" ? 30 : 30;
  const ingresosSerie = Array.from({ length: baseLen }, (_, i) => {
    const trend = period === "7d" ? 1200 : period === "30d" ? 1100 : 1000;
    const noise = Math.sin(i / 2.7) * 80 + Math.random() * 60;
    return Math.max(650, trend + noise);
  });

  const ingresosTotal = ingresosSerie.reduce((a, b) => a + b, 0);
  const ingresosDelta =
    period === "7d"
      ? 4.2
      : period === "30d"
      ? 7.8
      : period === "90d"
      ? 12.1
      : 9.5;

  const clientesActivos =
    period === "ytd"
      ? 1240
      : period === "90d"
      ? 1180
      : period === "30d"
      ? 1130
      : 1105;
  const clientesDelta =
    period === "7d"
      ? 0.8
      : period === "30d"
      ? 1.9
      : period === "90d"
      ? 4.4
      : 6.2;

  const churn = period === "7d" ? 1.1 : period === "30d" ? 1.4 : 1.6;
  const sla = period === "7d" ? 97.2 : period === "30d" ? 96.4 : 95.8;

  const planesDist = [
    { nombre: "Básico 20Mb", cuentas: 420 },
    { nombre: "Estándar 50Mb", cuentas: 510 },
    { nombre: "Pro 100Mb", cuentas: 230 },
    { nombre: "Empresas 200Mb", cuentas: 80 },
  ];
  const totalPlanes = planesDist.reduce((a, b) => a + b.cuentas, 0);
  const planes = planesDist.map((p) => ({
    ...p,
    pct: Math.round((p.cuentas / totalPlanes) * 100),
  }));

  const alertas = [
    {
      id: "a1",
      titulo: "Morosidad > 45 días",
      detalle: "12 cuentas en zona Bovril",
      severidad: "alta" as const,
    },
    {
      id: "a2",
      titulo: "Tickets en cola",
      detalle: "5 tickets pendientes > 24h",
      severidad: "media" as const,
    },
    {
      id: "a3",
      titulo: "Caída de ARPU",
      detalle: "ARPU -1.1% vs mes anterior",
      severidad: "baja" as const,
    },
  ];

  const actividad = [
    {
      id: "ev1",
      titulo: "Alta de cliente: Juan Pérez (Plan 50Mb)",
      cuando: "hoy 10:14",
    },
    { id: "ev2", titulo: "Pago registrado: #FAC-10321", cuando: "ayer 18:22" },
    {
      id: "ev3",
      titulo: "Cambio de plan: García, Ana → 100Mb",
      cuando: "ayer 11:03",
    },
  ];

  return {
    ingresosTotal: Math.round(ingresosTotal),
    ingresosDelta,
    clientesActivos,
    clientesDelta,
    churn,
    sla,
    ingresosSerie,
    planes,
    alertas,
    actividad,
  };
}

// Pausa mínima para el overlay de carga
async function withMinDelay<T>(p: Promise<T>, ms: number): Promise<T> {
  const [res] = await Promise.all([
    p,
    new Promise<void>((r) => setTimeout(r, ms)),
  ]);
  return res;
}

// Simula fetch (reemplazar por API real)
async function fetchSummary(period: Period): Promise<Summary> {
  return mockSummary(period);
}

// Sparkline SVG simple (sin dependencias)
function Sparkline({
  data,
  width = 320,
  height = 64,
  stroke = CEL,
}: {
  data: number[];
  width?: number;
  height?: number;
  stroke?: string;
}) {
  const { points, min, max } = useMemo(() => {
    if (!data.length) return { points: "", min: 0, max: 1 };
    const min = Math.min(...data);
    const max = Math.max(...data);
    const span = Math.max(1, max - min);
    const stepX = width / Math.max(1, data.length - 1);

    const pts = data
      .map((v, i) => {
        const x = Math.round(i * stepX);
        const y = Math.round(height - ((v - min) / span) * height);
        return `${x},${y}`;
      })
      .join(" ");

    return { points: pts, min, max };
  }, [data, width, height]);

  // fondo suave
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="overflow-visible"
    >
      <defs>
        <linearGradient id="sparkFill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={CEL} stopOpacity="0.25" />
          <stop offset="100%" stopColor={CEL} stopOpacity="0" />
        </linearGradient>
      </defs>
      {points && (
        <>
          <polyline
            points={points}
            fill="none"
            stroke={stroke}
            strokeWidth={2}
          />
          {/* área bajo la curva */}
          <polygon
            points={`${points} ${width},${height} 0,${height}`}
            fill="url(#sparkFill)"
          />
        </>
      )}
      {/* línea base muy tenue */}
      <line
        x1="0"
        y1={height - 1}
        x2={width}
        y2={height - 1}
        stroke="currentColor"
        opacity={0.08}
      />
      <title>
        Mín: {min} — Máx: {max}
      </title>
    </svg>
  );
}

export default function Gerente() {
  const [period, setPeriod] = useState<Period>("30d");
  const [loading, setLoading] = useState(false);
  const [sum, setSum] = useState<Summary | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const data = await withMinDelay(fetchSummary(period), MIN_LOADING_MS);
        if (alive) setSum(data);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [period]);

  const ingresosFmt = useMemo(
    () =>
      sum
        ? new Intl.NumberFormat("es-AR", {
            style: "currency",
            currency: "ARS",
            maximumFractionDigits: 0,
          }).format(sum.ingresosTotal)
        : "—",
    [sum]
  );

  return (
    <div className="space-y-6">
      {/* Encabezado + selector de período */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold">Panel gerencial</h1>

        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-slate-500 dark:text-slate-300" />
          <div className="rounded-lg border dark:border-slate-700 overflow-hidden">
            {(["7d", "30d", "90d", "ytd"] as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 text-sm ${
                  period === p
                    ? "bg-slate-200 text-slate-900 dark:bg-slate-700 dark:text-white"
                    : "hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                {p === "7d"
                  ? "7 días"
                  : p === "30d"
                  ? "30 días"
                  : p === "90d"
                  ? "90 días"
                  : "YTD"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="Ingresos (período)"
          value={ingresosFmt}
          icon={DollarSign}
          hint={
            sum
              ? `${sum.ingresosDelta > 0 ? "▲" : "▼"} ${Math.abs(
                  sum.ingresosDelta
                ).toFixed(1)}% vs período anterior`
              : "—"
          }
        />
        <KpiCard
          title="Clientes activos"
          value={sum ? sum.clientesActivos : "—"}
          icon={Users}
          hint={
            sum
              ? `${sum.clientesDelta > 0 ? "▲" : "▼"} ${Math.abs(
                  sum.clientesDelta
                ).toFixed(1)}%`
              : "—"
          }
        />
        <KpiCard
          title="Churn"
          value={sum ? `${sum.churn.toFixed(2)}%` : "—"}
          icon={Activity}
          hint="Objetivo < 2%"
        />
        <KpiCard
          title="SLA soporte"
          value={sum ? `${sum.sla.toFixed(1)}%` : "—"}
          icon={CheckCircle2}
          hint="Objetivo ≥ 97%"
        />
      </div>

      {/* Grillas principales */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Tendencia de ingresos */}
        <div
          className="lg:col-span-2 rounded-xl border bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
          style={{ borderTopWidth: 4, borderTopColor: CEL }}
        >
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold">Tendencia de ingresos</h3>
            <div className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs dark:border-slate-700">
              <TrendingUp className="h-3.5 w-3.5" />
              {sum
                ? `${sum.ingresosDelta >= 0 ? "↑" : "↓"} ${Math.abs(
                    sum.ingresosDelta
                  ).toFixed(1)}%`
                : "—"}
            </div>
          </div>

          <div className="overflow-x-auto">
            {sum ? (
              <Sparkline data={sum.ingresosSerie} width={640} height={96} />
            ) : (
              <div className="h-24" />
            )}
          </div>

          <div className="mt-3 text-sm text-slate-600 dark:text-slate-300">
            Total período: <span className="font-semibold">{ingresosFmt}</span>
          </div>
        </div>

        {/* Distribución de planes */}
        <div
          className="rounded-xl border bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
          style={{ borderTopWidth: 4, borderTopColor: CEL }}
        >
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold">Distribución de planes</h3>
            <BarChart3 className="h-4 w-4 text-slate-400" />
          </div>

          <div className="space-y-3">
            {sum?.planes.map((p) => (
              <div key={p.nombre}>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-700 dark:text-slate-200">
                    {p.nombre}
                  </span>
                  <span className="text-slate-500 dark:text-slate-400">
                    {p.cuentas} · {p.pct}%
                  </span>
                </div>
                <div className="mt-1 h-2 rounded-full bg-slate-200 dark:bg-slate-800">
                  <div
                    className="h-2 rounded-full"
                    style={{
                      width: `${p.pct}%`,
                      backgroundImage: `linear-gradient(90deg, ${CEL}, ${CEL_DARK})`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Alertas y Actividad */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Alertas */}
        <div
          className="rounded-xl border bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
          style={{ borderTopWidth: 4, borderTopColor: CEL }}
        >
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold">Alertas</h3>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </div>

          <ul className="space-y-2 text-sm">
            {sum?.alertas.map((a) => (
              <li
                key={a.id}
                className="flex items-start justify-between gap-3 rounded-lg border p-3 dark:border-slate-700"
              >
                <div>
                  <div className="font-medium">{a.titulo}</div>
                  <div className="text-slate-600 dark:text-slate-400">
                    {a.detalle}
                  </div>
                </div>
                <span
                  className={`mt-0.5 inline-flex h-6 items-center rounded-full px-2 text-xs font-semibold ${
                    a.severidad === "alta"
                      ? "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-200"
                      : a.severidad === "media"
                      ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200"
                      : "bg-slate-100 text-slate-700 dark:bg-slate-800/60 dark:text-slate-200"
                  }`}
                >
                  {a.severidad}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Actividad reciente */}
        <div
          className="rounded-xl border bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
          style={{ borderTopWidth: 4, borderTopColor: CEL }}
        >
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold">Actividad reciente</h3>
          </div>

          <ul className="space-y-2 text-sm">
            {sum?.actividad.map((ev) => (
              <li
                key={ev.id}
                className="flex items-center justify-between gap-3 rounded-lg border p-3 dark:border-slate-700"
              >
                <div className="text-slate-700 dark:text-slate-200">
                  {ev.titulo}
                </div>
                <div className="text-slate-500 dark:text-slate-400">
                  {ev.cuando}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Overlay de carga (sobre toda la página) */}
      {loading && (
        <div className="fixed inset-0 z-40 grid place-items-center bg-black/10 dark:bg-black/20">
          <div className="flex items-center gap-2 rounded-md bg-white px-3 py-2 text-slate-700 shadow dark:bg-slate-900 dark:text-slate-200">
            <Loader2 className="h-4 w-4 animate-spin" />
            Cargando…
          </div>
        </div>
      )}
    </div>
  );
}
