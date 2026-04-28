import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { tokenStore } from "../api/client";
import * as authApi from "../api/auth";

type AuthState = {
  user: authApi.User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<authApi.User>;
  register: (payload: Parameters<typeof authApi.register>[0]) => Promise<authApi.User>;
  logout: () => void;
  refresh: () => Promise<void>;
};

const AuthCtx = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<authApi.User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const token = tokenStore.get();
    if (!token) {
      setLoading(false);
      return;
    }
    authApi
      .me()
      .then((u) => mounted && setUser(u))
      .catch(() => tokenStore.clear())
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, []);

  async function login(email: string, password: string) {
    const { access_token, user: u } = await authApi.login(email, password);
    tokenStore.set(access_token);
    setUser(u);
    return u;
  }

  async function register(payload: Parameters<typeof authApi.register>[0]) {
    const { access_token, user: u } = await authApi.register(payload);
    tokenStore.set(access_token);
    setUser(u);
    return u;
  }

  function logout() {
    tokenStore.clear();
    setUser(null);
  }

  async function refresh() {
    const u = await authApi.me();
    setUser(u);
  }

  return (
    <AuthCtx.Provider value={{ user, loading, login, register, logout, refresh }}>
      {children}
    </AuthCtx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
