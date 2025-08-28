import { useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [documento, setDocumento] = useState("20000000000");
  const [password, setPassword] = useState("secret");
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();
  const { login } = useAuth();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const u = await login({ documento, password });
      toast.success("Login OK ✅");
      const route =
        u.role === "gerente"
          ? "/admin"
          : u.role === "operador"
          ? "/operador"
          : "/cliente";
      nav(route, { replace: true });
    } catch (err: any) {
      toast.error(err?.message || "Error en login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <div className="mx-auto max-w-md px-6 py-10">
        <h1 className="text-3xl font-bold">UP-Core — Login</h1>
        <form
          onSubmit={onSubmit}
          className="mt-6 rounded-2xl border bg-white p-6 shadow-sm"
        >
          <label className="block text-sm font-medium">Documento</label>
          <input
            className="mt-1 w-full rounded-lg border p-2.5"
            value={documento}
            onChange={(e) => setDocumento(e.target.value)}
          />
          <label className="mt-4 block text-sm font-medium">Password</label>
          <input
            type="password"
            className="mt-1 w-full rounded-lg border p-2.5"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="submit"
            disabled={loading}
            className="mt-6 w-full rounded-xl bg-gray-900 px-4 py-2 font-medium text-white"
          >
            {loading ? "Ingresando…" : "Ingresar"}
          </button>
        </form>
      </div>
      <ToastContainer position="top-right" />
    </div>
  );
}
