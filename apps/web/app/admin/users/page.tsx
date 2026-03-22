"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Search, Users, ShieldOff, ShieldCheck } from "lucide-react";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { useDebounce } from "@/hooks/useDebounce";

interface User {
  id: string; email: string; role: string; isActive: boolean; createdAt: string;
  patient?: { firstName: string; lastName: string };
  doctor?: { firstName: string; lastName: string; isVerified: boolean };
}

export default function AdminUsersPage() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const debouncedSearch = useDebounce(search, 350);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<{ users: User[]; total: number }>({
    queryKey: ["admin-users", debouncedSearch, roleFilter],
    queryFn: () => {
      const params = new URLSearchParams({ limit: "50" });
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (roleFilter) params.set("role", roleFilter);
      return api.get(`/admin/users?${params}`);
    },
  });

  const suspendMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      api.patch(`/admin/users/${id}/activate`, { isActive: active }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-users"] }),
  });

  const users = data?.users ?? [];

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl text-[var(--color-fg)]">User Management</h1>
        <p className="text-sm text-[var(--color-fg-muted)] mt-0.5">{data?.total ?? 0} total users</p>
      </div>

      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <div className="flex-1 max-w-sm">
          <Input placeholder="Search by name or email…" leftIcon={<Search className="h-4 w-4" />} value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        {["", "PATIENT", "DOCTOR", "ADMIN"].map((role) => (
          <button
            key={role}
            onClick={() => setRoleFilter(role)}
            className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
              roleFilter === role
                ? "bg-[var(--color-brand-600)] text-white border-[var(--color-brand-600)]"
                : "border-[var(--color-border)] text-[var(--color-fg-muted)] hover:border-[var(--color-brand-300)]"
            }`}
          >
            {role || "All"}
          </button>
        ))}
      </div>

      <div className="bg-[var(--color-surface)] rounded-[var(--radius-xl)] border border-[var(--color-border)] overflow-hidden max-w-5xl">
        {/* Table header */}
        <div className="grid grid-cols-[1fr_200px_100px_120px_100px] gap-4 px-4 py-3 border-b border-[var(--color-border)] bg-[var(--color-surface-2)]">
          <span className="text-xs font-semibold text-[var(--color-fg-subtle)] uppercase tracking-wide">User</span>
          <span className="text-xs font-semibold text-[var(--color-fg-subtle)] uppercase tracking-wide">Email</span>
          <span className="text-xs font-semibold text-[var(--color-fg-subtle)] uppercase tracking-wide">Role</span>
          <span className="text-xs font-semibold text-[var(--color-fg-subtle)] uppercase tracking-wide">Joined</span>
          <span className="text-xs font-semibold text-[var(--color-fg-subtle)] uppercase tracking-wide">Actions</span>
        </div>

        {isLoading ? (
          <div className="flex flex-col gap-0">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="px-4 py-3 border-b border-[var(--color-border)] last:border-0">
                <Skeleton className="h-10" />
              </div>
            ))}
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Users className="h-10 w-10 text-[var(--color-fg-subtle)] mb-3" />
            <p className="text-sm text-[var(--color-fg-muted)]">No users found</p>
          </div>
        ) : (
          users.map((u, i) => {
            const profile = u.doctor ?? u.patient;
            const name = profile ? `${profile.firstName} ${profile.lastName}` : "—";
            return (
              <motion.div
                key={u.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.02 }}
                className="grid grid-cols-[1fr_200px_100px_120px_100px] gap-4 items-center px-4 py-3 border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-surface-2)] transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand-100)] text-[var(--color-brand-700)] text-xs font-semibold">
                    {name[0]?.toUpperCase() ?? "?"}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[var(--color-fg)] truncate">{name}</p>
                    {!u.isActive && <span className="text-[10px] text-red-500 font-medium">Suspended</span>}
                  </div>
                </div>
                <p className="text-xs text-[var(--color-fg-muted)] truncate">{u.email}</p>
                <Badge variant={u.role === "DOCTOR" ? "default" : u.role === "ADMIN" ? "danger" : "neutral"} className="text-xs w-fit">
                  {u.role}
                </Badge>
                <p className="text-xs text-[var(--color-fg-subtle)]">{format(new Date(u.createdAt), "MMM d, yyyy")}</p>
                <Button
                  variant={u.isActive ? "secondary" : "outline"}
                  size="sm"
                  className="h-7 text-xs gap-1"
                  loading={suspendMutation.isPending}
                  onClick={() => suspendMutation.mutate({ id: u.id, active: !u.isActive })}
                >
                  {u.isActive
                    ? <><ShieldOff className="h-3 w-3" /> Suspend</>
                    : <><ShieldCheck className="h-3 w-3" /> Restore</>}
                </Button>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
