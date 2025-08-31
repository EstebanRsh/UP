// src/pages/dashboard/Gerente.tsx
/**
 * Dashboard · Gerente
 * - KPIs ejecutivos + gráficos
 * - Card “Clientes” con búsqueda, filtros, paginación (igual a Operador)
 *
 * Fix TS:
 * - withMinDelay acepta Promise<T> | T y normaliza con Promise.resolve
 * - Llamada tipada: withMinDelay<Summary>(mockSummary(...), ...)
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
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
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

// Ajustá estos imports a tu proyecto:
import {
  searchClientesPaged,
  type ClienteListItem,
  type ClienteSearchResponse,
} from "../../lib/clientes";

// Colores base (coinciden con tu branding)
const CEL = "#0DA3E3";
const CEL_DARK = "#087BBE";
const MIN_LOADING_MS = 250 as const;

/* =========================================================
 * Tipos
 * =======================================================*/
type Period = "7d" | "30d" | "90d" | "ytd";
type Summary = {
  ingresosTotal: number;
  ingresosDelta: number;
  clientesActivos: number;
  clientesDelta: number;
  churn: number;
  sla: number;
  ingresosSerie: number[];
  planes: { nombre: string; cuentas: number; pct: number }[];
  alertas: {
    id: string;
    titulo: string;
    detalle: string;
    severidad: "alta" | "media" | "baja";
  }[];
  actividad: { id: string; titulo: string; cuando: string }[];
};

/* =========================================================
 * Utilidades
 * =======================================================*/

