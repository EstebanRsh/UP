import { Link, useLocation, useNavigate } from "react-router-dom";
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

export default function AppSidebar() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const nav = useNavigate();

  const home =
    user?.role === "gerente"
      ? "/admin"
      : user?.role === "operador"
      ? "/operador"
      : "/cliente";

  // Ítems según rol (rutas reales cuando las tengas; "#" queda deshabilitado)
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
    const common =
      "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ";
    const enabled = active
      ? "bg-white/10 text-white border-l-4 border-brand-500"
      : "text-slate-200/90 hover:bg-white/10 hover:text-white border-l-4 border-transparent";
    const disabled =
      "cursor-not-allowed text-slate-400/60 border-l-4 border-transparent";

    if (to === "#") {
      return (
        <div className={common + disabled}>
          <Icon className="h-4 w-4" />
          <span>{label}</span>
        </div>
      );
    }
    return (
      <Link to={to} className={common + enabled}>
        <Icon className="h-4 w-4" />
        <span>{label}</span>
      </Link>
    );
  }

  return (
    <aside
      className="w-56 shrink-0 border-r border-black/10 bg-slate-900 text-slate-200"
      style={{ minHeight: "calc(100vh - 48px)" }} // 48px = h-12 del header
    >
      <nav className="p-3 space-y-1">
        {items.map((it) => (
          <Item key={it.label} {...it} />
        ))}
      </nav>
    </aside>
  );
}
