import { useNavigate } from "react-router-dom";
import ThemeToggle from "./ThemeToggle";
import { useAuth } from "../context/AuthContext";

export default function AppHeader() {
  const { user, logout } = useAuth();
  const nav = useNavigate();

  const onLogout = () => {
    logout(); // limpia token + estado
    nav("/login", { replace: true }); // redirige al login
  };

  return (
    <header className="sticky top-0 z-20 border-b border-sky-100/70 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-900/70">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-md bg-gradient-to-br from-sky-400 to-blue-600" />
          <span className="text-base font-semibold tracking-tight">
            ImperialSoft
          </span>
        </div>

        <div className="flex items-center gap-2">
          {user?.role && (
            <span className="hidden text-sm text-slate-600 dark:text-slate-300 sm:inline">
              Rol: <strong>{user.role}</strong>
            </span>
          )}
          <ThemeToggle />
          <button
            onClick={onLogout}
            className="rounded-xl border border-sky-200/60 bg-white/80 px-3 py-2 text-sm font-medium text-slate-700 shadow-sm backdrop-blur hover:bg-white active:scale-[.99] dark:border-slate-700/70 dark:bg-slate-900/70 dark:text-slate-200"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    </header>
  );
}
