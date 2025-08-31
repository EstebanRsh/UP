import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Protected from "./components/Protected";

import Login from "./pages/Login";
import Gerente from "./pages/dashboard/Gerente";
import Operador from "./pages/dashboard/Operador";

// Rutas compartidas de clientes (ajusta imports a tus paths reales)
import ClienteNuevo from "./pages/clientes/ClienteNuevo";
import ClienteDetalle from "./pages/clientes/ClienteDetalle";
import ClientesPage from "./pages/clientes/ClientesPage.tsx";

// (opcional) placeholder del portal del cliente final
function ClienteHome() {
  return (
    <div className="p-6">
      <h1 className="text-xl font-bold">Panel del cliente</h1>
      <p className="mt-2 text-slate-600 dark:text-slate-300">
        Bienvenido. Próximamente verás tus facturas, pagos y soporte aquí.
      </p>
    </div>
  );
}

// Redirección por rol cuando entras a "/"
function HomeRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  const role = (user.role ?? "").toLowerCase();
  const to =
    role === "gerente"
      ? "/admin"
      : role === "operador"
      ? "/operador"
      : "/cliente";
  return <Navigate to={to} replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Público */}
        <Route path="/login" element={<Login />} />

        {/* Redirección por rol */}
        <Route path="/" element={<HomeRedirect />} />

        {/* Dashboard de GERENTE */}
        <Route element={<Protected roles={["gerente"]} />}>
          <Route path="/admin" element={<Gerente />} />
        </Route>

        {/* Dashboard de OPERADOR */}
        <Route element={<Protected roles={["operador"]} />}>
          <Route path="/operador" element={<Operador />} />
        </Route>

        {/* Rutas COMPARTIDAS (gerente + operador) */}
        <Route element={<Protected roles={["gerente", "operador"]} />}>
          <Route path="/clientes" element={<ClientesPage />} />
          <Route path="/clientes/nuevo" element={<ClienteNuevo />} />
          <Route path="/clientes/:id" element={<ClienteDetalle />} />
        </Route>

        {/* Portal de CLIENTE (si lo usás) */}
        <Route element={<Protected roles={["cliente"]} />}>
          <Route path="/cliente" element={<ClienteHome />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
