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
    <div className="min-h-screen overflow-hidden bg-gradient-to-b from-sky-50 via-white to-white text-slate-900 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900 dark:text-slate-100">
      {/* barra superior tipo “hero” simple */}
      <header className="relative z-10 border-b border-sky-100/70 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-900/70">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-md bg-gradient-to-br from-sky-400 to-blue-600" />
            <span className="text-base font-semibold tracking-tight">
              ImperialSoft
            </span>
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* decoración de fondo sutil */}
      <div className="pointer-events-none absolute inset-0 -z-10 opacity-50 blur-3xl">
        <div className="mx-auto mt-[-6rem] h-[28rem] w-[28rem] rounded-full bg-sky-200/30 dark:bg-sky-800/20" />
      </div>

      {/* contenido */}
      <main className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-6 py-12 md:grid-cols-2 md:py-16">
        {/* lado izquierdo: copy/branding */}
        <section className="hidden md:block">
          <h1 className="bg-gradient-to-r from-sky-600 to-blue-700 bg-clip-text text-4xl font-extrabold text-transparent dark:from-sky-400 dark:to-blue-400">
            Conectá tu gestión con UP-Core
          </h1>
          <p className="mt-4 max-w-md text-sm text-slate-600 dark:text-slate-300">
            Ingresá con tu documento y contraseña para acceder a tu panel.
            Diseño inspirado en AnyDesk, pero con paleta{" "}
            <strong>azul/celeste</strong> y soporte de{" "}
            <strong>modo oscuro/claro</strong>.
          </p>

          <ul className="mt-6 space-y-3 text-sm text-slate-600 dark:text-slate-300">
            <li>• Seguridad con token</li>
            <li>• Dashboards según tu rol</li>
            <li>• Interfaz limpia y responsiva</li>
          </ul>
        </section>

        {/* card de login con efecto glass y borde degradado */}
        <section className="mx-auto w-full max-w-md">
          <div className="rounded-2xl bg-gradient-to-br from-sky-200/70 to-blue-200/70 p-[1px] shadow-lg dark:from-sky-800/50 dark:to-blue-800/50">
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
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white/90 p-2.5 outline-none ring-sky-500/0 transition focus:border-sky-400 focus:ring-2 focus:ring-sky-300 dark:border-slate-700 dark:bg-slate-950/50 dark:focus:border-sky-500 dark:focus:ring-sky-600/40"
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
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white/90 p-2.5 outline-none ring-sky-500/0 transition focus:border-sky-400 focus:ring-2 focus:ring-sky-300 dark:border-slate-700 dark:bg-slate-950/50 dark:focus:border-sky-500 dark:focus:ring-sky-600/40"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="group relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-sky-600 to-blue-700 px-4 py-2.5 font-semibold text-white shadow-sm transition hover:from-sky-500 hover:to-blue-600 active:scale-[.99] disabled:opacity-60 dark:from-sky-500 dark:to-blue-600 dark:hover:from-sky-400 dark:hover:to-blue-500"
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
