// src/config/nav.ts
// Mapa de navegación por rol para AppSidebar y el header.
// Asegura que GERENTE tenga como "Inicio" => /admin (su dashboard).

import {
  LayoutDashboard,
  Users,
  UserPlus,
  ListOrdered,
  Package,
  Receipt,
  Settings,
} from "lucide-react";

export type Role = "gerente" | "operador" | "cliente";

export type NavItem = {
  type: "item";
  label: string;
  to: string;
  icon: any; // lucide icon component
};

export type NavGroup = {
  type: "group";
  label: string;
  icon: any; // lucide icon component
  children: NavItem[];
};

export type NavNode = NavItem | NavGroup;

function gerenteNav(): NavNode[] {
  return [
    // Inicio del gerente => /admin
    { type: "item", label: "Inicio", to: "/admin", icon: LayoutDashboard },

    // Gestión de clientes (compartida con operador)
    {
      type: "group",
      label: "Clientes",
      icon: Users,
      children: [
        { type: "item", label: "Nuevo cliente", to: "/clientes/nuevo", icon: UserPlus },
        { type: "item", label: "Lista de clientes", to: "/clientes", icon: ListOrdered },
      ],
    },

    // (Opcional) Otros grupos del panel gerencial
    {
      type: "group",
      label: "Planes",
      icon: Package,
      children: [
        // completá rutas reales cuando estén listas:
        { type: "item", label: "Nuevo plan", to: "#", icon: Package },
        { type: "item", label: "Lista de planes", to: "#", icon: ListOrdered },
      ],
    },
    {
      type: "group",
      label: "Pagos",
      icon: Receipt,
      children: [
        { type: "item", label: "Registrar pago", to: "#", icon: Receipt },
        { type: "item", label: "Listado de pagos", to: "#", icon: ListOrdered },
      ],
    },
    {
      type: "group",
      label: "Configuración",
      icon: Settings,
      children: [
        { type: "item", label: "Preferencias", to: "#", icon: Settings },
      ],
    },
  ];
}

function operadorNav(): NavNode[] {
  return [
    // Inicio del operador => /operador (su dashboard)
    { type: "item", label: "Inicio", to: "/operador", icon: LayoutDashboard },
    {
      type: "group",
      label: "Clientes",
      icon: Users,
      children: [
        { type: "item", label: "Nuevo cliente", to: "/clientes/nuevo", icon: UserPlus },
        { type: "item", label: "Lista de clientes", to: "/clientes", icon: ListOrdered },
      ],
    },
    {
      type: "group",
      label: "Planes",
      icon: Package,
      children: [
        { type: "item", label: "Nuevo plan", to: "#", icon: Package },
        { type: "item", label: "Lista de planes", to: "#", icon: ListOrdered },
      ],
    },
  ];
}

function clienteNav(): NavNode[] {
  return [
    // Inicio del cliente final => /cliente
    { type: "item", label: "Inicio", to: "/cliente", icon: LayoutDashboard },
    // Agregá aquí entradas que apliquen al portal del cliente
  ];
}

export function getNavForRole(role: Role): NavNode[] {
  if (role === "gerente") return gerenteNav();
  if (role === "operador") return operadorNav();
  return clienteNav();
}
