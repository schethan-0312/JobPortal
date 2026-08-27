"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api, getToken, setToken, ApiError } from "./api";

export type Role = "CANDIDATE" | "EMPLOYER" | "ADMIN";

export interface AuthUser {
  userId: string;
  email: string;
  role: Role;
}

interface RegisterInput {
  email: string;
  password: string;
  role: "CANDIDATE" | "EMPLOYER";
  fullName: string;
  location?: string;
  referralCode?: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  register: (input: RegisterInput) => Promise<AuthUser>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const loadMe = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const me = await api.get<AuthUser>("/auth/me");
      setUser(me);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setToken(null);
      }
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMe();
  }, [loadMe]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.post<{ accessToken: string; user: { id: string; email: string; role: Role } }>(
      "/auth/login",
      { email, password },
      { auth: false },
    );
    setToken(res.accessToken);
    const authUser: AuthUser = { userId: res.user.id, email: res.user.email, role: res.user.role };
    setUser(authUser);
    return authUser;
  }, []);

  const register = useCallback(async (input: RegisterInput) => {
    const res = await api.post<{ accessToken: string; user: { id: string; email: string; role: Role } }>(
      "/auth/register",
      input,
      { auth: false },
    );
    setToken(res.accessToken);
    const authUser: AuthUser = { userId: res.user.id, email: res.user.email, role: res.user.role };
    setUser(authUser);
    return authUser;
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
