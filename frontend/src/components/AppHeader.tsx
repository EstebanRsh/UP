import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import ThemeToggle from "./ThemeToggle";
import { Settings, LogOut } from "lucide-react";

type Props = { showRole?: boolean; showBrandText?: boolean };

export default function AppHeader({
  showRole = true,
  showBrandText = true,
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

  // Celeste estilo UI que mostraste
  const TOP_BG = "#0DA3E3";
  const TOP_BORDER = "#087BBE";

  const iconBtn =
    "inline-flex h-8 w-8 items-center justify-center rounded-full " +
    "border border-white/25 bg-white/10 text-white hover:bg-white/20 " +
    "active:scale-[.98] transition";

  return (
    <header
      className="sticky top-0 z-20 h-12 w-full text-white shadow"
      style={{
        backgroundColor: TOP_BG,
        borderBottom: `1px solid ${TOP_BORDER}`,
      }}
    >
      <div className="flex h-full w-full items-center justify-between px-3">
        {/* Izquierda: Logo + nombre */}
        <Link to={home} className="flex items-center gap-2">
          <img src="/logo-uplink.svg" alt="uplink" className="h-6 w-auto" />
          {showBrandText && (
            <span className="text-sm font-semibold tracking-wide uppercase">
              uplink
            </span>
          )}
        </Link>

        {/* Derecha: Tema, Configuración, Logout */}
        <div className="flex items-center gap-2">
          {/* si tu ThemeToggle no acepta 'variant', podés usar <ThemeToggle /> */}
          <ThemeToggle variant="onPrimary" />

          <button
            type="button"
            className={iconBtn}
            title="Configuración"
            aria-label="Configuración"
            onClick={() => nav("#")} // cambia a /settings cuando lo tengas
          >
            <Settings className="h-4 w-4" />
          </button>

          <button
            type="button"
            className={iconBtn}
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
