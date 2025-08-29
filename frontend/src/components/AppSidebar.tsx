/**
 * AppHeader
 * Barra superior fija SIEMPRE celeste (no cambia con modo oscuro).
 * Contiene: logo + nombre de la empresa, ThemeToggle, botón de Configuración y Cerrar sesión.
 * El logo linkea al “home” según el rol (gerente/operador/cliente).
 */

import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getNavForRole, type Role } from "../config/nav";

/**
 * Sidebar oscuro:
 * - Colapsado (sin hover): w-16, solo iconos
 * - Expandido (hover):     w-56, iconos + texto
 */
export default function AppSidebar() {
  const { user } = useAuth();
  const { pathname } = useLocation();

  const role: Role = (user?.role as Role) ?? "cliente";
  const items = getNavForRole(role);

  function Item({
    label,
    to,
    icon: Icon,
  }: {
    label: string;
    to: string;
    icon: any;
  }) {
    const active =
      to !== "#" && (pathname === to || pathname.startsWith(to + "/"));
    const base =
      "group/item flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ";
    const enabled = active
      ? "bg-white/10 text-white border-l-4 border-brand-500"
      : "text-slate-200/90 hover:bg-white/10 hover:text-white border-l-4 border-transparent";
    const disabled =
      "cursor-not-allowed text-slate-400/60 border-l-4 border-transparent";

    const content = (
      <>
        <Icon className="h-4 w-4 shrink-0" />
        <span className="whitespace-nowrap opacity-0 transition-opacity duration-150 group-hover:opacity-100">
          {label}
        </span>
      </>
    );

    if (to === "#") return <div className={base + disabled}>{content}</div>;
    return (
      <Link
        to={to}
        className={base + enabled}
        aria-current={active ? "page" : undefined}
      >
        {content}
      </Link>
    );
  }

  return (
    <aside
      className="
        group relative shrink-0 overflow-x-hidden
        border-r border-black/10 bg-slate-900 text-slate-200
        w-16 hover:w-56 transition-all duration-200
      "
      style={{ minHeight: "calc(100vh - 48px)" }} /* 48px = h-12 del header */
    >
      <nav className="p-3 space-y-1">
        {items.map((it) => (
          <Item key={it.label} {...it} />
        ))}
      </nav>
      <div className="absolute bottom-0 left-0 right-0 p-3">
        <div className="h-px bg-white/10" />
      </div>
    </aside>
  );
}
