"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { clearToken, isAuthenticated } from "@/lib/auth";

type AuthContextType = {
  isLoggedIn: boolean;
  loading: boolean;
  logout: () => void;
  refreshAuthState: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  const refreshAuthState = () => {
    setIsLoggedIn(isAuthenticated());
  };

  useEffect(() => {
    refreshAuthState();
    setLoading(false);
  }, []);

  const logout = () => {
    clearToken();
    setIsLoggedIn(false);
    router.push("/login");
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, loading, logout, refreshAuthState }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe usarse dentro de AuthProvider");
  }

  return context;
}