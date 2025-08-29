/**
 * ThemeToggle
 * Cambia entre modo claro/oscuro agregando/removiendo la clase .dark en <html>.
 * Persiste la preferencia en localStorage y respeta prefers-color-scheme al iniciar.
 * Prop `variant`: "default" (para fondos claros) | "onPrimary" (para la topbar celeste).
 */

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

type ThemeToggleProps = { variant?: "default" | "onPrimary" };

export default function ThemeToggle({ variant = "default" }: ThemeToggleProps) {
  const [dark, setDark] = useState<boolean>(() => {
    const saved = localStorage.getItem("theme");
    if (saved) return saved === "dark";
    return window.matchMedia?.("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (dark) {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [dark]);

  const base =
    "inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition active:scale-[.99]";
  const styles =
    variant === "onPrimary"
      ? "border border-white/25 bg-white/10 text-white hover:bg-white/15"
      : "border border-brand-200/60 bg-white/80 text-slate-700 shadow-sm backdrop-blur hover:bg-white dark:border-slate-700/70 dark:bg-slate-900/70 dark:text-slate-200";

  return (
    <button
      onClick={() => setDark((v) => !v)}
      title={dark ? "Cambiar a claro" : "Cambiar a oscuro"}
      className={`${base} ${styles}`}
    >
      {dark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
    </button>
  );
}
