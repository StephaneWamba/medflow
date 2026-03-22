"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Search, Shield, Clock, User, ChevronDown } from "lucide-react";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { useDebounce } from "@/hooks/useDebounce";

interface AuditLog {
  id: string; action: string; resourceType: string; resourceId?: string;
  metadata?: Record<string, unknown>; createdAt: string;
  user?: { email: string; patient?: { firstName: string; lastName: string }; doctor?: { firstName: string; lastName: string } };
}

const ACTION_COLORS: Record<string, "default" | "success" | "danger" | "warning" | "neutral"> = {
  LOGIN: "success", LOGOUT: "neutral", REGISTER: "success",
  CREATE: "success", UPDATE: "warning", DELETE: "danger",
  VERIFY: "success", SUSPEND: "danger", RESTORE: "success",
};

export default function AdminAuditLogsPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const debouncedSearch = useDebounce(search, 350);
  const LIMIT = 30;

  const { data, isLoading } = useQuery<{ logs: AuditLog[]; total: number }>({
    queryKey: ["audit-logs", debouncedSearch, page],
    queryFn: () => {
      const params = new URLSearchParams({ limit: String(LIMIT), offset: String(page * LIMIT) });
      if (debouncedSearch) params.set("action", debouncedSearch);
      return api.get(`/admin/audit-logs?${params}`);
    },
  });

  const logs = data?.logs ?? [];
  const totalPages = Math.ceil((data?.total ?? 0) / LIMIT);

  function getActionVariant(action: string) {
    for (const [key, variant] of Object.entries(ACTION_COLORS)) {
      if (action.includes(key)) return variant;
    }
    return "neutral" as const;
  }

  function getUserName(log: AuditLog) {
    if (!log.user) return "System";
    const profile = log.user.doctor ?? log.user.patient;
    return profile ? `${profile.firstName} ${profile.lastName}` : log.user.email;
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl text-[var(--color-fg)]">Audit Logs</h1>
        <p className="text-sm text-[var(--color-fg-muted)] mt-0.5">{data?.total ?? 0} total events</p>
      </div>

      <div className="mb-5 max-w-sm">
        <Input placeholder="Filter by action…" leftIcon={<Search className="h-4 w-4" />} value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} />
      </div>

      <div className="bg-[var(--color-surface)] rounded-[var(--radius-xl)] border border-[var(--color-border)] overflow-hidden max-w-5xl">
        <div className="grid grid-cols-[140px_1fr_160px_180px] gap-4 px-4 py-3 border-b border-[var(--color-border)] bg-[var(--color-surface-2)]">
          {["Action", "Resource", "User", "Time"].map((h) => (
            <span key={h} className="text-xs font-semibold text-[var(--color-fg-subtle)] uppercase tracking-wide">{h}</span>
          ))}
        </div>

        {isLoading ? (
          <div className="flex flex-col">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="px-4 py-3 border-b border-[var(--color-border)] last:border-0">
                <Skeleton className="h-8" />
              </div>
            ))}
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Shield className="h-10 w-10 text-[var(--color-fg-subtle)] mb-3" />
            <p className="text-sm text-[var(--color-fg-muted)]">No audit logs found</p>
          </div>
        ) : (
          logs.map((log, i) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.01 }}
              className="grid grid-cols-[140px_1fr_160px_180px] gap-4 items-center px-4 py-3 border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-surface-2)] transition-colors"
            >
              <Badge variant={getActionVariant(log.action)} className="text-xs w-fit truncate">
                {log.action}
              </Badge>
              <div className="min-w-0">
                <p className="text-sm text-[var(--color-fg)] truncate">{log.resourceType}</p>
                {log.resourceId && <p className="text-xs text-[var(--color-fg-subtle)] font-mono truncate">{log.resourceId}</p>}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-[var(--color-fg-muted)] min-w-0">
                <User className="h-3 w-3 shrink-0" />
                <span className="truncate">{getUserName(log)}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-[var(--color-fg-subtle)]">
                <Clock className="h-3 w-3 shrink-0" />
                {format(new Date(log.createdAt), "MMM d, h:mm a")}
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center gap-2 mt-4">
          <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}>Previous</Button>
          <span className="text-sm text-[var(--color-fg-muted)]">Page {page + 1} of {totalPages}</span>
          <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}>Next</Button>
        </div>
      )}
    </div>
  );
}
