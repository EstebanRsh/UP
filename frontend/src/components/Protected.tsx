import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AppHeader from "./AppHeader";

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
      <main className="min-h-[calc(100vh-56px)] bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100">
        <Outlet />
      </main>
    </>
  );
}
