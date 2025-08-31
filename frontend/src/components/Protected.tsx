// frontend/src/components/Protected.tsx
/**
 * Protected layout con control de roles basado en AuthContext.
 * Cambios clave:
 * - gerente = super-rol (puede acceder aunque la ruta pida otros roles)
 * - normaliza el rol a minúsculas antes de validar
 * - mantiene tu UI (topbar + rail) intacta
 */
import { Outlet, NavLink, useLocation, Navigate } from "react-router-dom";
import AppHeader from "./AppHeader";
import { useEffect, useRef, useState } from "react";
import {
  Users,
  CreditCard,
  Package,
  Settings,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

type Role = "gerente" | "operador" | "cliente";
type ProtectedProps = { roles?: Role[] };

const RAIL_W = 64; // px (w-16)
const TOPBAR_H = 48; // px (h-12)
const HIDE_DELAY = 350; // ms

type MenuKey = "clientes" | "pagos" | "planes" | "config";
const MENU: Record<
  MenuKey,
  { label: string; icon: any; items: { label: string; to: string }[] }
> = {
  clientes: {
    label: "Clientes",
    icon: Users,
    items: [
      { label: "Nuevo cliente", to: "/clientes/nuevo" },
      { label: "Lista de clientes", to: "/clientes" },
    ],
  },
  pagos: {
    label: "Pagos",
    icon: CreditCard,
    items: [
      { label: "Nuevo pago", to: "#" },
      { label: "Lista de pagos", to: "#" },
    ],
  },
  planes: {
    label: "Planes",
    icon: Package,
    items: [
      { label: "Nuevo plan", to: "#" },
      { label: "Lista de planes", to: "#" },
    ],
  },
  config: {
    label: "Configuraciones",
    icon: Settings,
    items: [
      { label: "Preferencias", to: "#" },
      { label: "Usuarios/roles", to: "#" },
    ],
  },
};

function isAllowed(userRoleRaw: string | undefined, required?: Role[]) {
  const userRole = (userRoleRaw ?? "").toLowerCase() as Role | "";
  if (!userRole) return false;
  if (userRole === "gerente") return true; // ✅ super-rol
  if (!required || required.length === 0) return true;
  return required.includes(userRole);
}

export default function Protected({ roles }: ProtectedProps) {
  const location = useLocation();
  const { user, loading } = useAuth();

  // --- Guard de autenticación/roles ---
  if (loading) return null; // o spinner
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;

  if (!isAllowed(user.role as any, roles)) {
    return <Navigate to="/login" replace />;
  }

  // --- Flyout sidebar ---
  const [openKey, setOpenKey] = useState<MenuKey | null>(null);
  const hideTimer = useRef<number | null>(null);

  const cancelHide = () => {
    if (hideTimer.current) {
      window.clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
  };
  const scheduleHide = () => {
    cancelHide();
    hideTimer.current = window.setTimeout(() => setOpenKey(null), HIDE_DELAY);
  };

  useEffect(() => {
    setOpenKey(null);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-[var(--surface)] text-[var(--ink)] dark:bg-[var(--surface)] dark:text-[var(--ink)]">
      {/* Topbar fija */}
      <div className="fixed inset-x-0 top-0 z-40 h-12">
        <AppHeader />
      </div>

      {/* Sidebar fija (rail) */}
      <aside
        className="fixed left-0 top-12 z-30 hidden h-[calc(100vh-48px)] w-16 border-r border-slate-200 bg-slate-900 text-slate-100 md:block dark:border-slate-800 dark:bg-slate-900"
        onMouseLeave={scheduleHide}
        onMouseEnter={cancelHide}
      >
        <nav className="flex h-full flex-col items-center gap-2 py-3">
          {(Object.keys(MENU) as Array<MenuKey>).map((key) => {
            const Icon = MENU[key].icon;
            const active =
              key === "clientes" &&
              (location.pathname.startsWith("/clientes") ||
                location.pathname.startsWith("/operador"));
            return (
              <button
                key={key}
                type="button"
                className={`group relative flex h-11 w-11 items-center justify-center rounded-xl transition ${
                  active
                    ? "bg-slate-800 text-white"
                    : "text-slate-300 hover:bg-slate-800/70 hover:text-white"
                }`}
                onMouseEnter={() => setOpenKey(key)}
                aria-label={MENU[key].label}
              >
                <Icon className="h-5 w-5" />
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Flyout expandido */}
      {openKey && (
        <div
          className="fixed left-16 top-12 z-40 hidden h-[calc(100vh-48px)] md:block"
          onMouseEnter={cancelHide}
          onMouseLeave={scheduleHide}
        >
          <div className="my-2 mr-3 min-w-[220px] rounded-xl border border-slate-200 bg-white p-3 shadow-xl dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                {MENU[openKey].label}
              </div>
              <ChevronRight className="h-4 w-4 text-slate-400" />
            </div>
            <ul className="space-y-1">
              {MENU[openKey].items.map((it, idx) => (
                <li key={idx}>
                  <NavLink
                    to={it.to}
                    className={({ isActive }) =>
                      `block rounded-lg px-3 py-2 text-sm transition ${
                        isActive
                          ? "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100"
                          : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800/70"
                      }`
                    }
                    onClick={() => setOpenKey(null)}
                  >
                    {it.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Contenido */}
      <main
        className="relative px-4 pb-10 pt-4 md:px-6 md:pt-6"
        style={{ marginLeft: RAIL_W, marginTop: TOPBAR_H }}
      >
        <Outlet />
      </main>
    </div>
  );
}
