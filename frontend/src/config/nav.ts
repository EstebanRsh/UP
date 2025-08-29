/**
 * Configuración de navegación por rol.
 * NAV_BY_ROLE define los ítems visibles para cada rol.
 * FEATURE_FLAGS permite habilitar/deshabilitar módulos sin tocar el componente.
 * getNavForRole(role) devuelve la lista final que usa AppSidebar.
 */

import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard, Users, CreditCard, BarChart3, Settings, User, LifeBuoy
} from "lucide-react";

export type Role = "gerente" | "operador" | "cliente";

export type NavItem = {
  label: string;
  to: string;              // ruta destino (usa "#" si todavía no existe)
  icon: LucideIcon;
  feature?: string;        // opcional: feature flag
};

// Opcional: flags para activar/desactivar módulos sin tocar código del sidebar
export const FEATURE_FLAGS: Record<string, boolean> = {
  pagos: true,
  reportes: true,
};

// Menú por rol
export const NAV_BY_ROLE: Record<Role, NavItem[]> = {
  gerente: [
    { label: "Dashboard", to: "/admin",   icon: LayoutDashboard },
    { label: "Clientes",  to: "#",        icon: Users },
    { label: "Pagos",     to: "#",        icon: CreditCard, feature: "pagos" },
    { label: "Reportes",  to: "#",        icon: BarChart3,  feature: "reportes" },
    { label: "Config.",   to: "#",        icon: Settings },
  ],
  operador: [
    { label: "Dashboard", to: "/operador", icon: LayoutDashboard },
    { label: "Clientes",  to: "#",         icon: Users },
    { label: "Pagos",     to: "#",         icon: CreditCard, feature: "pagos" },
    { label: "Reportes",  to: "#",         icon: BarChart3,  feature: "reportes" },
    { label: "Config.",   to: "#",         icon: Settings },
  ],
  cliente: [
    { label: "Mi cuenta", to: "/cliente", icon: User },
    { label: "Pagos",     to: "#",        icon: CreditCard, feature: "pagos" },
    { label: "Soporte",   to: "#",        icon: LifeBuoy },
    { label: "Config.",   to: "#",        icon: Settings },
  ],
};

/** Devuelve los ítems visibles para el rol, considerando feature flags */
export function getNavForRole(role: Role): NavItem[] {
  const items = NAV_BY_ROLE[role] ?? NAV_BY_ROLE.cliente;
  return items.filter(it => !it.feature || FEATURE_FLAGS[it.feature] === true);
}
