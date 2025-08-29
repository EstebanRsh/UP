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
import { useState } from "react";

export default function Protected({
  roles,
}: {
  roles?: Array<"gerente" | "operador" | "cliente">;
}) {
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && (!user.role || !roles.includes(user.role)))
    return <Navigate to="/login" replace />;

  return (
    <>
      <AppHeader
        onToggleSidebar={() => setSidebarOpen((v) => !v)}
        isSidebarOpen={sidebarOpen}
      />

      {/* Overlay para móvil (no tapa la topbar) */}
      {sidebarOpen && (
        <div
          className="fixed top-12 inset-x-0 bottom-0 z-30 bg-black/40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex min-h-[calc(100vh-48px)]">
        {/* Sidebar: desktop permanente + móvil off-canvas */}
        <AppSidebar
          mobileOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        {/* Contenido central (único que reacciona a dark) */}
        <main className="flex-1 bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100">
          <div className="mx-auto max-w-6xl p-4 sm:p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </>
  );
}
