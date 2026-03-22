"use client";

import React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Users, UserCheck, Calendar, TrendingUp, ArrowRight, Shield, Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { format } from "date-fns";

interface AdminStatsRaw {
  users: { _count: { _all: number }; role: string }[];
  appointments: { _count: { _all: number }; status: string }[];
  prescriptions: { _count: { _all: number }; status: string }[];
  pendingDoctors: number;
}

interface AdminStats {
  totalUsers: number;
  totalPatients: number;
  totalDoctors: number;
  totalAppointments: number;
  pendingDoctorVerifications: number;
  appointmentsToday: number;
}

function parseStats(raw: AdminStatsRaw): AdminStats {
  const byRole = Object.fromEntries(raw.users.map((u) => [u.role, u._count._all]));
  const totalAppointments = raw.appointments.reduce((s, a) => s + a._count._all, 0);
  return {
    totalUsers: Object.values(byRole).reduce((a, b) => a + b, 0),
    totalPatients: byRole.PATIENT ?? 0,
    totalDoctors: byRole.DOCTOR ?? 0,
    totalAppointments,
    pendingDoctorVerifications: raw.pendingDoctors,
    appointmentsToday: 0, // not in API response
  };
}

interface RecentUser {
  id: string; email: string; role: string; createdAt: string;
  patient?: { firstName: string; lastName: string };
  doctor?: { firstName: string; lastName: string };
}

function StatCard({ icon, label, value, href, color, badge }: { icon: React.ReactNode; label: string; value: string | number; href: string; color: string; badge?: number }) {
  return (
    <Link href={href}>
      <Card hover className="cursor-pointer">
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-[var(--color-fg-muted)]">{label}</p>
              <p className="mt-1.5 text-2xl font-semibold text-[var(--color-fg)]">{value}</p>
            </div>
            <div className="relative">
              <div className={`flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] ${color}`}>{icon}</div>
              {badge != null && badge > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">{badge}</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function AdminDashboard() {
  const { data: rawStats, isLoading: statsLoading } = useQuery<AdminStatsRaw>({
    queryKey: ["admin-stats"],
    queryFn: () => api.get("/admin/stats"),
  });
  const stats = rawStats ? parseStats(rawStats) : undefined;

  const { data: usersData } = useQuery<{ users: RecentUser[]; total: number }>({
    queryKey: ["admin-recent-users"],
    queryFn: () => api.get("/admin/users?limit=8&sortBy=createdAt&order=desc"),
  });

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-7">
        <h1 className="font-display text-2xl text-[var(--color-fg)]">Admin Overview</h1>
        <p className="text-sm text-[var(--color-fg-muted)] mt-1">Platform health and management</p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 mb-7">
        {statsLoading ? (
          Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24" />)
        ) : (
          <>
            {[
              { icon: <Users className="h-5 w-5 text-[var(--color-brand-600)]" />, label: "Total Users", value: stats?.totalUsers ?? 0, href: "/admin/users", color: "bg-[var(--color-brand-50)]" },
              { icon: <Activity className="h-5 w-5 text-emerald-600" />, label: "Patients", value: stats?.totalPatients ?? 0, href: "/admin/users", color: "bg-emerald-50" },
              { icon: <UserCheck className="h-5 w-5 text-violet-600" />, label: "Doctors", value: stats?.totalDoctors ?? 0, href: "/admin/doctors", color: "bg-violet-50", badge: stats?.pendingDoctorVerifications },
              { icon: <Calendar className="h-5 w-5 text-amber-600" />, label: "Appointments", value: stats?.totalAppointments ?? 0, href: "/admin/users", color: "bg-amber-50" },
              { icon: <TrendingUp className="h-5 w-5 text-rose-600" />, label: "Today", value: stats?.appointmentsToday ?? 0, href: "/admin/users", color: "bg-rose-50" },
              { icon: <Shield className="h-5 w-5 text-slate-600" />, label: "Pending Verifications", value: stats?.pendingDoctorVerifications ?? 0, href: "/admin/doctors", color: "bg-slate-50", badge: stats?.pendingDoctorVerifications },
            ].map((stat, i) => (
              <motion.div key={stat.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 + i * 0.05 }}>
                <StatCard {...stat} />
              </motion.div>
            ))}
          </>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 max-w-5xl">
        {/* Recent signups */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Recent Signups</CardTitle>
                <Link href="/admin/users">
                  <span className="text-xs text-[var(--color-brand-600)] hover:underline flex items-center gap-1">
                    View all <ArrowRight className="h-3 w-3" />
                  </span>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {!usersData ? (
                <div className="flex flex-col gap-2">{[1,2,3].map(i => <Skeleton key={i} className="h-12" />)}</div>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {usersData.users.map((u) => {
                    const profile = u.doctor ?? u.patient;
                    const name = profile ? `${profile.firstName} ${profile.lastName}` : u.email;
                    return (
                      <div key={u.id} className="flex items-center gap-3 p-2.5 rounded-[var(--radius-md)] hover:bg-[var(--color-surface-2)] transition-colors">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand-100)] text-[var(--color-brand-700)] text-xs font-semibold">
                          {name[0]?.toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[var(--color-fg)] truncate">{name}</p>
                          <p className="text-xs text-[var(--color-fg-subtle)]">{u.email}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <Badge variant={u.role === "DOCTOR" ? "default" : u.role === "ADMIN" ? "danger" : "neutral"} className="text-[10px] px-1.5 py-0">
                            {u.role}
                          </Badge>
                          <span className="text-[10px] text-[var(--color-fg-subtle)]">{format(new Date(u.createdAt), "MMM d")}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick actions */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
          <Card>
            <CardHeader><CardTitle>Quick Actions</CardTitle></CardHeader>
            <CardContent>
              <div className="flex flex-col gap-2">
                {[
                  { href: "/admin/doctors", label: "Doctor verification queue", desc: `${stats?.pendingDoctorVerifications ?? 0} pending`, icon: <UserCheck className="h-5 w-5 text-violet-600" />, color: "bg-violet-50" },
                  { href: "/admin/users", label: "User management", desc: "Search, view, suspend users", icon: <Users className="h-5 w-5 text-[var(--color-brand-600)]" />, color: "bg-[var(--color-brand-50)]" },
                  { href: "/admin/audit-logs", label: "Audit logs", desc: "Review all system events", icon: <Shield className="h-5 w-5 text-slate-600" />, color: "bg-slate-50" },
                ].map((action) => (
                  <Link key={action.href} href={action.href}>
                    <div className="flex items-center gap-3.5 rounded-[var(--radius-lg)] border border-[var(--color-border)] p-3.5 hover:border-[var(--color-brand-200)] hover:bg-[var(--color-brand-50)] transition-all duration-150 cursor-pointer">
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] ${action.color}`}>
                        {action.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[var(--color-fg)]">{action.label}</p>
                        <p className="text-xs text-[var(--color-fg-muted)]">{action.desc}</p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-[var(--color-fg-subtle)] shrink-0" />
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
