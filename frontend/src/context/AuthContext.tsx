/**
 * AuthContext
 * Estado global de autenticación: { user, loading, login, logout }.
 * Hidrata el usuario inicial llamando /me si hay token.
 * Centraliza logout (remueve token y limpia estado).
 */
import { createContext, useContext, useEffect, useState } from "react";
import { login as apiLogin, me as apiMe } from "../lib/api";

type User = {
  user_id?: number;
  username?: string;
  role?: "gerente" | "operador" | "cliente";
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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  async function hydrate() {
    try {
      if (!localStorage.getItem("token")) return;
      const u = await apiMe();
      setUser(u);
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
    await apiLogin(cred); // guarda token en localStorage
    const u = await apiMe(); // trae role, user_id, etc.
    setUser(u);
    return u;
  }

  function logout() {
    localStorage.removeItem("token");
    setUser(null);
  }

  return (
    <AuthCtx.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthCtx.Provider>
  );
}
