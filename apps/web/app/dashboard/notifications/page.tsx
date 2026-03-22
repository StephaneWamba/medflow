"use client";

import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Bell, CheckCheck } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

interface Notification { id: string; title: string; body: string; type: string; readAt: string | null; createdAt: string; }

const TYPE_COLORS: Record<string, string> = {
  appointment_confirmed: "bg-[var(--color-brand-100)] text-[var(--color-brand-700)]",
  appointment_cancelled: "bg-red-100 text-red-700",
  appointment_reminder: "bg-amber-100 text-amber-700",
  new_message: "bg-violet-100 text-violet-700",
  prescription_ready: "bg-emerald-100 text-emerald-700",
};

export default function NotificationsPage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<{ notifications: Notification[]; total: number }>({
    queryKey: ["notifications", 1],
    queryFn: () => api.get("/notifications?limit=50"),
  });

  const markAllMutation = useMutation({
    mutationFn: () => api.patch("/notifications/read-all", {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const markOneMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/notifications/${id}/read`, {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const notifications = data?.notifications ?? [];
  const unreadCount = notifications.filter((n) => !n.readAt).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl text-[var(--color-fg)]">Notifications</h1>
          {unreadCount > 0 && (
            <p className="text-sm text-[var(--color-fg-muted)] mt-0.5">{unreadCount} unread</p>
          )}
        </div>
        {unreadCount > 0 && (
          <Button variant="secondary" size="sm" className="gap-2" onClick={() => markAllMutation.mutate()} loading={markAllMutation.isPending}>
            <CheckCheck className="h-4 w-4" /> Mark all read
          </Button>
        )}
      </div>

      <div className="flex flex-col gap-2 max-w-2xl">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16" />)
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Bell className="h-10 w-10 text-[var(--color-fg-subtle)] mb-3" />
            <p className="font-medium text-[var(--color-fg)]">No notifications</p>
            <p className="text-sm text-[var(--color-fg-muted)] mt-1">You&apos;re all caught up!</p>
          </div>
        ) : (
          notifications.map((n, i) => (
            <motion.button
              key={n.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              onClick={() => { if (!n.readAt) markOneMutation.mutate(n.id); }}
              className={cn(
                "w-full flex items-start gap-4 text-left p-4 rounded-[var(--radius-xl)] border transition-all duration-150",
                !n.readAt
                  ? "bg-[var(--color-brand-50)] border-[var(--color-brand-200)] hover:border-[var(--color-brand-400)]"
                  : "bg-[var(--color-surface)] border-[var(--color-border)] hover:bg-[var(--color-surface-2)]",
              )}
            >
              <div className={cn("mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm", TYPE_COLORS[n.type] ?? "bg-[var(--color-surface-2)] text-[var(--color-fg-muted)]")}>
                <Bell className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn("text-sm font-medium", !n.readAt ? "text-[var(--color-fg)]" : "text-[var(--color-fg-muted)]")}>{n.title}</p>
                <p className="text-sm text-[var(--color-fg-muted)] mt-0.5 leading-relaxed">{n.body}</p>
                <p className="text-xs text-[var(--color-fg-subtle)] mt-1.5">{formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}</p>
              </div>
              {!n.readAt && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[var(--color-brand-500)]" />}
            </motion.button>
          ))
        )}
      </div>
    </div>
  );
}
