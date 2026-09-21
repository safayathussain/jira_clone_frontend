"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useStore } from "@/store";
import { api } from "@/lib/api";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { user, setUser } = useStore();
  const router = useRouter();
  const pathname = usePathname();
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    async function initAuth() {
      const token = localStorage.getItem("access_token");
      if (!token) {
        if (!pathname.startsWith("/login") && !pathname.startsWith("/register")) {
          router.push("/login");
        }
        setIsInitializing(false);
        return;
      }

      if (!user) {
        try {
          const res = await api.get("/users/me");
          setUser(res.data);
        } catch (err) {
          console.error("Auth check failed", err);
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
          router.push("/login");
        }
      }
      setIsInitializing(false);
    }

    initAuth();
  }, [user, setUser, router, pathname]);

  if (isInitializing) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
