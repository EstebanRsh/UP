import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  BarChart3,
  Settings,
  User,
  LifeBuoy,
} from "lucide-react";

/**
 * Comportamiento:
 * - Colapsada (sin hover): ancho 64px (w-16), muestra SOLO iconos.
 * - Expandida (hover sobre el aside): ancho 224px (w-56), muestra iconos + texto.
 * - La barra lateral SIEMPRE es oscura; solo el contenido central cambia por modo oscuro.
 */
export default function AppSidebar() {
  const { user } = useAuth();
  const { pathname } = useLocation();

  const home =
    user?.role === "gerente"
      ? "/admin"
      : user?.role === "operador"
      ? "/operador"
      : "/cliente";

  const adminOps = [
    { label: "Dashboard", to: home, icon: LayoutDashboard },
    { label: "Clientes", to: "#", icon: Users },
    { label: "Pagos", to: "#", icon: CreditCard },
    { label: "Reportes", to: "#", icon: BarChart3 },
    { label: "Config.", to: "#", icon: Settings },
  ];
  const clienteOps = [
    { label: "Mi cuenta", to: home, icon: User },
    { label: "Pagos", to: "#", icon: CreditCard },
    { label: "Soporte", to: "#", icon: LifeBuoy },
    { label: "Config.", to: "#", icon: Settings },
  ];

  const items = user?.role === "cliente" ? clienteOps : adminOps;

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
        {/* El texto aparece solo cuando el aside está expanded (hover) */}
        <span className="whitespace-nowrap opacity-0 transition-opacity duration-150 group-hover:opacity-100">
          {label}
        </span>
      </>
    );

    if (to === "#") {
      return <div className={base + disabled}>{content}</div>;
    }
    return (
      <Link to={to} className={base + enabled}>
        {content}
      </Link>
    );
  }

  return (
    // group para poder usar group-hover en hijos
    <aside
      className="
        group
        relative shrink-0 overflow-x-hidden
        border-r border-black/10 bg-slate-900 text-slate-200
        w-16 hover:w-56 transition-all duration-200
      "
      style={{ minHeight: "calc(100vh - 48px)" }} // 48px = h-12 del header
    >
      <nav className="p-3 space-y-1">
        {items.map((it) => (
          <Item key={it.label} {...it} />
        ))}
      </nav>

      {/* Separador inferior opcional */}
      <div className="absolute bottom-0 left-0 right-0 p-3">
        <div className="h-px bg-white/10" />
      </div>
    </aside>
  );
}
