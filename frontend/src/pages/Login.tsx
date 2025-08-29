/**
 * Login
 * Formulario documento + password. Usa AuthContext.login, muestra toasts y
 * redirige al dashboard según el rol. Estilizado con la paleta celeste de marca.
 */

// src/pages/Login.tsx
import { useEffect, useMemo, useState } from "react";
import { ToastContainer, toast, type Theme } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import ThemeToggle from "../components/ThemeToggle";
import { User2, Lock, Eye, EyeOff, Loader2 } from "lucide-react";

/** Paleta consistente con la topbar */
const CEL = "#0DA3E3"; // celeste principal (topbar)
const CEL_DARK = "#087BBE"; // celeste profundo para bordes/sombras

export default function Login() {
  const [documento, setDocumento] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);

  const nav = useNavigate();
  const { login } = useAuth();

  // Detecta dark/light mirando la clase .dark en <html>, para Toastify
  const initialTheme: Theme = useMemo(
    () =>
      document.documentElement.classList.contains("dark") ? "dark" : "light",
    []
  );
  const [toastTheme, setToastTheme] = useState<Theme>(initialTheme);

  useEffect(() => {
    const obs = new MutationObserver(() => {
      setToastTheme(
        document.documentElement.classList.contains("dark") ? "dark" : "light"
      );
    });
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => obs.disconnect();
  }, []);

  // Prefill si “Recordarme” estuvo activo
  useEffect(() => {
    const r = localStorage.getItem("remember_login") === "1";
    const doc = localStorage.getItem("remember_documento") || "";
    setRemember(r);
    if (r && doc) setDocumento(doc);
  }, []);

  function validate(): boolean {
    const doc = documento.trim();
    const pass = password.trim();

    if (!doc) return toast.error("Ingresá tu documento."), false;
    if (!/^\d+$/.test(doc))
      return toast.error("El documento debe contener solo números."), false;
    if (doc.length < 7 || doc.length > 13)
      return toast.error("Largo de documento inválido (7–13 dígitos)."), false;
    if (!pass) return toast.error("Ingresá tu contraseña."), false;
    if (pass.length < 4)
      return (
        toast.error("La contraseña debe tener al menos 4 caracteres."), false
      );

    return true;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const u = await login({
        documento: documento.trim(),
        password: password.trim(),
      });

      // Persistencia del “Recordarme”
      if (remember) {
        localStorage.setItem("remember_login", "1");
        localStorage.setItem("remember_documento", documento.trim());
      } else {
        localStorage.removeItem("remember_login");
        localStorage.removeItem("remember_documento");
      }

      toast.success("Bienvenido 👋");
      const to =
        u.role === "gerente"
          ? "/admin"
          : u.role === "operador"
          ? "/operador"
          : "/cliente";
      nav(to, { replace: true });
    } catch (err: any) {
      toast.error(err?.message || "Error de autenticación");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100">
      {/* Topbar celeste (logo + tema) */}
      <header
        className="sticky top-0 z-20 h-12 w-full text-white shadow"
        style={{ backgroundColor: CEL, borderBottom: `1px solid ${CEL_DARK}` }}
      >
        <div className="mx-auto flex h-full max-w-6xl items-center justify-between px-3">
          <div className="flex items-center gap-2">
            <img src="/logo-uplink.svg" alt="uplink" className="h-6 w-auto" />
            <span className="text-sm font-semibold tracking-wide uppercase">
              uplink
            </span>
          </div>
          <ThemeToggle variant="onPrimary" />
        </div>
      </header>

      {/* Contenido */}
      <main className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-6 py-10 md:grid-cols-2 md:py-16">
        {/* Leyenda / presentación (izquierda) */}
        <section className="hidden md:block">
          <h1
            className="text-4xl font-extrabold tracking-tight"
            style={{
              backgroundImage: `linear-gradient(90deg, ${CEL} , ${CEL_DARK})`,
              WebkitBackgroundClip: "text",
              color: "transparent",
            }}
          >
            UP-Link: soluciones digitales modernas y accesibles
          </h1>
          <p className="mt-4 max-w-md text-sm text-slate-600 dark:text-slate-300">
            Somos un proveedor de internet que acerca conectividad confiable a{" "}
            <strong>zonas urbanas y rurales</strong>. Operamos en{" "}
            <strong>------</strong> y <strong>-----</strong>, ampliando nuestra
            cobertura para que más personas y negocios tengan acceso a servicios
            estables, seguros y a un precio justo.
          </p>

          <ul className="mt-6 space-y-3 text-sm text-slate-600 dark:text-slate-300">
            <li>• Enfoque en calidad de servicio y soporte local.</li>
            <li>• Panel unificado para gestionar clientes, pagos y planes.</li>
            <li>• Seguridad, rendimiento y crecimiento sostenido.</li>
          </ul>
        </section>

        {/* Card de login (derecha) */}
        <section className="mx-auto w-full max-w-md">
          <div
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
            style={{ borderTopWidth: 4, borderTopColor: CEL }} // borde superior celeste
          >
            <h2 className="text-2xl font-bold tracking-tight">
              Iniciar sesión
            </h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Documento y contraseña para continuar
            </p>

            <form onSubmit={onSubmit} className="mt-6 space-y-5">
              {/* Documento */}
              <div>
                <label className="block text-sm font-medium">Documento</label>
                <div className="mt-1 relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <User2 className="h-4 w-4" />
                  </span>
                  <input
                    className="w-full rounded-lg border bg-white pl-9 pr-3 py-2.5 outline-none transition dark:bg-slate-950/60"
                    style={{
                      borderColor: document.documentElement.classList.contains(
                        "dark"
                      )
                        ? "#334155"
                        : "#cbd5e1", // slate-600 / slate-300
                    }}
                    onFocus={(e) =>
                      (e.currentTarget.style.boxShadow = `0 0 0 3px ${CEL}33`)
                    }
                    onBlur={(e) => (e.currentTarget.style.boxShadow = "none")}
                    value={documento}
                    onChange={(e) => setDocumento(e.target.value)}
                    placeholder="20000000000"
                    inputMode="numeric"
                    autoComplete="username"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium">Password</label>
                <div className="mt-1 relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <Lock className="h-4 w-4" />
                  </span>
                  <input
                    type={showPw ? "text" : "password"}
                    className="w-full rounded-lg border bg-white pl-9 pr-10 py-2.5 outline-none transition dark:bg-slate-950/60"
                    style={{
                      borderColor: document.documentElement.classList.contains(
                        "dark"
                      )
                        ? "#334155"
                        : "#cbd5e1",
                    }}
                    onFocus={(e) =>
                      (e.currentTarget.style.boxShadow = `0 0 0 3px ${CEL}33`)
                    }
                    onBlur={(e) => (e.currentTarget.style.boxShadow = "none")}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    aria-label={
                      showPw ? "Ocultar contraseña" : "Mostrar contraseña"
                    }
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md px-2 py-1 text-slate-500 hover:bg-slate-200/60 hover:text-slate-700 dark:text-slate-300 dark:hover:bg-slate-800/60"
                  >
                    {showPw ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Recordarme */}
              <div className="flex items-center justify-between">
                <label className="inline-flex select-none items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 focus:ring-0 dark:border-slate-700"
                    style={{ accentColor: CEL }}
                  />
                  Recordarme
                </label>

                <a
                  className="text-sm hover:underline"
                  href="#"
                  onClick={(e) => e.preventDefault()}
                  style={{ color: CEL }}
                >
                  ¿Olvidaste tu contraseña?
                </a>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full overflow-hidden rounded-xl px-4 py-2.5 font-semibold text-white shadow-sm transition active:scale-[.99] disabled:cursor-not-allowed disabled:opacity-60"
                style={{
                  backgroundImage: `linear-gradient(90deg, ${CEL}, ${CEL_DARK})`,
                }}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Ingresando…
                  </span>
                ) : (
                  "Ingresar"
                )}
              </button>
            </form>

            <p className="mt-4 text-center text-xs text-slate-500 dark:text-slate-400">
              Ante cualquier inconveniente, contactá al administrador.
            </p>
          </div>
        </section>
      </main>

      {/* Toastify que respeta el modo */}
      <ToastContainer position="top-right" theme={toastTheme} />
    </div>
  );
}
