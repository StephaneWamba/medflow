"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sidebar, ADMIN_NAV } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { useAuthStore } from "@/stores/auth.store";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, token, isLoaded } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded) return;
    if (!token || !user) { router.replace("/login"); return; }
    if (user.role !== "ADMIN") {
      router.replace(user.role === "DOCTOR" ? "/doctor" : "/dashboard");
    }
  }, [isLoaded, token, user, router]);

  if (!isLoaded || !user) return null;

  return (
    <div className="flex min-h-dvh bg-[var(--color-canvas)]">
      <Sidebar items={ADMIN_NAV} basePath="/admin" />
      <div className="flex flex-1 flex-col lg:pl-[240px] transition-all duration-200">
        <Topbar />
        <main className="flex-1 p-4 lg:p-7">{children}</main>
      </div>
    </div>
  );
}
