import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getNavForRole, type NavNode } from "../config/nav";

export default function AppSidebar() {
  const { user } = useAuth();
  const role = (user?.role ?? "operador") as any; // fallback operador
  const nav = getNavForRole(role);

  return (
    <aside className="hidden md:block fixed left-0 top-12 h-[calc(100vh-48px)] w-64 border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div className="p-3">
        {nav.map((n, idx) =>
          n.type === "item" ? (
            <NavItem key={idx} to={n.to} label={n.label} />
          ) : (
            <NavGroup key={idx} label={n.label}>
              {n.children.map((c, i) => (
                <NavItem key={`${idx}-${i}`} to={c.to} label={c.label} />
              ))}
            </NavGroup>
          )
        )}
      </div>
    </aside>
  );
}

function NavGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-3">
      <div className="px-2 pb-1 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {label}
      </div>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function NavItem({ to, label }: { to: string; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `block rounded-lg px-3 py-2 text-sm transition ${
          isActive
            ? "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100"
            : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800/70"
        }`
      }
    >
      {label}
    </NavLink>
  );
}
