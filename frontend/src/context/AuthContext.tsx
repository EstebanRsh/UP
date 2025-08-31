// frontend/src/context/AuthContext.tsx
/**
 * AuthContext
 * - Hidrata el usuario inicial desde /me si hay token
 * - login(): hace /users/login, guarda token y luego /me
 * - logout(): limpia token, role y cliente_id
 * - Sincroniza role/cliente_id en localStorage (para compatibilidad)
 */
import { createContext, useContext, useEffect, useState } from "react";
import { login as apiLogin, me as apiMe } from "../lib/api";

export type Role = "gerente" | "operador" | "cliente";
export type User = {
  user_id?: number;
  username?: string;
  role?: Role;
  cliente_id?: number | null;
};
type Ctx = {
  user: User | null;
  loading: boolean;
  login: (cred: {
    documento?: string;
    email?: string;
    password: string;
  }) => Promise<User>;
  logout: () => void;
};

const AuthCtx = createContext<Ctx>({} as Ctx);
export const useAuth = () => useContext(AuthCtx);

const ROLE_KEY = "role";
const CLIENTE_ID_KEY = "cliente_id";
const TOKEN_KEY = "token";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  async function hydrate() {
    try {
      if (!localStorage.getItem(TOKEN_KEY)) return;
      const u = await apiMe();
      setUser(u);
      if (u?.role) localStorage.setItem(ROLE_KEY, u.role);
      else localStorage.removeItem(ROLE_KEY);

      if (u?.cliente_id != null)
        localStorage.setItem(CLIENTE_ID_KEY, String(u.cliente_id));
      else localStorage.removeItem(CLIENTE_ID_KEY);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    hydrate();
  }, []);

  async function login(cred: {
    documento?: string;
    email?: string;
    password: string;
  }) {
    await apiLogin(cred); // guarda token
    const u = await apiMe(); // trae role/cliente_id frescos del backend
    setUser(u);

    if (u?.role) localStorage.setItem(ROLE_KEY, u.role);
    else localStorage.removeItem(ROLE_KEY);

    if (u?.cliente_id != null)
      localStorage.setItem(CLIENTE_ID_KEY, String(u.cliente_id));
    else localStorage.removeItem(CLIENTE_ID_KEY);

    return u;
  }

  function logout() {
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(ROLE_KEY);
      localStorage.removeItem(CLIENTE_ID_KEY);
    } catch {}
    setUser(null);
  }

  return (
    <AuthCtx.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthCtx.Provider>
  );
}
