// src/pages/dashboard/Operador.tsx
/**
 * Dashboard · Operador (paginación real + UX)
 * - Pausa mínima (MIN_LOADING_MS) en cada carga con overlay “Cargando…”.
 * - Mantiene el scroll al paginar/filtrar/buscar.
 * - Altura de tabla estable: min-height dinámico y filas placeholder para completar hasta el 'limit'.
 * - Botón "Acciones" por fila → navega a detalle del cliente.
 */

import KpiCard from "../../components/KpiCard";
import {
  ClipboardList,
  UserPlus,
  Wrench,
  Clock,
  Search,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import {
  searchClientesPaged,
  type ClienteListItem,
  type ClienteSearchResponse,
} from "../../lib/clientes";
import { Link } from "react-router-dom";

const CEL = "#0DA3E3";
const CEL_DARK = "#087BBE";

// ⏱️ Pausa mínima de carga (ajustaste a 250ms)
const MIN_LOADING_MS = 250;

// 🎯 Para estabilizar la altura: altura de fila ≈ h-11 (44px) + header ~56px
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

// helper: impone tiempo mínimo de carga
async function withMinDelay<T>(p: Promise<T>, ms: number): Promise<T> {
  const [res] = await Promise.all([
    p,
    new Promise<void>((r) => setTimeout(r, ms)),
  ]);
  return res;
}

export default function Operador() {
  const [params, setParams] = useState<Params>({
    page: 1,
    limit: 20,
    buscar: "",
    estado: "",
    ordenar_por: "id",
    orden: "asc",
    activos_primero: false,
  });

  // Debounce de búsqueda
  const [debouncedBuscar, setDebouncedBuscar] = useState(params.buscar);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedBuscar(params.buscar), 350);
    return () => clearTimeout(t);
  }, [params.buscar]);

  const [loading, setLoading] = useState(false);
  const [resp, setResp] = useState<ClienteSearchResponse | null>(null);

  // Evitar salto de scroll al cambiar de página/filtros/buscar
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

  // Carga de datos (con pausa mínima)
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
        if (alive) setResp(data);
      } catch (e: any) {
        if (alive) {
          toast.error(e?.message || "No se pudo obtener clientes.");
          setResp({
            items: [],
            page: params.page,
            limit: params.limit,
            total_count: 0,
            total_pages: 1,
            has_prev: false,
            has_next: false,
          });
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // helpers UI
  function update<K extends keyof Params>(key: K, value: Params[K]) {
    setParams((p) => ({
      ...p,
      page:
        key === "buscar" ||
        key === "estado" ||
        key === "limit" ||
        key === "ordenar_por" ||
        key === "orden" ||
        key === "activos_primero"
          ? 1
          : p.page,
      [key]: value,
    }));
  }
  function updateRemember<K extends keyof Params>(key: K, value: Params[K]) {
    rememberScrollAnd(() => update(key, value));
  }

  const canPrev = !!resp?.has_prev;
  const canNext = !!resp?.has_next;

  // 🔧 filas placeholder para completar hasta 'limit' (evita contracción de la tabla)
  function renderPlaceholders(n: number) {
    if (n <= 0) return null;
    return Array.from({ length: n }).map((_, i) => (
      <tr
        key={`ph-${i}`}
        className="h-11 border-t border-transparent"
        aria-hidden="true"
      >
        {/* 7 columnas vacías para mantener distribución */}
        <td className="h-11 py-2">&nbsp;</td>
        <td className="h-11 py-2">&nbsp;</td>
        <td className="h-11 py-2">&nbsp;</td>
        <td className="h-11 py-2">&nbsp;</td>
        <td className="h-11 py-2">&nbsp;</td>
        <td className="h-11 py-2">&nbsp;</td>
        <td className="h-11 py-2">&nbsp;</td>
      </tr>
    ));
  }

  const placeholdersCount =
    !loading && rows.length > 0 ? Math.max(0, params.limit - rows.length) : 0;

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

      {/* Filtros + tabla */}
      <div
        className="rounded-xl border bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
        style={{ borderTopWidth: 4, borderTopColor: CEL }}
      >
        <h3 className="mb-3 text-sm font-semibold">Clientes</h3>

        {/* Filtros */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {/* Buscar */}
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

          {/* Estado */}
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

          {/* Orden */}
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

          {/* Límite + activos primero */}
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

        {/* Tabla + overlay
            - minHeight depende del 'limit' para que no se contraiga
            - filas placeholder completan hasta limit
        */}
        <div
          className="relative mt-4 overflow-x-auto"
          style={{ minHeight: `${tableMinHeight(params.limit)}px` }}
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
              {!loading && rows.length === 0 && (
                <>
                  <tr>
                    <td
                      colSpan={7}
                      className="h-11 py-6 text-center text-slate-500 dark:text-slate-400"
                    >
                      Sin resultados
                    </td>
                  </tr>
                  {/* placeholders para llenar hasta 'limit' */}
                  {renderPlaceholders(Math.max(0, params.limit - 1))}
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
                        to={`/operador/clientes/${c.id}`}
                        className="inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs dark:border-slate-700"
                        title="Ver detalle"
                      >
                        Acciones
                      </Link>
                    </td>
                  </tr>
                ))}

              {/* completa con placeholders para no contraer la altura */}
              {!loading &&
                rows.length > 0 &&
                renderPlaceholders(placeholdersCount)}
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
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm">
          <div className="text-slate-600 dark:text-slate-300">
            {resp
              ? `Página ${resp.page} de ${resp.total_pages} — ${resp.total_count} resultados`
              : "—"}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={!canPrev}
              onClick={() =>
                canPrev &&
                rememberScrollAnd(() =>
                  setParams((p) => ({ ...p, page: p.page - 1 }))
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

            <input
              type="number"
              min={1}
              max={Math.max(1, resp?.total_pages ?? 1)}
              value={params.page}
              onChange={(e) =>
                rememberScrollAnd(() =>
                  setParams((p) => ({
                    ...p,
                    page: Math.min(
                      Math.max(1, Number(e.target.value || 1)),
                      resp?.total_pages ?? 1
                    ),
                  }))
                )
              }
              className="w-16 rounded-lg border bg-white px-2 py-1.5 text-center dark:border-slate-700 dark:bg-slate-950/50"
            />

            <button
              type="button"
              disabled={!canNext}
              onClick={() =>
                canNext &&
                rememberScrollAnd(() =>
                  setParams((p) => ({ ...p, page: p.page + 1 }))
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

        {/* Acciones rápidas (placeholders) */}
        <div className="mt-4 flex flex-wrap gap-2">
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
