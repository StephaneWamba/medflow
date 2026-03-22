"use client";

import { create } from "zustand";

export interface AuthUser {
  id: string;
  email: string;
  role: "PATIENT" | "DOCTOR" | "ADMIN";
  emailVerified: boolean;
  profileId: string | null;
  firstName?: string;
  lastName?: string;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isLoaded: boolean;
  login: (token: string, user: AuthUser) => void;
  logout: () => void;
  hydrate: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoaded: false,

  hydrate: () => {
    if (typeof window === "undefined") return;
    try {
      const token = localStorage.getItem("medflow_token");
      const raw = localStorage.getItem("medflow_user");
      const user = raw ? (JSON.parse(raw) as AuthUser) : null;
      set({ token, user, isLoaded: true });
    } catch {
      set({ token: null, user: null, isLoaded: true });
    }
  },

  login: (token, user) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("medflow_token", token);
      localStorage.setItem("medflow_user", JSON.stringify(user));
    }
    set({ token, user, isLoaded: true });
  },

  logout: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("medflow_token");
      localStorage.removeItem("medflow_user");
    }
    set({ token: null, user: null });
  },
}));
