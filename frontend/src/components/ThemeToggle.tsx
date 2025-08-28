import { useEffect, useState } from "react";

export default function ThemeToggle() {
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

  return (
    <button
      onClick={() => setDark((v) => !v)}
      title={dark ? "Cambiar a claro" : "Cambiar a oscuro"}
      className="inline-flex items-center gap-2 rounded-xl border border-brand-200/60 bg-white/80 px-3 py-2 text-sm font-medium text-slate-700 shadow-sm backdrop-blur hover:bg-white dark:border-slate-700/70 dark:bg-slate-900/70 dark:text-slate-200"
    >
      <span className="h-4 w-4">{dark ? "🌙" : "☀️"}</span>
      <span className="">{dark ? "Oscuro" : "Claro"}</span>
    </button>
  );
}
