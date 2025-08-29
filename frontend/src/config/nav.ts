/**
 * Configuración de navegación por rol.
 * NAV_BY_ROLE define los ítems visibles para cada rol.
 * FEATURE_FLAGS permite habilitar/deshabilitar módulos sin tocar el componente.
 * getNavForRole(role) devuelve la lista final que usa AppSidebar.
 */

import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard, Users, CreditCard, BarChart3, Settings, User, LifeBuoy, PackagePlus, ListChecks
} from "lucide-react";

export type Role = "gerente" | "operador" | "cliente";

export type NavItem = {
  type: "item";
  label: string;
  to: string;            // usa "#" si aún no existe la ruta
  icon: LucideIcon;
  feature?: string;      // opcional: flag para activar/desactivar
};

export type NavGroup = {
  type: "group";
  label: string;
  icon: LucideIcon;
  children: NavItem[];
  feature?: string;      // si querés esconder todo el grupo bajo una flag
};

export type NavNode = NavItem | NavGroup;

// Flags opcionales por si querés ocultar módulos sin tocar el componente
export const FEATURE_FLAGS: Record<string, boolean> = {
  pagos: true,
  planes: true,
  reportes: true,
};

const dashboardFor = (role: Role): NavItem => ({
  type: "item",
  label: "Dashboard",
  to: role === "gerente" ? "/admin" : role === "operador" ? "/operador" : "/cliente",
  icon: LayoutDashboard,
});

export const NAV_BY_ROLE: Record<Role, NavNode[]> = {
  gerente: [
    dashboardFor("gerente"),
    {
      type: "group",
      label: "Clientes",
      icon: Users,
      children: [
        { type: "item", label: "Nuevo cliente",  to: "#", icon: PackagePlus },
        { type: "item", label: "Lista de clientes", to: "#", icon: ListChecks },
      ],
    },
    {
      type: "group",
      label: "Pagos",
      icon: CreditCard,
      feature: "pagos",
      children: [
        { type: "item", label: "Nuevo pago",  to: "#", icon: PackagePlus },
        { type: "item", label: "Lista de pagos", to: "#", icon: ListChecks },
      ],
    },
    {
      type: "group",
      label: "Planes",
      icon: BarChart3,
      feature: "planes",
      children: [
        { type: "item", label: "Nuevo plan",  to: "#", icon: PackagePlus },
        { type: "item", label: "Lista de planes", to: "#", icon: ListChecks },
      ],
    },
    { type: "item", label: "Configuración", to: "#", icon: Settings },
  ],
  operador: [
    dashboardFor("operador"),
    {
      type: "group",
      label: "Clientes",
      icon: Users,
      children: [
        { type: "item", label: "Nuevo cliente",  to: "#", icon: PackagePlus },
        { type: "item", label: "Lista de clientes", to: "#", icon: ListChecks },
      ],
    },
    {
      type: "group",
      label: "Pagos",
      icon: CreditCard,
      feature: "pagos",
      children: [
        { type: "item", label: "Nuevo pago",  to: "#", icon: PackagePlus },
        { type: "item", label: "Lista de pagos", to: "#", icon: ListChecks },
      ],
    },
    { type: "item", label: "Configuración", to: "#", icon: Settings },
  ],
  cliente: [
    dashboardFor("cliente"),
    {
      type: "group",
      label: "Pagos",
      icon: CreditCard,
      feature: "pagos",
      children: [
        { type: "item", label: "Realizar pago", to: "#", icon: PackagePlus },
        { type: "item", label: "Historial de pagos", to: "#", icon: ListChecks },
      ],
    },
    { type: "item", label: "Soporte", to: "#", icon: LifeBuoy },
    { type: "item", label: "Configuración", to: "#", icon: Settings },
  ],
};

// Aplica feature flags a grupos y a items internos
export function getNavForRole(role: Role): NavNode[] {
  const nodes = NAV_BY_ROLE[role] ?? NAV_BY_ROLE.cliente;
  const on = (f?: string) => (f ? FEATURE_FLAGS[f] === true : true);

  return nodes
    .filter(n => on(n.feature))
    .map(n => {
      if (n.type === "group") {
        const children = n.children.filter(c => on(c.feature));
        return { ...n, children };
      }
      return n;
    })
    .filter(n => (n.type === "group" ? n.children.length > 0 : true));
}
