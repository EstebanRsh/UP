/**
 * Protected
 * Guard de rutas: si no hay usuario => redirige a /login; si hay `roles`, valida el rol.
 * Layout de páginas protegidas: AppHeader (celeste) + AppSidebar (oscura) + <Outlet />.
 * Solo el contenido central reacciona al dark mode; topbar y sidebar quedan fijos.
 */
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AppHeader from "./AppHeader";
import AppSidebar from "./AppSidebar";

export default function Protected({
  roles,
}: {
  roles?: Array<"gerente" | "operador" | "cliente">;
}) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && (!user.role || !roles.includes(user.role)))
    return <Navigate to="/login" replace />;

  return (
    <>
      <AppHeader />
      <div className="flex min-h-[calc(100vh-48px)]">
        <AppSidebar /> {/* Lateral oscuro fijo */}
        <main className="flex-1 bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100">
          <div className="mx-auto max-w-6xl p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </>
  );
}
