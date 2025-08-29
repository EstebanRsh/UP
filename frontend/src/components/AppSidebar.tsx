import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function AppSidebar() {
  const { user } = useAuth();
  const { pathname } = useLocation();

  const home =
    user?.role === "gerente"
      ? "/admin"
      : user?.role === "operador"
      ? "/operador"
      : "/cliente";

  // Menú (poné rutas reales cuando las tengas; por ahora "#" evita 404)
  const items = [
    { label: "Dashboard", to: home, emoji: "🏠" },
    { label: "Clientes", to: "#", emoji: "👥" },
    { label: "Pagos", to: "#", emoji: "💳" },
    { label: "Reportes", to: "#", emoji: "📊" },
    { label: "Config", to: "#", emoji: "⚙️" },
  ];

  return (
    <aside
      className="w-56 shrink-0 border-r border-black/10 bg-slate-900 text-slate-200"
      style={{ minHeight: "calc(100vh - 56px)" }} // 56px = h-14 del header
    >
      <nav className="p-3 space-y-1">
        {items.map((it) => {
          const active = it.to !== "#" && pathname === it.to;
          return (
            <Link
              key={it.label}
              to={it.to}
              className={
                "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition " +
                (active
                  ? "bg-white/10 text-white"
                  : "text-slate-200/90 hover:bg-white/10 hover:text-white")
              }
            >
              <span className="w-5 text-center">{it.emoji}</span>
              <span>{it.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
