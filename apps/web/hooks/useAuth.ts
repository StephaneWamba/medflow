"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth.store";

export function useAuth() {
  return useAuthStore();
}

export function useRequireAuth(role?: "PATIENT" | "DOCTOR" | "ADMIN") {
  const { user, token, isLoaded } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded) return;
    if (!token || !user) {
      router.replace("/login");
      return;
    }
    if (role && user.role !== role) {
      // Redirect to the correct dashboard
      if (user.role === "PATIENT") router.replace("/dashboard");
      else if (user.role === "DOCTOR") router.replace("/doctor");
      else if (user.role === "ADMIN") router.replace("/admin");
    }
  }, [isLoaded, token, user, role, router]);

  return { user, token, isLoaded, isAuthenticated: !!token && !!user };
}
