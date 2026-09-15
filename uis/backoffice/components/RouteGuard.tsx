"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/contexts/AuthContext";

export function RouteGuard({ children }: Readonly<{ children: React.ReactNode }>) {
  const router = useRouter();
  const { isLoggedIn, loading } = useAuth();

  useEffect(() => {
    if (!loading && !isLoggedIn) {
      router.push("/login");
    }
  }, [isLoggedIn, loading, router]);

  if (loading) {
    return <div className="flex min-h-48 items-center justify-center text-sm text-slate-600">Cargando...</div>;
  }

  if (!isLoggedIn) {
    return null;
  }

  return children;
}