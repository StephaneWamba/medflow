"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sidebar, PATIENT_NAV } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { useAuthStore } from "@/stores/auth.store";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, token, isLoaded } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded) return;
    if (!token || !user) { router.replace("/login"); return; }
    if (user.role === "DOCTOR") { router.replace("/doctor"); return; }
    if (user.role === "ADMIN") { router.replace("/admin"); return; }
  }, [isLoaded, token, user, router]);

  if (!isLoaded || !user) return null;

  return (
    <div className="flex min-h-dvh bg-[var(--color-canvas)]">
      <Sidebar items={PATIENT_NAV} basePath="/dashboard" />
      <div className="flex flex-1 flex-col lg:pl-[240px] transition-all duration-200">
        <Topbar />
        <main className="flex-1 p-4 lg:p-7">{children}</main>
      </div>
    </div>
  );
}