// ✅ Acepta Promise<T> o T sincrónico
async function withMinDelay<T>(p: Promise<T> | T, ms: number): Promise<T> {
  const [res] = await Promise.all([
    Promise.resolve(p),
    new Promise<void>((r) => setTimeout(r, ms)),
  ]);
  return res;
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function getPaginationRange(
  current: number,
  total: number,
  siblingCount = 1
): (number | "…")[] {
  const totalPageNumbers = siblingCount * 2 + 5;
  if (total <= totalPageNumbers)
    return Array.from({ length: total }, (_, i) => i + 1);

  const left = Math.max(current - siblingCount, 1);
  const right = Math.min(current + siblingCount, total);

  const showLeftDots = left > 2;
  const showRightDots = right < total - 1;
  const first = 1,
    last = total;

  if (!showLeftDots && showRightDots) {
    const leftRange = Array.from(
      { length: 3 + 2 * siblingCount },
      (_, i) => i + 1
    );
    return [...leftRange, "…", last];
  }
  if (showLeftDots && !showRightDots) {
    const count = 3 + 2 * siblingCount;
    const start = last - count + 1;
    const rightRange = Array.from({ length: count }, (_, i) => start + i);
    return [first, "…", ...rightRange];
  }
  const middle = Array.from({ length: right - left + 1 }, (_, i) => left + i);
  return [first, "…", ...middle, "…", last];
}

/* =========================================================
 * Datos mock para KPIs (síncrono a propósito)
 * =======================================================*/
function mockSummary(period: Period): Summary {
  const baseLen =
    period === "7d" ? 7 : period === "30d" ? 30 : period === "90d" ? 30 : 30;
  const ingresosSerie = Array.from({ length: baseLen }, (_, i) => {
    const trend = period === "7d" ? 1200 : period === "30d" ? 1100 : 1000;
    const noise = Math.sin(i / 2.7) * 80 + Math.random() * 60;
    return Math.max(650, Math.round(trend + noise));
  });

  const ingresosTotal = ingresosSerie.reduce((a, b) => a + b, 0);
  const ingresosDelta =
    period === "7d"
      ? 4.2
      : period === "30d"
      ? 7.8
      : period === "90d"
      ? 10.3
      : 12.1;
  const clientesActivos =
    period === "ytd"
      ? 1240
      : period === "90d"
      ? 1180
      : period === "30d"
      ? 1130
      : 1105;
  const clientesDelta = period === "7d" ? 0.8 : period === "30d" ? 1.9 : 4.4;
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

/* =========================================================
 * Mini sparkline (SVG simple)
 * =======================================================*/
function Sparkline({
  data,
  width = 640,
  height = 96,
}: {
  data: number[];
  width?: number;
  height?: number;
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
          <polyline points={points} fill="none" stroke={CEL} strokeWidth={2} />
          <polygon
            points={`${points} ${width},${height} 0,${height}`}
            fill="url(#sparkFill)"
          />
        </>
      )}
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

/* =========================================================
 * Tabla de Clientes (idéntica UX a Operador)
 * =======================================================*/
const ROW_H = 44;
const HEADER_PAD = 56;
const tableMinHeight = (limit: number) =>
  Math.max(260, ROW_H * limit + HEADER_PAD);

type Params = {
  page: number;
  limit: number;
  buscar: string;
  estado: "" | "activo" | "inactivo";
  ordenar_por: "id" | "apellido" | "nro_cliente" | "creado_en";
  orden: "asc" | "desc";
  activos_primero: boolean;
};

/* =========================================================
 * Componente principal
 * =======================================================*/
export default function Gerente() {
  /* -------- KPIs / Ejecutiva -------- */
  const [period, setPeriod] = useState<Period>("30d");
  const [sumLoading, setSumLoading] = useState(false);
  const [sum, setSum] = useState<Summary | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      setSumLoading(true);
      try {
        // ✅ Tipamos para que T = Summary
        const data = await withMinDelay<Summary>(
          mockSummary(period),
          MIN_LOADING_MS
        );
        if (alive) setSum(data);
      } finally {
        if (alive) setSumLoading(false);
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

  /* -------- Clientes (misma operativa que Operador) -------- */
  const [params, setParams] = useState<Params>({
    page: 1,
    limit: 20,
    buscar: "",
    estado: "",
    ordenar_por: "id",
    orden: "asc",
    activos_primero: false,
  });

  const [debouncedBuscar, setDebouncedBuscar] = useState(params.buscar);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedBuscar(params.buscar), 350);
    return () => clearTimeout(t);
  }, [params.buscar]);

  const [loading, setLoading] = useState(false);
  const [resp, setResp] = useState<ClienteSearchResponse | null>(null);

  const lastScrollYRef = useRef<number>(0);
  const shouldRestoreScrollRef = useRef(false);
  function rememberScrollAnd(fn: () => void) {
    lastScrollYRef.current = window.scrollY;
    shouldRestoreScrollRef.current = true;
    fn();
  }
  useEffect(() => {
    if (!loading && shouldRestoreScrollRef.current) {
      shouldRestoreScrollRef.current = false;
      window.scrollTo({ top: lastScrollYRef.current, behavior: "auto" });
    }
  }, [loading]);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const data = await withMinDelay(
          searchClientesPaged({
            page: params.page,
            limit: params.limit,
            buscar: debouncedBuscar || undefined,
            estado: params.estado || undefined,
            ordenar_por: params.ordenar_por,
            orden: params.orden,
            activos_primero: params.activos_primero,
          }),
          MIN_LOADING_MS
        );

        if (!alive) return;

        const totalPages = Math.max(1, data.total_pages || 1);
        if (params.page > totalPages) {
          setParams((p) => ({ ...p, page: totalPages }));
          setResp({ ...data, page: totalPages });
        } else if (params.page < 1) {
          setParams((p) => ({ ...p, page: 1 }));
          setResp({ ...data, page: 1 });
        } else {
          setResp(data);
        }
      } catch {
        if (!alive) return;
        setResp({
          items: [],
          page: 1,
          limit: params.limit,
          total_count: 0,
          total_pages: 1,
          has_prev: false,
          has_next: false,
        });
        setParams((p) => ({ ...p, page: 1 }));
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [
    params.page,
    params.limit,
    debouncedBuscar,
    params.estado,
    params.ordenar_por,
    params.orden,
    params.activos_primero,
  ]);

  const rows: ClienteListItem[] = useMemo(() => resp?.items ?? [], [resp]);

  function update<K extends keyof Params>(key: K, value: Params[K]) {
    setParams((p) => {
      const next: Params = { ...p, [key]: value } as Params;
      if (
        key === "buscar" ||
        key === "estado" ||
        key === "limit" ||
        key === "ordenar_por" ||
        key === "orden" ||
        key === "activos_primero"
      ) {
        next.page = 1;
      }
      if (next.page < 1) next.page = 1;
      return next;
    });
  }
  function updateRemember<K extends keyof Params>(key: K, value: Params[K]) {
    rememberScrollAnd(() => update(key, value));
  }

  const totalPages = Math.max(1, resp?.total_pages ?? 1);
  const page = clamp(params.page, 1, totalPages);
  const canPrev = !loading && page > 1;
  const canNext = !loading && page < totalPages;
  const pages = useMemo(
    () => getPaginationRange(page, totalPages, 1),
    [page, totalPages]
  );

  const placeholdersCount =
    !loading && rows.length > 0 ? Math.max(0, params.limit - rows.length) : 0;

  /* -------- Render -------- */
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

      {/* Tendencia + Distribución */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
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
              <Sparkline data={sum.ingresosSerie} />
            ) : (
              <div className="h-24" />
            )}
          </div>
          <div className="mt-3 text-sm text-slate-600 dark:text-slate-300">
            Total período: <span className="font-semibold">{ingresosFmt}</span>
          </div>
        </div>

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

      {/* Alertas + Actividad */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
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

      {/* ====== Clientes ====== */}
      <div
        className="flex flex-col rounded-xl border bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
        style={{ borderTopWidth: 4, borderTopColor: CEL }}
      >
        <h3 className="mb-3 text-sm font-semibold">Clientes</h3>

        {/* Filtros */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <Search className="h-4 w-4" />
            </span>
            <input
              value={params.buscar}
              onChange={(e) => updateRemember("buscar", e.target.value)}
              placeholder="Nombre, apellido o documento…"
              className="w-full rounded-lg border bg-white pl-9 pr-3 py-2 outline-none transition focus:ring-2 dark:border-slate-700 dark:bg-slate-950/50"
              style={{ borderColor: "#cbd5e1" }}
            />
          </div>

          <select
            value={params.estado}
            onChange={(e) =>
              updateRemember("estado", e.target.value as Params["estado"])
            }
            className="rounded-lg border bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950/50"
          >
            <option value="">Todos los estados</option>
            <option value="activo">Activos</option>
            <option value="inactivo">Inactivos</option>
          </select>

          <div className="flex gap-2">
            <select
              value={params.ordenar_por}
              onChange={(e) =>
                updateRemember(
                  "ordenar_por",
                  e.target.value as Params["ordenar_por"]
                )
              }
              className="flex-1 rounded-lg border bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950/50"
            >
              <option value="id">ID</option>
              <option value="apellido">Apellido</option>
              <option value="nro_cliente">Nro. cliente</option>
              <option value="creado_en">Creado</option>
            </select>
            <select
              value={params.orden}
              onChange={(e) =>
                updateRemember("orden", e.target.value as Params["orden"])
              }
              className="w-28 rounded-lg border bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950/50"
            >
              <option value="asc">Asc</option>
              <option value="desc">Desc</option>
            </select>
          </div>

          <div className="flex items-center justify-between gap-2">
            <select
              value={params.limit}
              onChange={(e) =>
                updateRemember(
                  "limit",
                  Number(e.target.value) as Params["limit"]
                )
              }
              className="rounded-lg border bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950/50"
            >
              {[10, 20, 50, 100].map((n) => (
                <option key={n} value={n}>
                  {n} por página
                </option>
              ))}
            </select>

            <label className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
              <input
                type="checkbox"
                checked={params.activos_primero}
                onChange={(e) =>
                  updateRemember("activos_primero", e.target.checked)
                }
                className="h-4 w-4 rounded border-slate-300 focus:ring-0 dark:border-slate-700"
                style={{ accentColor: CEL }}
              />
              Activos primero
            </label>
          </div>
        </div>

        {/* Tabla */}
        <div
          className="relative mt-4 overflow-x-auto flex-1"
          style={{
            minHeight: `${Math.max(260, ROW_H * params.limit + HEADER_PAD)}px`,
          }}
        >
          <table className="min-w-full table-fixed text-sm">
            <thead className="text-left text-slate-500 dark:text-slate-400">
              <tr>
                <th className="py-2 w-24">#</th>
                <th className="py-2 w-[28%]">Nombre</th>
                <th className="py-2 w-32">Documento</th>
                <th className="py-2 w-[22%]">Email</th>
                <th className="py-2 w-32">Teléfono</th>
                <th className="py-2 w-28">Estado</th>
                <th className="py-2 w-24"></th>
              </tr>
            </thead>
            <tbody>
              {!loading && (rows.length ?? 0) === 0 && (
                <>
                  <tr>
                    <td
                      colSpan={7}
                      className="h-11 py-6 text-center text-slate-500 dark:text-slate-400"
                    >
                      Sin resultados
                    </td>
                  </tr>
                  {/* placeholders para mantener altura */}
                  {Array.from({ length: Math.max(0, params.limit - 1) }).map(
                    (_, i) => (
                      <tr
                        key={`ph-${i}`}
                        className="h-11 border-t border-transparent"
                        aria-hidden="true"
                      >
                        <td className="h-11 py-2">&nbsp;</td>
                        <td className="h-11 py-2">&nbsp;</td>
                        <td className="h-11 py-2">&nbsp;</td>
                        <td className="h-11 py-2">&nbsp;</td>
                        <td className="h-11 py-2">&nbsp;</td>
                        <td className="h-11 py-2">&nbsp;</td>
                        <td className="h-11 py-2">&nbsp;</td>
                      </tr>
                    )
                  )}
                </>
              )}

              {!loading &&
                rows.length > 0 &&
                rows.map((c) => (
                  <tr
                    key={c.id}
                    className="h-11 border-t border-slate-100 align-middle dark:border-slate-800"
                  >
                    <td className="h-11 whitespace-nowrap">{c.nro_cliente}</td>
                    <td className="h-11 whitespace-nowrap">
                      {c.apellido ? `${c.apellido}, ${c.nombre}` : c.nombre}
                    </td>
                    <td className="h-11 whitespace-nowrap">{c.documento}</td>
                    <td className="h-11 whitespace-nowrap">{c.email ?? "-"}</td>
                    <td className="h-11 whitespace-nowrap">
                      {c.telefono ?? "-"}
                    </td>
                    <td className="h-11 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${
                          c.estado === "activo"
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200"
                            : "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-200"
                        }`}
                      >
                        {c.estado}
                      </span>
                    </td>
                    <td className="h-11 whitespace-nowrap text-right">
                      <Link
                        to={`/clientes/${c.id}`} // ruta compartida (gerente + operador)
                        className="inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs dark:border-slate-700"
                        title="Ver detalle"
                      >
                        Acciones
                      </Link>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>

          {loading && (
            <div className="absolute inset-0 grid place-items-center bg-white/70 dark:bg-slate-900/60">
              <div className="flex items-center gap-2 rounded-md px-3 py-2 text-slate-700 dark:text-slate-200">
                <Loader2 className="h-4 w-4 animate-spin" />
                Cargando…
              </div>
            </div>
          )}
        </div>

        {/* Paginador */}
        <div className="mt-4 flex min-h-[48px] flex-wrap items-center justify-between gap-3 text-sm">
          <div className="text-slate-600 dark:text-slate-300">
            {resp
              ? `Página ${page} de ${totalPages} — ${resp.total_count} resultados`
              : "—"}
          </div>

          <div className="flex items-center gap-1 flex-nowrap">
            <button
              type="button"
              disabled={!canPrev}
              onClick={() =>
                canPrev &&
                rememberScrollAnd(() =>
                  setParams((p) => ({
                    ...p,
                    page: clamp(p.page - 1, 1, totalPages),
                  }))
                )
              }
              className={`inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 ${
                canPrev
                  ? "hover:bg-white/10 dark:border-slate-700"
                  : "opacity-50 dark:border-slate-800"
              }`}
              title="Anterior"
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </button>

            <div className="mx-1 flex max-w-[60vw] items-center gap-1 overflow-x-auto whitespace-nowrap">
              {pages.map((p, i) =>
                p === "…" ? (
                  <span key={`dots-${i}`} className="px-2 text-slate-400">
                    …
                  </span>
                ) : (
                  <button
                    key={p}
                    type="button"
                    disabled={loading || p === page}
                    onClick={() =>
                      rememberScrollAnd(() =>
                        setParams((prev) => ({ ...prev, page: p as number }))
                      )
                    }
                    className={`min-w-9 rounded-lg border px-3 py-1.5 ${
                      p === page
                        ? "border-transparent bg-slate-200 text-slate-900 dark:bg-slate-700 dark:text-white"
                        : "hover:bg-white/10 dark:border-slate-700"
                    }`}
                  >
                    {p}
                  </button>
                )
              )}
            </div>

            <button
              type="button"
              disabled={!canNext}
              onClick={() =>
                canNext &&
                rememberScrollAnd(() =>
                  setParams((p) => ({
                    ...p,
                    page: clamp(p.page + 1, 1, totalPages),
                  }))
                )
              }
              className={`inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 ${
                canNext
                  ? "hover:bg-white/10 dark:border-slate-700"
                  : "opacity-50 dark:border-slate-800"
              }`}
              title="Siguiente"
            >
              Siguiente
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Overlay de carga ejecutiva (sobre toda la página) */}
      {sumLoading && (
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
