// src/App.tsx
import { Routes, Route, Navigate } from "react-router-dom";
import Protected from "./components/Protected";
import Login from "./pages/Login";
import Gerente from "./pages/dashboard/Gerente";
import Operador from "./pages/dashboard/Operador";
import Cliente from "./pages/dashboard/Cliente";
import ClienteDetalle from "./pages/clientes/ClienteDetalle";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />

      {/* Gerente: dashboard ejecutivo */}
      <Route element={<Protected roles={["gerente"]} />}>
        <Route path="/admin" element={<Gerente />} />
        {/* si preferís /gerente, podés duplicar: */}
        {/* <Route path="/gerente" element={<Gerente />} /> */}
      </Route>

      {/* Grilla de clientes compartida entre gerente y operador */}
      <Route element={<Protected roles={["gerente", "operador"]} />}>
        <Route path="/clientes" element={<Operador />} />
        <Route path="/clientes/:id" element={<ClienteDetalle />} />
      </Route>

      {/* Rutas legacy del operador (compatibilidad) */}
      <Route element={<Protected roles={["operador"]} />}>
        <Route path="/operador" element={<Operador />} />
        <Route path="/operador/clientes/:id" element={<ClienteDetalle />} />
      </Route>

      {/* Cliente final */}
      <Route element={<Protected roles={["cliente"]} />}>
        <Route path="/cliente" element={<Cliente />} />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

// como implemento la funciones de pago? podemos hablar sobre eso?
// falta la funcion de crear usuarios nuevos y editarlos o eliminarlos(suspenderlos) que pasa si n cliente es suspendido porque se dio de baja y luego meses mas tarde decide otra vez contratar el servicio?
