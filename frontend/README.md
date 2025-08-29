UP-Core · Frontend (Vite + React + TypeScript + Tailwind v4)

Interfaz web para UP-Core con login por documento, dashboards por rol (gerente / operador / cliente), modo claro/oscuro, topbar celeste fijo, sidebar oscura auto-oculta, y paleta de marca fácilmente editable.

Stack

Vite + React + TypeScript

Tailwind CSS v4 (plugin oficial para Vite)

React Router

React-Toastify (notificaciones)

lucide-react (íconos)

Fetch nativo (client mínimo en src/lib/api.ts)

Requisitos

Node.js 18+

Backend UP-Core corriendo (por defecto en http://127.0.0.1:8000).

Empezar rápido
cd frontend
cp .env.local.example .env.local # crea tus variables si no existen
npm install
npm run dev

Abra http://localhost:5173.

Credenciales de prueba (si cargaste los seeds del backend):

Gerente: documento 20000000000 / password secret

Cliente: documento 30000000001 / password secret

Variables de entorno

Crea frontend/.env.local:

VITE_API_URL=http://127.0.0.1:8000

Scripts
npm run dev # modo desarrollo
npm run build # build de producción
npm run preview # previsualizar el build localmente

Arquitectura (carpetas principales)
frontend/
src/
components/
AppHeader.tsx # barra superior celeste fija (logo, tema, settings, logout)
AppSidebar.tsx # barra lateral oscura auto-oculta (iconos->iconos+texto en hover)
Protected.tsx # guard + layout de páginas protegidas (header + sidebar + outlet)
ThemeToggle.tsx # switch claro/oscuro (persistencia en localStorage)
config/
nav.ts # definición del menú por rol (+ feature flags)
context/
AuthContext.tsx # estado global de auth: { user, loading, login, logout }
lib/
api.ts # cliente fetch: login, me, authHeader
pages/
Login.tsx
dashboard/
Gerente.tsx
Operador.tsx
Cliente.tsx
App.tsx # routing público/privado por rol
main.tsx # entry (Router + AuthProvider)
index.css # Tailwind v4 + tokens de color de marca
public/
logo-uplink.svg # logo mostrado en la topbar
vite.config.ts # integra @tailwindcss/vite

UI / UX
Topbar (celeste fijo)

src/components/AppHeader.tsx
Siempre celeste (no cambia en modo oscuro). Incluye:

Logo (/public/logo-uplink.svg) + nombre

ThemeToggle (sun/moon con lucide-react)

Botón Configuración (placeholder) y Cerrar sesión

Borde inferior y sombras sutiles

Colores ajustables (HEX) dentro del archivo si querés afinar el tono.

Sidebar (oscura, auto-oculta con hover)

src/components/AppSidebar.tsx

Colapsada: w-16 (solo iconos).

En hover: w-56 (iconos + texto).

Ítem activo con barrita celeste (brand-500) a la izquierda.

Contenido según rol (ver config/nav.ts).

Contenido central (modo)

Solo el contenedor central cambia con claro/oscuro. La topbar y la sidebar mantienen sus colores (celeste y oscuro, respectivamente).

Paleta de marca (colores fáciles de cambiar)

La paleta vive en src/index.css usando Tailwind v4:

Import global + variante dark por clase:

@import "tailwindcss";
@custom-variant dark (&:where(.dark, .dark \*));

Tokens de marca (edita los HEX y toda la app se actualiza):

:root {
--brand-50: #eef4ff;
--brand-100: #dce8ff;
--brand-200: #b9d1ff;
--brand-300: #8eb4ff;
--brand-400: #5c92ff;
--brand-500: #2f72ff; /_ principal _/
--brand-600: #245ad8; /_ acento _/
}
:root.dark {
--brand-400: #6a9cff;
--brand-500: #3f7dff;
--brand-600: #2a5fd1;
}
@theme {
--color-brand-50: var(--brand-50);
--color-brand-100: var(--brand-100);
--color-brand-200: var(--brand-200);
--color-brand-300: var(--brand-300);
--color-brand-400: var(--brand-400);
--color-brand-500: var(--brand-500);
--color-brand-600: var(--brand-600);
}

Usás clases como bg-brand-500, from-brand-400 to-brand-600, border-brand-200, etc.

Modo claro/oscuro

Toggle manual: ThemeToggle escribe localStorage.theme = 'dark'|'light' y agrega/remueve .dark en <html>.

Bootstrap del tema (en index.html, <head>): se aplica la preferencia antes de pintar para evitar “flash”.

La topbar y la sidebar no se alteran con dark; solo el main cambia con dark:.

Navegación por rol

src/config/nav.ts define el menú por rol y feature flags:

export const NAV_BY_ROLE = {
gerente: [
{ label: "Dashboard", to: "/admin", icon: LayoutDashboard },
{ label: "Clientes", to: "#", icon: Users },
// ...
],
// operador, cliente...
};
export function getNavForRole(role) { /_ filtra por feature flags y devuelve items _/ }

La AppSidebar consume esta configuración. No hace falta un componente por rol.

Autenticación

login({ documento|email, password }) golpea /users/login y guarda el token en localStorage.

me() consulta /me con Authorization: Bearer <token>.

AuthContext hidrata el usuario si hay token y expone logout().

Íconos

Se usan desde lucide-react (e.g., import { Settings, LogOut } from "lucide-react").

Tamaños típicos: className="h-4 w-4" para acciones en topbar/sidebar.

Problemas comunes

“Tailwind no aplica”
Asegurate de usar Tailwind v4 con el plugin de Vite (@tailwindcss/vite) y reiniciar npm run dev.
src/index.css debe tener @import "tailwindcss";.

Dark mode no cambia
Confirmá que existe @custom-variant dark en index.css y que el toggle está agregando la clase .dark a <html>.

CORS / 401
Verifica VITE_API_URL y que el backend exponga CORS para http://localhost:5173.

No se ve el logo
Poné el archivo en frontend/public/logo-uplink.svg (o cambia la ruta en AppHeader.tsx).

Roadmap (ideas)

“Pin” para fijar la sidebar expandida + tooltips en modo colapsado.

Módulo de Clientes (listado + búsqueda) consumiendo /clientes/search.

Página de Configuración con perfil y preferencia de tema.

Hooks de datos con cache (React Query).
