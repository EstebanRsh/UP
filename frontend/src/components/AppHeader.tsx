import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import ThemeToggle from "./ThemeToggle";
import { Settings, LogOut, Menu, X } from "lucide-react";

type Props = {
  showRole?: boolean;
  showBrandText?: boolean;
  /** control del drawer móvil */
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
};

export default function AppHeader({
  showRole = true,
  showBrandText = true,
  onToggleSidebar,
  isSidebarOpen = false,
}: Props) {
  const { user, logout } = useAuth();
  const nav = useNavigate();

  const home =
    user?.role === "gerente"
      ? "/admin"
      : user?.role === "operador"
      ? "/operador"
      : "/cliente";

  const onLogout = () => {
    logout();
    nav("/login", { replace: true });
  };

  const TOP_BG = "#0DA3E3";
  const TOP_BORDER = "#087BBE";
  const iconBtn =
    "inline-flex h-8 w-8 items-center justify-center rounded-full " +
    "border border-white/25 bg-white/10 text-white hover:bg-white/20 " +
    "active:scale-[.98] transition";

  return (
    <header
      className="sticky top-0 z-30 h-12 w-full text-white shadow"
      style={{
        backgroundColor: TOP_BG,
        borderBottom: `1px solid ${TOP_BORDER}`,
      }}
    >
      <div className="mx-auto flex h-full max-w-6xl items-center justify-between px-3">
        {/* Izquierda: botón menú (solo móvil) + logo */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            className={`${iconBtn} md:hidden`}
            aria-label={isSidebarOpen ? "Cerrar menú" : "Abrir menú"}
            onClick={onToggleSidebar}
          >
            {isSidebarOpen ? (
              <X className="h-4 w-4" />
            ) : (
              <Menu className="h-4 w-4" />
            )}
          </button>

          <Link to={home} className="flex items-center gap-2">
            <img src="/up.png" alt="uplink" className="h-6 w-auto" />
            {showBrandText && (
              <span className="hidden text-sm font-semibold tracking-wide uppercase sm:inline">
                up link
              </span>
            )}
          </Link>
        </div>

        {/* Derecha */}
        <div className="flex items-center gap-2">
          {showRole && user?.role && (
            <span className="hidden text-xs sm:inline">
              Rol: <strong>{user.role}</strong>
            </span>
          )}

          <button
            type="button"
            className={`${iconBtn} hidden sm:inline-flex`}
            title="Configuración"
            aria-label="Configuración"
            onClick={() => nav("#")}
          >
            <Settings className="h-4 w-4" />
          </button>

          <ThemeToggle variant="onPrimary" />

          <button
            type="button"
            className={`${iconBtn} hidden sm:inline-flex`}
            title="Cerrar sesión"
            aria-label="Cerrar sesión"
            onClick={onLogout}
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
