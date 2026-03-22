"use client";

import React from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Calendar, Users, CheckCircle2, Clock, ArrowRight, Video, MapPin,
  AlertCircle, Plus, TrendingUp
} from "lucide-react";
import { format, isToday } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/auth.store";

interface Appointment {
  id: string; scheduledAt: string; status: string; type: string; durationMinutes: number;
  patient: { firstName: string; lastName: string };
}

const STATUS_CONFIG = {
  PENDING:   { label: "Pending",   variant: "warning" as const },
  CONFIRMED: { label: "Confirmed", variant: "default" as const },
  COMPLETED: { label: "Completed", variant: "success" as const },
  CANCELLED: { label: "Cancelled", variant: "danger" as const },
  NO_SHOW:   { label: "No Show",   variant: "danger" as const },
};

function StatCard({ icon, label, value, href, color, subtext }: { icon: React.ReactNode; label: string; value: string | number; href: string; color: string; subtext?: string }) {
  return (
    <Link href={href}>
      <Card hover className="cursor-pointer">
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-[var(--color-fg-muted)]">{label}</p>
              <p className="mt-1.5 text-2xl font-semibold text-[var(--color-fg)]">{value}</p>
              {subtext && <p className="text-xs text-[var(--color-fg-subtle)] mt-0.5">{subtext}</p>}
            </div>
            <div className={`flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] ${color}`}>{icon}</div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function DoctorDashboard() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const { data: todayData, isLoading: todayLoading } = useQuery<{ appointments: Appointment[]; total: number }>({
    queryKey: ["doctor-today"],
    queryFn: () => {
      const today = new Date();
      const start = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
      const end = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59).toISOString();
      return api.get(`/appointments?dateFrom=${start}&dateTo=${end}&limit=20`);
    },
  });

  const { data: pendingData } = useQuery<{ appointments: Appointment[]; total: number }>({
    queryKey: ["doctor-pending"],
    queryFn: () => api.get("/appointments?status=PENDING&limit=20"),
  });

  const confirmMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/appointments/${id}/confirm`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["doctor-pending"] });
      queryClient.invalidateQueries({ queryKey: ["doctor-today"] });
    },
  });

  const todayAppts = todayData?.appointments ?? [];
  const pendingAppts = pendingData?.appointments ?? [];
  const confirmedToday = todayAppts.filter((a) => a.status === "CONFIRMED").length;
  const completedToday = todayAppts.filter((a) => a.status === "COMPLETED").length;

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="mb-7">
        <h1 className="font-display text-2xl text-[var(--color-fg)]">
          Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"}
          {user?.firstName ? `, Dr. ${user.firstName}` : ""}
        </h1>
        <p className="text-sm text-[var(--color-fg-muted)] mt-1">Here's your schedule for today.</p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-7">
        {[
          { icon: <Calendar className="h-5 w-5 text-[var(--color-brand-600)]" />, label: "Today", value: todayAppts.length, href: "/doctor/appointments", color: "bg-[var(--color-brand-50)]", subtext: "appointments" },
          { icon: <AlertCircle className="h-5 w-5 text-amber-600" />, label: "Pending", value: pendingData?.total ?? "—", href: "/doctor/appointments", color: "bg-amber-50", subtext: "need confirmation" },
          { icon: <CheckCircle2 className="h-5 w-5 text-emerald-600" />, label: "Completed", value: completedToday, href: "/doctor/appointments", color: "bg-emerald-50", subtext: "today" },
          { icon: <Users className="h-5 w-5 text-violet-600" />, label: "Patients", value: "—", href: "/doctor/patients", color: "bg-violet-50", subtext: "total" },
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.06 }}>
            <StatCard {...stat} />
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
        {/* Today's schedule */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Today's Schedule</CardTitle>
                <Link href="/doctor/appointments">
                  <Button variant="ghost" size="sm" className="text-[var(--color-brand-600)] gap-1">
                    View all <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {todayLoading ? (
                <div className="flex flex-col gap-3">{[1,2,3].map((i) => <Skeleton key={i} className="h-16" />)}</div>
              ) : todayAppts.length === 0 ? (
                <div className="py-10 text-center">
                  <Calendar className="h-8 w-8 text-[var(--color-fg-subtle)] mx-auto mb-3" />
                  <p className="text-sm font-medium text-[var(--color-fg)]">No appointments today</p>
                  <p className="text-xs text-[var(--color-fg-muted)] mt-1">Enjoy your day off</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {todayAppts.map((appt) => {
                    const cfg = STATUS_CONFIG[appt.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.PENDING;
                    const apptDate = new Date(appt.scheduledAt);
                    return (
                      <Link key={appt.id} href={`/doctor/appointments/${appt.id}`}>
                        <div className="flex items-center gap-4 rounded-[var(--radius-lg)] border border-[var(--color-border)] p-3.5 hover:border-[var(--color-brand-200)] hover:bg-[var(--color-brand-50)] transition-all duration-150 cursor-pointer">
                          <div className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-brand-100)] text-[var(--color-brand-700)]">
                            <span className="text-[10px] font-semibold uppercase leading-none">{format(apptDate, "h:mm")}</span>
                            <span className="text-xs font-bold leading-tight">{format(apptDate, "a")}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-[var(--color-fg)]">{appt.patient.firstName} {appt.patient.lastName}</p>
                            <p className="text-xs text-[var(--color-fg-muted)]">
                              {appt.durationMinutes} min ·{" "}
                              {appt.type === "VIDEO" ? <span className="inline-flex items-center gap-0.5"><Video className="h-3 w-3" /> Video</span> : <span className="inline-flex items-center gap-0.5"><MapPin className="h-3 w-3" /> In-person</span>}
                            </p>
                          </div>
                          <Badge variant={cfg.variant}>{cfg.label}</Badge>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Pending confirmations */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Pending Confirmations
                {pendingAppts.length > 0 && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-100 text-xs font-semibold text-amber-700">
                    {pendingAppts.length}
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pendingAppts.length === 0 ? (
                <div className="py-8 text-center">
                  <CheckCircle2 className="h-7 w-7 text-emerald-400 mx-auto mb-2" />
                  <p className="text-sm text-[var(--color-fg-muted)]">All caught up!</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {pendingAppts.slice(0, 5).map((appt) => (
                    <div key={appt.id} className="rounded-[var(--radius-lg)] border border-amber-200 bg-amber-50 p-3">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <p className="text-sm font-medium text-[var(--color-fg)]">{appt.patient.firstName} {appt.patient.lastName}</p>
                          <p className="text-xs text-[var(--color-fg-muted)]">
                            {format(new Date(appt.scheduledAt), "MMM d · h:mm a")} · {appt.durationMinutes}min
                          </p>
                        </div>
                        {appt.type === "VIDEO" ? <Video className="h-4 w-4 text-[var(--color-fg-subtle)] shrink-0 mt-0.5" /> : <MapPin className="h-4 w-4 text-[var(--color-fg-subtle)] shrink-0 mt-0.5" />}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="flex-1 h-7 text-xs"
                          loading={confirmMutation.isPending}
                          onClick={() => confirmMutation.mutate(appt.id)}
                        >
                          Confirm
                        </Button>
                        <Link href={`/doctor/appointments/${appt.id}`} className="flex-1">
                          <Button variant="secondary" size="sm" className="w-full h-7 text-xs">View</Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                  {pendingAppts.length > 5 && (
                    <Link href="/doctor/appointments">
                      <Button variant="ghost" size="sm" className="w-full text-[var(--color-fg-muted)]">
                        +{pendingAppts.length - 5} more
                      </Button>
                    </Link>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
