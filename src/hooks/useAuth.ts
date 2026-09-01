"use client";

import { useRouter } from "next/navigation";
import { getErrorMessage } from "@/lib/api";
import { authService } from "@/services/auth.service";
import { useAuthStore } from "@/store/authStore";
import type { AuthUser } from "@/types";
import { useToast } from "@/components/ui/Toast";

export function useAuth() {
  const router = useRouter();
  const toast = useToast();
  const { token, user, isHydrated, setAuth, clearAuth } = useAuthStore();

  const login = async (email: string, password: string) => {
    const res = await authService.login(email, password);
    const { token: authToken, user: authUser } = res.data as { token: string; user: AuthUser };
    setAuth(authToken, authUser);
    return authUser;
  };

  // The backend has no /auth/logout route — the JWT is stateless (7-day
  // expiry, no server-side session to invalidate) — so logging out is purely
  // a client-side store clear + redirect.
  const logout = () => {
    clearAuth();
    toast.info("You have been logged out");
    router.replace("/login");
  };

  return { token, user, isHydrated, login, logout };
}

export { getErrorMessage };
