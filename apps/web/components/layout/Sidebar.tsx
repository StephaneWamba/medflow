"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity, LayoutDashboard, Calendar, FileText, Pill, MessageSquare,
  Bell, User, LogOut, Menu, X, Video, Clock, Users, Shield,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth.store";
import { useNotificationStore } from "@/stores/notification.store";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface NavItem {
  href: string;
  icon: React.ReactNode;
  label: string;
  badge?: number;
}

interface SidebarProps { items: NavItem[]; basePath: string; }

export function Sidebar({ items, basePath }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const { unreadCount } = useNotificationStore();
  const router = useRouter();

  // inject unread count into notifications item
  const enrichedItems = items.map((item) =>
    item.href.includes("notifications") ? { ...item, badge: unreadCount || undefined } : item,
  );

  function handleLogout() {
    logout();
    router.push("/");
  }

  const initials = user
    ? `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase() || user.email[0].toUpperCase()
    : "?";

  const sidebarContent = (isMobile = false) => (
    <div className={cn("flex h-full flex-col", collapsed && !isMobile && "items-center")}>
      {/* Logo */}
      <div className={cn("flex h-16 items-center border-b border-[var(--color-border)] px-4", collapsed && !isMobile && "justify-center px-2")}>
        <Link href={basePath} className="flex items-center gap-2.5 group">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-brand-600)]">
            <Activity className="h-4.5 w-4.5 text-white" strokeWidth={2.5} />
          </div>
          {(!collapsed || isMobile) && (
            <span className="text-base font-semibold text-[var(--color-fg)] tracking-tight">
              Med<span className="text-[var(--color-brand-600)]">Flow</span>
            </span>
          )}
        </Link>
        {!isMobile && (
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={cn("ml-auto p-1.5 rounded-[var(--radius-sm)] text-[var(--color-fg-subtle)] hover:text-[var(--color-fg)] hover:bg-[var(--color-surface-2)] transition-colors", collapsed && "ml-0 mt-0")}
          >
            <ChevronRight className={cn("h-4 w-4 transition-transform duration-200", !collapsed && "rotate-180")} />
          </button>
        )}
      </div>

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto py-4 px-2">
        <ul className="flex flex-col gap-0.5">
          {enrichedItems.map((item) => {
            const isActive = item.href === basePath
              ? pathname === basePath
              : pathname.startsWith(item.href);

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => isMobile && setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-2 text-sm font-medium transition-all duration-150",
                    isActive
                      ? "bg-[var(--color-brand-50)] text-[var(--color-brand-700)]"
                      : "text-[var(--color-fg-muted)] hover:text-[var(--color-fg)] hover:bg-[var(--color-surface-2)]",
                    collapsed && !isMobile && "justify-center px-2",
                  )}
                  title={collapsed && !isMobile ? item.label : undefined}
                >
                  <span className={cn("shrink-0", isActive && "text-[var(--color-brand-600)]")}>
                    {item.icon}
                  </span>
                  {(!collapsed || isMobile) && <span className="flex-1">{item.label}</span>}
                  {(!collapsed || isMobile) && item.badge && item.badge > 0 && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--color-brand-600)] px-1 text-[10px] font-bold text-white">
                      {item.badge > 99 ? "99+" : item.badge}
                    </span>
                  )}
                  {collapsed && !isMobile && item.badge && item.badge > 0 && (
                    <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-[var(--color-brand-600)]" />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User section */}
      <div className={cn("border-t border-[var(--color-border)] p-3", collapsed && !isMobile && "px-1")}>
        <div className={cn("flex items-center gap-3 rounded-[var(--radius-lg)] px-2 py-2.5", collapsed && !isMobile && "justify-center px-1")}>
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          {(!collapsed || isMobile) && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[var(--color-fg)] truncate">
                {user?.firstName ? `${user.firstName} ${user.lastName ?? ""}`.trim() : user?.email}
              </p>
              <p className="text-xs text-[var(--color-fg-subtle)] capitalize truncate">{user?.role?.toLowerCase()}</p>
            </div>
          )}
          {(!collapsed || isMobile) && (
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-[var(--radius-sm)] text-[var(--color-fg-subtle)] hover:text-[var(--color-danger)] hover:bg-red-50 transition-colors"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          )}
        </div>
        {collapsed && !isMobile && (
          <button
            onClick={handleLogout}
            className="mt-1 w-full flex justify-center p-2 rounded-[var(--radius-sm)] text-[var(--color-fg-subtle)] hover:text-[var(--color-danger)] hover:bg-red-50 transition-colors"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden lg:flex flex-col fixed left-0 top-0 h-full z-30 bg-[var(--color-surface)] border-r border-[var(--color-border)]",
          "transition-all duration-200",
          collapsed ? "w-[64px]" : "w-[240px]",
        )}
      >
        {sidebarContent()}
      </aside>

      {/* Mobile trigger */}
      <button
        className="fixed top-4 left-4 z-40 lg:hidden p-2 rounded-[var(--radius-md)] bg-[var(--color-surface)] border border-[var(--color-border)] shadow-[var(--shadow-sm)] text-[var(--color-fg-muted)] hover:text-[var(--color-fg)] transition-colors"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-30 bg-black/40 lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="fixed left-0 top-0 z-40 h-full w-[260px] bg-[var(--color-surface)] border-r border-[var(--color-border)] lg:hidden"
            >
              {sidebarContent(true)}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

/* ─── Patient nav items ──────────────────────────────────────────────────── */
export const PATIENT_NAV: NavItem[] = [
  { href: "/dashboard", icon: <LayoutDashboard className="h-4.5 w-4.5" />, label: "Dashboard" },
  { href: "/dashboard/appointments", icon: <Calendar className="h-4.5 w-4.5" />, label: "Appointments" },
  { href: "/dashboard/health-records", icon: <FileText className="h-4.5 w-4.5" />, label: "Health Records" },
  { href: "/dashboard/prescriptions", icon: <Pill className="h-4.5 w-4.5" />, label: "Prescriptions" },
  { href: "/dashboard/messages", icon: <MessageSquare className="h-4.5 w-4.5" />, label: "Messages" },
  { href: "/dashboard/notifications", icon: <Bell className="h-4.5 w-4.5" />, label: "Notifications" },
  { href: "/dashboard/profile", icon: <User className="h-4.5 w-4.5" />, label: "Profile" },
];

/* ─── Doctor nav items ───────────────────────────────────────────────────── */
export const DOCTOR_NAV: NavItem[] = [
  { href: "/doctor", icon: <LayoutDashboard className="h-4.5 w-4.5" />, label: "Dashboard" },
  { href: "/doctor/appointments", icon: <Calendar className="h-4.5 w-4.5" />, label: "Appointments" },
  { href: "/doctor/availability", icon: <Clock className="h-4.5 w-4.5" />, label: "Availability" },
  { href: "/doctor/health-records", icon: <FileText className="h-4.5 w-4.5" />, label: "Patient Records" },
  { href: "/doctor/prescriptions", icon: <Pill className="h-4.5 w-4.5" />, label: "Prescriptions" },
  { href: "/doctor/messages", icon: <MessageSquare className="h-4.5 w-4.5" />, label: "Messages" },
  { href: "/doctor/notifications", icon: <Bell className="h-4.5 w-4.5" />, label: "Notifications" },
  { href: "/doctor/profile", icon: <User className="h-4.5 w-4.5" />, label: "Profile" },
];

/* ─── Admin nav items ────────────────────────────────────────────────────── */
export const ADMIN_NAV: NavItem[] = [
  { href: "/admin", icon: <LayoutDashboard className="h-4.5 w-4.5" />, label: "Overview" },
  { href: "/admin/users", icon: <Users className="h-4.5 w-4.5" />, label: "Users" },
  { href: "/admin/doctors", icon: <Shield className="h-4.5 w-4.5" />, label: "Doctor Verification" },
  { href: "/admin/audit-logs", icon: <FileText className="h-4.5 w-4.5" />, label: "Audit Logs" },
];
