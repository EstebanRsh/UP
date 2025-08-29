/**
 * Login
 * Formulario documento + password. Usa AuthContext.login, muestra toasts y
 * redirige al dashboard según el rol. Estilizado con la paleta celeste de marca.
 */

import { useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import ThemeToggle from "../components/ThemeToggle";

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
    <div className="min-h-screen overflow-hidden bg-gradient-to-b from-brand-50 via-white to-white text-slate-900 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900 dark:text-slate-100">
      {/* barra superior */}
      <header className="relative z-10 border-b border-brand-200/60 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-900/70">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-md bg-gradient-to-br from-brand-400 to-brand-600" />
            <span className="text-base font-semibold tracking-tight">
              UPLink
            </span>
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* decoración de fondo */}
      <div className="pointer-events-none absolute inset-0 -z-10 opacity-50 blur-3xl">
        <div className="mx-auto mt-[-6rem] h-[28rem] w-[28rem] rounded-full bg-brand-200/30 dark:bg-brand-600/20" />
      </div>

      {/* contenido */}
      <main className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-6 py-12 md:grid-cols-2 md:py-16">
        {/* copy/branding */}
        <section className="hidden md:block">
          <h1 className="bg-gradient-to-r from-brand-500 to-brand-600 bg-clip-text text-4xl font-extrabold text-transparent dark:from-brand-400 dark:to-brand-500">
            Up-Link gestor
          </h1>
          <p className="mt-4 max-w-md text-sm text-slate-600 dark:text-slate-300">
            Ingresá con tu documento y contraseña para acceder a tu panel. En
            UpLink pensamos en usted. bla bla bla
          </p>

          <ul className="mt-6 space-y-3 text-sm text-slate-600 dark:text-slate-300">
            <li>• Vea y descargue sus facturas</li>
          </ul>
        </section>

        {/* card login (glass + borde degradado) */}
        <section className="mx-auto w-full max-w-md">
          <div className="rounded-2xl bg-gradient-to-br from-brand-200/70 to-brand-200/70 p-[1px] shadow-lg dark:from-brand-600/50 dark:to-brand-600/50">
            <div className="rounded-2xl border border-white/60 bg-white/80 p-6 backdrop-blur dark:border-slate-800/80 dark:bg-slate-900/70">
              <h2 className="text-2xl font-bold tracking-tight">
                Iniciar sesión
              </h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                Usá tus credenciales para continuar
              </p>

              <form onSubmit={onSubmit} className="mt-6 space-y-5">
                <div>
                  <label className="block text-sm font-medium">Documento</label>
                  <input
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white/90 p-2.5 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-300 dark:border-slate-700 dark:bg-slate-950/50 dark:focus:border-brand-500 dark:focus:ring-brand-600/40"
                    value={documento}
                    onChange={(e) => setDocumento(e.target.value)}
                    placeholder="20000000000"
                    autoComplete="username"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium">Password</label>
                  <input
                    type="password"
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white/90 p-2.5 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-300 dark:border-slate-700 dark:bg-slate-950/50 dark:focus:border-brand-500 dark:focus:ring-brand-600/40"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="group relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 px-4 py-2.5 font-semibold text-white shadow-sm transition hover:from-brand-400 hover:to-brand-500 active:scale-[.99] disabled:opacity-60 dark:from-brand-500 dark:to-brand-600 dark:hover:from-brand-400 dark:hover:to-brand-500"
                >
                  {loading ? "Ingresando…" : "Ingresar"}
                  <span
                    className="absolute inset-0 -z-10 opacity-0 blur transition group-hover:opacity-30"
                    style={{
                      background:
                        "radial-gradient(120px 60px at 50% 0%, rgba(255,255,255,.8), rgba(255,255,255,0))",
                    }}
                  />
                </button>
              </form>

              <p className="mt-4 text-center text-xs text-slate-500 dark:text-slate-400">
                ¿Problemas para entrar? Contactá al administrador.
              </p>
            </div>
          </div>
        </section>
      </main>

      <ToastContainer position="top-right" />
    </div>
  );
}
