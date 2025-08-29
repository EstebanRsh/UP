/**
 * AppHeader
 * Barra superior fija SIEMPRE celeste (no cambia con modo oscuro).
 * Contiene: logo + nombre de la empresa, ThemeToggle, botón de Configuración y Cerrar sesión.
 * El logo linkea al “home” según el rol (gerente/operador/cliente).
 */
// src/components/AppSidebar.tsx
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  getNavForRole,
  type Role,
  type NavNode,
  type NavItem,
  type NavGroup,
} from "../config/nav";
import { ChevronRight } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

/** ================== AJUSTES RÁPIDOS ================== */
const GRACE_MS = 400; // ⏱️ retardo antes de iniciar ocultado del flyout
const IN_ANIM_MS = 180; // 🎬 duración animación de ENTRADA
const OUT_ANIM_MS = 240; // 🎬 duración animación de SALIDA
const CROSS_MS = 120; // 🔁 “gracia” al salir del panel para volver al icono
/** ===================================================== */

/**
 * Sidebar oscura (siempre w-16) con submenús flotantes a la derecha.
 * Sin tooltips nativos (quitamos title); usamos aria-label para accesibilidad.
 */

type FlyoutState = {
  label: string | null; // grupo abierto
  top: number; // Y relativo al aside
};

type Phase = "idle" | "enter" | "exit";

