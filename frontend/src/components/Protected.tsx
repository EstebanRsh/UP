/**
 * Protected Layout
 * - Topbar fija (h-12 = 48px)
 * - Sidebar fija tipo "rail" (64px) + flyout al pasar el mouse
 * - Solo el contenido central scrollea (main con margin-left = 64px y margin-top = 48px)
 * - Responsive: en <md se oculta el rail por simplicidad (puede añadirse drawer si querés)
 */

import { Outlet, NavLink, useLocation } from "react-router-dom";
import AppHeader from "./AppHeader";
import { useEffect, useRef, useState } from "react";
import {
  Users,
  CreditCard,
  Package,
  Settings,
  ChevronRight,
} from "lucide-react";

const RAIL_W = 64; // px (w-16)
const TOPBAR_H = 48; // px (h-12)
const HIDE_DELAY = 350; // ms para ocultar flyout después de salir con el mouse

type MenuKey = "clientes" | "pagos" | "planes" | "config";

const MENU: Record<
  MenuKey,
  { label: string; icon: any; items: { label: string; to: string }[] }
> = {
  clientes: {
    label: "Clientes",
    icon: Users,
    items: [
      { label: "Nuevo cliente", to: "#" }, // placeholder
      { label: "Lista de clientes", to: "/operador" }, // dashboard operador
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

export default function Protected() {
  const location = useLocation();

  // control del flyout (qué menú está activo bajo el puntero)
  const [openKey, setOpenKey] = useState<MenuKey | null>(null);
  const hideTimer = useRef<number | null>(null);

  // cancela/agenda ocultar flyout
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

  // al cambiar de ruta, cerramos flyout
  useEffect(() => {
    setOpenKey(null);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-[var(--surface)] text-[var(--ink)] dark:bg-[var(--surface)] dark:text-[var(--ink)]">
      {/* Topbar fija */}
      <div className="fixed inset-x-0 top-0 z-40 h-12">
        <AppHeader />
      </div>

      {/* Sidebar (rail) fija: md+ */}
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
              (location.pathname.startsWith("/operador") ||
                location.pathname.startsWith("/admin"));
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

      {/* Flyout (panel expandido) */}
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

      {/* Contenido principal: margen para topbar + rail fijos */}
      <main
        className="relative px-4 pb-10 pt-4 md:px-6 md:pt-6"
        style={{
          marginLeft: RAIL_W,
          marginTop: TOPBAR_H,
        }}
      >
        <Outlet />
      </main>
    </div>
  );
}
