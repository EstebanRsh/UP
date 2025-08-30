import { Routes, Route, Navigate } from "react-router-dom";
import Protected from "./components/Protected";
import Login from "./pages/Login";
import Gerente from "./pages/dashboard/Gerente";
import Operador from "./pages/dashboard/Operador";
import Cliente from "./pages/dashboard/Cliente";
import ClienteDetalle from "./pages/clientes/ClienteDetalle";
import ClienteNuevo from "./pages/clientes/ClienteNuevo";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />

      {/* Dashboard Gerente */}
      <Route element={<Protected roles={["gerente"]} />}>
        <Route path="/admin" element={<Gerente />} />
      </Route>

      {/* Gestión de clientes compartida (operador + gerente) */}
      <Route element={<Protected roles={["operador", "gerente"]} />}>
        <Route path="/clientes" element={<Operador />} />
        <Route path="/clientes/nuevo" element={<ClienteNuevo />} />{" "}
        {/* <- NUEVO */}
        <Route path="/clientes/:id" element={<ClienteDetalle />} />
      </Route>

      {/* Rutas heredadas del operador (si aún las usás) */}
      <Route element={<Protected roles={["operador"]} />}>
        <Route path="/operador" element={<Operador />} />
        <Route path="/operador/clientes/:id" element={<ClienteDetalle />} />
      </Route>

      {/* Dashboard de cliente final */}
      <Route element={<Protected roles={["cliente"]} />}>
        <Route path="/cliente" element={<Cliente />} />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