export default function AppSidebar() {
  const { user } = useAuth();
  const role: Role = (user?.role as Role) ?? "cliente";
  const { pathname } = useLocation();

  const items = useMemo(() => getNavForRole(role), [role]);

  const asideRef = useRef<HTMLDivElement>(null);
  const flyoutRef = useRef<HTMLDivElement>(null);

  const [flyout, setFlyout] = useState<FlyoutState>({ label: null, top: 0 });
  const [phase, setPhase] = useState<Phase>("idle");
  const [overFlyout, setOverFlyout] = useState(false);
  const [overGroup, setOverGroup] = useState(false);

  const closeTimer = useRef<number | undefined>(undefined);
  const animTimer = useRef<number | undefined>(undefined);

  function clearTimers() {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = undefined;
    }
    if (animTimer.current) {
      clearTimeout(animTimer.current);
      animTimer.current = undefined;
    }
  }

  function openFlyout(group: NavGroup, elem: HTMLElement) {
    clearTimers();
    setOverGroup(true);
    const asideRect = asideRef.current?.getBoundingClientRect();
    const btnRect = elem.getBoundingClientRect();
    const top = asideRect ? Math.max(8, btnRect.top - asideRect.top - 6) : 8;

    setFlyout({ label: group.label, top });
    setPhase("enter");
    requestAnimationFrame(() => setPhase("idle"));
  }

  function scheduleClose(delay = GRACE_MS) {
    clearTimers();
    closeTimer.current = window.setTimeout(() => {
      if (!overGroup && !overFlyout) {
        setPhase("exit");
        animTimer.current = window.setTimeout(() => {
          setFlyout((s) => (s.label ? { ...s, label: null } : s));
          setPhase("idle");
        }, OUT_ANIM_MS);
      }
    }, delay);
  }

  useEffect(() => {
    function handlePointerMove(e: PointerEvent) {
      const t = e.target as Node;
      const insideAside = !!asideRef.current?.contains(t);
      const insideFly = !!flyoutRef.current?.contains(t);
      if (!insideAside && !insideFly) {
        setOverGroup(false);
        setOverFlyout(false);
        scheduleClose();
      }
    }
    function handleWindowBlur() {
      setOverGroup(false);
      setOverFlyout(false);
      scheduleClose(80);
    }
    window.addEventListener("pointermove", handlePointerMove, {
      passive: true,
    });
    window.addEventListener("blur", handleWindowBlur);
    document.addEventListener("mouseleave", handleWindowBlur);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("blur", handleWindowBlur);
      document.removeEventListener("mouseleave", handleWindowBlur);
    };
  }, []);

  function Item({ item }: { item: NavItem }) {
    const active =
      item.to !== "#" &&
      (pathname === item.to || pathname.startsWith(item.to + "/"));
    const base =
      "group flex items-center justify-center rounded-lg p-2 text-[13px] transition-colors";
    const enabled = active
      ? "bg-white/10 text-white"
      : "text-slate-200/90 hover:bg-white/10 hover:text-white";
    const disabled = "cursor-not-allowed text-slate-400/60";
    const Content = <item.icon className="h-4 w-4" />;

    return item.to === "#" ? (
      <div
        className={`${base} ${disabled}`}
        aria-label={item.label}
        onMouseEnter={() => {
          setOverGroup(false);
          scheduleClose();
        }}
      >
        {Content}
      </div>
    ) : (
      <Link
        to={item.to}
        className={`${base} ${enabled}`}
        aria-current={active ? "page" : undefined}
        aria-label={item.label}
        onMouseEnter={() => {
          setOverGroup(false);
          scheduleClose();
        }}
      >
        {Content}
      </Link>
    );
  }

  function Group({ group }: { group: NavGroup }) {
    const childActive = group.children.some(
      (c) =>
        c.to !== "#" && (pathname === c.to || pathname.startsWith(c.to + "/"))
    );
    const btnBase =
      "group flex items-center justify-center rounded-lg p-2 text-[13px] transition-colors";
    const btnStyle = childActive
      ? "bg-white/10 text-white"
      : "text-slate-200/90 hover:bg-white/10 hover:text-white";

    return (
      <div
        className="relative"
        onMouseEnter={(e) => {
          const target = e.currentTarget.querySelector(
            "button"
          ) as HTMLElement | null;
          if (target) openFlyout(group, target);
        }}
        onMouseLeave={() => {
          setOverGroup(false);
          scheduleClose();
        }}
      >
        <button
          type="button"
          className={`${btnBase} ${btnStyle} w-full`}
          aria-label={group.label}
        >
          <group.icon className="h-4 w-4" />
        </button>
        <ChevronRight className="pointer-events-none absolute right-1 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/40" />
      </div>
    );
  }

  function FlyoutPanel({ group }: { group: NavGroup }) {
    const style: React.CSSProperties = {
      top: flyout.top,
      transitionTimingFunction: "ease",
      willChange: "opacity, transform, filter",
      transitionDuration:
        phase === "enter" ? `${IN_ANIM_MS}ms` : `${OUT_ANIM_MS}ms`,
      opacity: phase === "exit" ? 0 : 1,
      transform:
        phase === "enter"
          ? "translateX(-4px)"
          : phase === "exit"
          ? "translateX(8px)"
          : "translateX(0px)",
      filter: phase === "exit" ? "blur(2px)" : "none",
    };

    return (
      <div
        ref={flyoutRef}
        className={[
          "absolute left-full z-30 w-56 overflow-hidden rounded-lg",
          "border border-white/10 bg-slate-900/95 text-slate-100 shadow-xl backdrop-blur",
          "transition-all",
        ].join(" ")}
        style={style}
        onMouseEnter={() => {
          clearTimers();
          setOverFlyout(true);
        }}
        onMouseLeave={() => {
          setOverFlyout(false);
          scheduleClose(CROSS_MS);
        }}
      >
        <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
          {group.label}
        </div>
        <div className="px-2 pb-2">
          {group.children.map((child) => {
            const active =
              child.to !== "#" &&
              (pathname === child.to || pathname.startsWith(child.to + "/"));
            const row =
              "flex items-center gap-3 rounded-md px-2 py-2 text-sm transition-colors";
            const enabled = active
              ? "bg-white/10 text-white"
              : "text-slate-200/90 hover:bg-white/10 hover:text-white";
            const disabled = "cursor-not-allowed text-slate-400/60";

            const Content = (
              <>
                <child.icon className="h-4 w-4" />
                <span className="whitespace-nowrap">{child.label}</span>
              </>
            );

            return child.to === "#" ? (
              <div key={child.label} className={`${row} ${disabled}`}>
                {Content}
              </div>
            ) : (
              <Link
                key={child.label}
                to={child.to}
                className={`${row} ${enabled}`}
              >
                {Content}
              </Link>
            );
          })}
        </div>
      </div>
    );
  }

  const currentGroup =
    flyout.label &&
    (items.find((n) => n.type === "group" && n.label === flyout.label) as
      | NavGroup
      | undefined);

  return (
    <aside
      ref={asideRef}
      className="
        relative z-20 flex w-16 shrink-0 flex-col items-stretch
        border-r border-black/10 bg-slate-900 p-2 text-slate-200
      "
      style={{ minHeight: "calc(100vh - 48px)" }} /* 48px = h-12 del header */
      onMouseLeave={() => {
        setOverGroup(false);
        scheduleClose();
      }}
    >
      <nav className="flex flex-col gap-1">
        {items.map((node: NavNode, idx) =>
          node.type === "group" ? (
            <div key={`${node.label}-${idx}`}>
              <Group group={node} />
              {currentGroup && currentGroup.label === node.label && (
                <FlyoutPanel group={currentGroup} />
              )}
            </div>
          ) : (
            <Item key={`${node.label}-${idx}`} item={node} />
          )
        )}
      </nav>

      <div className="mt-auto pt-2">
        <div className="h-px bg-white/10" />
      </div>
    </aside>
  );
}
