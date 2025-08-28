// src/App.tsx
import { useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { login, me } from "./lib/api";

export default function App() {
  const [documento, setDocumento] = useState("20000000000");
  const [password, setPassword] = useState("secret");
  const [loading, setLoading] = useState(false);
  const [yo, setYo] = useState<any>(null);

  const onLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setYo(null);
    try {
      await login({ documento, password }); // ← sin "const r ="
      toast.success("Login OK ✅");
      const m = await me();
      setYo(m);
    } catch (err: any) {
      toast.error(err?.message || "Error en login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-900 dark:text-gray-100">
      <div className="mx-auto max-w-md px-6 py-10">
        <h1 className="text-3xl font-bold">UP-Core Frontend</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Vite + React + TS + Tailwind + Toastify
        </p>

        <form
          onSubmit={onLogin}
          className="mt-6 rounded-2xl border bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-800"
        >
          <label className="block text-sm font-medium">Documento</label>
          <input
            className="mt-1 w-full rounded-lg border border-gray-300 bg-white p-2.5 outline-none focus:ring-2 focus:ring-gray-200 dark:border-gray-700 dark:bg-gray-900"
            value={documento}
            onChange={(e) => setDocumento(e.target.value)}
            placeholder="20000000000"
          />

          <label className="mt-4 block text-sm font-medium">Password</label>
          <input
            type="password"
            className="mt-1 w-full rounded-lg border border-gray-300 bg-white p-2.5 outline-none focus:ring-2 focus:ring-gray-200 dark:border-gray-700 dark:bg-gray-900"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />

          <button
            type="submit"
            disabled={loading}
            className="mt-6 w-full rounded-xl border border-gray-200 bg-gray-900 px-4 py-2 font-medium text-white shadow-sm hover:bg-black disabled:opacity-60 dark:border-gray-700"
          >
            {loading ? "Ingresando…" : "Ingresar"}
          </button>
        </form>

        <div className="mt-6 rounded-2xl border bg-white p-6 text-sm shadow-sm dark:border-gray-800 dark:bg-gray-800">
          <div className="mb-2 font-semibold">Respuesta /me</div>
          <pre className="whitespace-pre-wrap break-words text-xs text-gray-600 dark:text-gray-300">
            {JSON.stringify(yo, null, 2)}
          </pre>
        </div>
      </div>

      <ToastContainer position="top-right" />
    </div>
  );
}
