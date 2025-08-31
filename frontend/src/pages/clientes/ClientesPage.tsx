// src/pages/clientes/ClientesPage.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  searchClientesPaged,
  type ClienteListItem,
  type ClienteSearchResponse,
} from "../../lib/clientes";
import { Search, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

const ROW_H = 44;
const HEADER_PAD = 56;
const CEL = "#0DA3E3";
const CEL_DARK = "#087BBE";

type Estado = "" | "activo" | "inactivo";
type OrdenarPor = "id" | "apellido" | "nro_cliente" | "creado_en";
type Orden = "asc" | "desc";

type Params = {
  page: number;
  limit: number;
  buscar: string;
  estado: Estado;
  ordenar_por: OrdenarPor;
  orden: Orden;
  activos_primero: boolean;
};

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

export default function ClientesPage() {
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
  const rows: ClienteListItem[] = useMemo(() => resp?.items ?? [], [resp]);

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
        const data = await searchClientesPaged({
          page: params.page,
          limit: params.limit,
          buscar: debouncedBuscar || undefined,
          estado: params.estado || undefined,
          ordenar_por: params.ordenar_por,
          orden: params.orden,
          activos_primero: params.activos_primero,
        });

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

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Clientes</h1>
        <Link
          to="/clientes/nuevo"
          className="rounded-lg px-3 py-2 text-sm font-semibold text-white"
          style={{
            backgroundImage: `linear-gradient(90deg, ${CEL}, ${CEL_DARK})`,
          }}
        >
          + Nuevo cliente
        </Link>
      </header>

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
          onChange={(e) => updateRemember("estado", e.target.value as Estado)}
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
              updateRemember("ordenar_por", e.target.value as OrdenarPor)
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
            onChange={(e) => updateRemember("orden", e.target.value as Orden)}
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
              updateRemember("limit", Number(e.target.value) as Params["limit"])
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
        className="relative mt-2 overflow-x-auto"
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
            {!loading && rows.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="h-11 py-6 text-center text-slate-500 dark:text-slate-400"
                >
                  Sin resultados
                </td>
              </tr>
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
                      to={`/clientes/${c.id}`}
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
            ? `Página ${page} de ${Math.max(1, resp.total_pages)} — ${
                resp.total_count
              } resultados`
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
                  page: clamp(
                    p.page - 1,
                    1,
                    Math.max(1, resp?.total_pages ?? 1)
                  ),
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
            {getPaginationRange(
              page,
              Math.max(1, resp?.total_pages ?? 1),
              1
            ).map((p, i) =>
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
                  page: clamp(
                    p.page + 1,
                    1,
                    Math.max(1, resp?.total_pages ?? 1)
                  ),
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
  );
}
