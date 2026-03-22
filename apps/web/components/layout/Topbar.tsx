"use client";

import React, { useRef, useEffect, useState } from "react";
import Link from "next/link";
import { Bell, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuthStore } from "@/stores/auth.store";
import { useNotificationStore } from "@/stores/notification.store";
import { useNotifications } from "@/hooks/useNotifications";
import { api } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface Notification { id: string; title: string; body: string; type: string; readAt: string | null; createdAt: string; }

export function Topbar({ title }: { title?: string }) {
  const [notifOpen, setNotifOpen] = useState(false);
  const { user } = useAuthStore();
  const { unreadCount } = useNotificationStore();
  const { data } = useNotifications(1);
  const queryClient = useQueryClient();
  const ref = useRef<HTMLDivElement>(null);

  const initials = user
    ? `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase() || user.email[0].toUpperCase()
    : "?";

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setNotifOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  async function markAllRead() {
    await api.patch("/notifications/read-all");
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
    queryClient.invalidateQueries({ queryKey: ["notifications-unread"] });
  }

  async function markRead(id: string) {
    await api.patch(`/notifications/${id}/read`);
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
    queryClient.invalidateQueries({ queryKey: ["notifications-unread"] });
  }

  const recent = data?.notifications?.slice(0, 6) ?? [];

  return (
    <header className="flex h-14 items-center justify-between gap-4 border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4 lg:px-6">
      {/* Left: page title (desktop only) */}
      <div className="hidden lg:flex items-center min-w-0">
        {title && <h1 className="text-base font-semibold text-[var(--color-fg)] truncate">{title}</h1>}
      </div>

      {/* Mobile spacer */}
      <div className="lg:hidden w-8" />

      {/* Right: actions */}
      <div className="flex items-center gap-2 ml-auto" ref={ref}>
        {/* Notification bell */}
        <div className="relative">
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className={cn(
              "relative flex h-8 w-8 items-center justify-center rounded-[var(--radius-md)] transition-colors",
              notifOpen
                ? "bg-[var(--color-brand-50)] text-[var(--color-brand-600)]"
                : "text-[var(--color-fg-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-fg)]",
            )}
            aria-label="Notifications"
          >
            <Bell className="h-4.5 w-4.5" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--color-brand-600)] px-1 text-[10px] font-bold text-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          <AnimatePresence>
            {notifOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.97, y: -8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97, y: -8 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-10 w-80 bg-[var(--color-surface)] rounded-[var(--radius-xl)] border border-[var(--color-border)] shadow-[var(--shadow-lg)] z-50 overflow-hidden"
              >
                <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)]">
                  <span className="text-sm font-semibold text-[var(--color-fg)]">Notifications</span>
                  {unreadCount > 0 && (
                    <button onClick={markAllRead} className="text-xs text-[var(--color-brand-600)] hover:underline font-medium">
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {recent.length === 0 ? (
                    <p className="py-8 text-center text-sm text-[var(--color-fg-subtle)]">No notifications yet</p>
                  ) : (
                    recent.map((n: Notification) => (
                      <button
                        key={n.id}
                        onClick={() => markRead(n.id)}
                        className={cn(
                          "w-full text-left px-4 py-3 hover:bg-[var(--color-surface-2)] transition-colors border-b border-[var(--color-border)] last:border-0",
                          !n.readAt && "bg-[var(--color-brand-50)]",
                        )}
                      >
                        <div className="flex items-start gap-2.5">
                          {!n.readAt && <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-brand-500)]" />}
                          <div className={cn(!n.readAt ? "" : "pl-4")}>
                            <p className="text-sm font-medium text-[var(--color-fg)]">{n.title}</p>
                            <p className="text-xs text-[var(--color-fg-muted)] mt-0.5 line-clamp-2">{n.body}</p>
                            <p className="text-xs text-[var(--color-fg-subtle)] mt-1">
                              {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
                <div className="border-t border-[var(--color-border)] px-4 py-2.5">
                  <Link href="/dashboard/notifications" onClick={() => setNotifOpen(false)} className="text-xs font-medium text-[var(--color-brand-600)] hover:underline">
                    View all notifications →
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Avatar */}
        <Avatar className="h-8 w-8 cursor-pointer">
          <AvatarFallback className="text-xs">{initials}</AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
