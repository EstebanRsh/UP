import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Protected({
  roles,
}: {
  roles?: Array<"gerente" | "operador" | "cliente">;
}) {
  const { user, loading } = useAuth();
  if (loading) return null; // o un spinner
  if (!user) return <Navigate to="/login" replace />;
  if (roles && (!user.role || !roles.includes(user.role)))
    return <Navigate to="/login" replace />;
  return <Outlet />;
}
