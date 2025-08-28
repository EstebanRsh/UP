import { Routes, Route, Navigate } from "react-router-dom";
import Protected from "./components/Protected";
import Login from "./pages/Login";
import Gerente from "./pages/dashboard/Gerente";
import Operador from "./pages/dashboard/Operador";
import Cliente from "./pages/dashboard/Cliente";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />

      <Route element={<Protected roles={["gerente"]} />}>
        <Route path="/admin" element={<Gerente />} />
      </Route>

      <Route element={<Protected roles={["operador"]} />}>
        <Route path="/operador" element={<Operador />} />
      </Route>

      <Route element={<Protected roles={["cliente"]} />}>
        <Route path="/cliente" element={<Cliente />} />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
