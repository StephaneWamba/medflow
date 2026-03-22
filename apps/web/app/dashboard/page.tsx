"use client";

import React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Calendar, FileText, Pill, Video, ArrowRight, Clock, CheckCircle2, AlertCircle, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/auth.store";
import { format, isToday, isFuture } from "date-fns";

interface Appointment {
  id: string; scheduledAt: string; status: string; type: string;
  durationMinutes: number;
  doctor: { firstName: string; lastName: string; specialty: string };
}
interface Prescription {
  id: string; medicationName: string; status: string; createdAt: string;
  doctor: { firstName: string; lastName: string };
}

const STATUS_CONFIG = {
  PENDING:   { label: "Pending",   variant: "warning" as const,  icon: <Clock className="h-3 w-3" /> },
  CONFIRMED: { label: "Confirmed", variant: "default" as const,  icon: <CheckCircle2 className="h-3 w-3" /> },
  CANCELLED: { label: "Cancelled", variant: "danger" as const,   icon: <AlertCircle className="h-3 w-3" /> },
  COMPLETED: { label: "Completed", variant: "success" as const,  icon: <CheckCircle2 className="h-3 w-3" /> },
  NO_SHOW:   { label: "No Show",   variant: "danger" as const,   icon: <AlertCircle className="h-3 w-3" /> },
};

function StatCard({ icon, label, value, href, color }: { icon: React.ReactNode; label: string; value: string | number; href: string; color: string }) {
  return (
    <Link href={href}>
      <Card hover className="cursor-pointer">
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-[var(--color-fg-muted)]">{label}</p>
              <p className="mt-1.5 text-2xl font-semibold text-[var(--color-fg)]">{value}</p>
            </div>
            <div className={`flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] ${color}`}>
              {icon}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function PatientDashboard() {
  const { user } = useAuthStore();

  const { data: apptData, isLoading: apptLoading } = useQuery<{ appointments: Appointment[]; total: number }>({
    queryKey: ["appointments", "upcoming"],
    queryFn: () => api.get("/appointments?status=CONFIRMED&limit=5"),
  });

  const { data: rxData } = useQuery<{ prescriptions: Prescription[]; total: number }>({
    queryKey: ["prescriptions", "recent"],
    queryFn: () => api.get("/prescriptions?limit=5"),
  });

  const upcomingAppts = apptData?.appointments ?? [];
  const todayAppts = upcomingAppts.filter((a) => isToday(new Date(a.scheduledAt)));
  const nextAppt = upcomingAppts.find((a) => isFuture(new Date(a.scheduledAt)));

  return (
    <div>
      {/* Greeting */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="mb-7">
        <h1 className="font-display text-2xl text-[var(--color-fg)]">
          Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"}
          {user?.firstName ? `, ${user.firstName}` : ""}
        </h1>
        <p className="text-sm text-[var(--color-fg-muted)] mt-1">Here&apos;s your health overview for today.</p>
      </motion.div>

      {/* Today's appointment banner */}
      {todayAppts.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="mb-6 flex items-center justify-between rounded-[var(--radius-xl)] border border-[var(--color-brand-200)] bg-[var(--color-brand-50)] p-4 pr-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-brand-100)]">
                <Video className="h-5 w-5 text-[var(--color-brand-600)]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--color-brand-800)]">You have {todayAppts.length} appointment{todayAppts.length > 1 ? "s" : ""} today</p>
                <p className="text-xs text-[var(--color-brand-600)]">
                  Next: Dr. {todayAppts[0].doctor.lastName} at {format(new Date(todayAppts[0].scheduledAt), "h:mm a")}
                </p>
              </div>
            </div>
            <Link href={`/dashboard/appointments/${todayAppts[0].id}`}>
              <Button size="sm" className="gap-1.5">Join <ArrowRight className="h-3.5 w-3.5" /></Button>
            </Link>
          </div>
        </motion.div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-7">
        {[
          { icon: <Calendar className="h-5 w-5 text-[var(--color-brand-600)]" />, label: "Upcoming", value: apptData?.total ?? "—", href: "/dashboard/appointments", color: "bg-[var(--color-brand-50)]" },
          { icon: <FileText className="h-5 w-5 text-emerald-600" />, label: "Health Records", value: "—", href: "/dashboard/health-records", color: "bg-emerald-50" },
          { icon: <Pill className="h-5 w-5 text-amber-600" />, label: "Prescriptions", value: rxData?.total ?? "—", href: "/dashboard/prescriptions", color: "bg-amber-50" },
          { icon: <Video className="h-5 w-5 text-violet-600" />, label: "Consultations", value: "—", href: "/dashboard/appointments", color: "bg-violet-50" },
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.06 }}>
            <StatCard {...stat} />
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px]">
        {/* Upcoming appointments */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Upcoming Appointments</CardTitle>
                <Link href="/dashboard/appointments">
                  <Button variant="ghost" size="sm" className="text-[var(--color-brand-600)] gap-1">
                    View all <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {apptLoading ? (
                <div className="flex flex-col gap-3">
                  {[1,2,3].map((i) => <Skeleton key={i} className="h-16" />)}
                </div>
              ) : upcomingAppts.length === 0 ? (
                <div className="py-10 text-center">
                  <Calendar className="h-8 w-8 text-[var(--color-fg-subtle)] mx-auto mb-3" />
                  <p className="text-sm font-medium text-[var(--color-fg)]">No upcoming appointments</p>
                  <p className="text-xs text-[var(--color-fg-muted)] mt-1 mb-4">Book a consultation with a licensed doctor</p>
                  <Link href="/doctors">
                    <Button size="sm" className="gap-1.5"><Plus className="h-4 w-4" /> Book appointment</Button>
                  </Link>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {upcomingAppts.map((appt) => {
                    const cfg = STATUS_CONFIG[appt.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.PENDING;
                    const apptDate = new Date(appt.scheduledAt);
                    return (
                      <Link key={appt.id} href={`/dashboard/appointments/${appt.id}`}>
                        <div className="flex items-center gap-4 rounded-[var(--radius-lg)] border border-[var(--color-border)] p-3.5 hover:border-[var(--color-brand-200)] hover:bg-[var(--color-brand-50)] transition-all duration-150 cursor-pointer">
                          <div className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-brand-100)] text-[var(--color-brand-700)]">
                            <span className="text-[10px] font-semibold uppercase leading-none">{format(apptDate, "MMM")}</span>
                            <span className="text-lg font-bold leading-tight">{format(apptDate, "d")}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-[var(--color-fg)]">Dr. {appt.doctor.firstName} {appt.doctor.lastName}</p>
                            <p className="text-xs text-[var(--color-fg-muted)]">{appt.doctor.specialty} · {format(apptDate, "h:mm a")}</p>
                          </div>
                          <div className="flex flex-col items-end gap-1.5">
                            <Badge variant={cfg.variant} className="flex items-center gap-1">{cfg.icon} {cfg.label}</Badge>
                            {appt.type === "VIDEO" && <span className="flex items-center gap-1 text-xs text-[var(--color-fg-subtle)]"><Video className="h-3 w-3" /> Video</span>}
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent prescriptions */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Recent Prescriptions</CardTitle>
                <Link href="/dashboard/prescriptions">
                  <Button variant="ghost" size="sm" className="text-[var(--color-brand-600)] gap-1">View all <ArrowRight className="h-3.5 w-3.5" /></Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {!rxData?.prescriptions || rxData.prescriptions.length === 0 ? (
                <div className="py-10 text-center">
                  <Pill className="h-8 w-8 text-[var(--color-fg-subtle)] mx-auto mb-3" />
                  <p className="text-sm font-medium text-[var(--color-fg)]">No prescriptions yet</p>
                  <p className="text-xs text-[var(--color-fg-muted)] mt-1">Prescriptions appear after a consultation</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {rxData.prescriptions.map((rx) => (
                    <div key={rx.id} className="flex items-center gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] p-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-50">
                        <Pill className="h-4 w-4 text-amber-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[var(--color-fg)] truncate">{rx.medicationName}</p>
                        <p className="text-xs text-[var(--color-fg-muted)]">Dr. {rx.doctor.lastName} · {format(new Date(rx.createdAt), "MMM d")}</p>
                      </div>
                      <Badge variant={rx.status === "ACTIVE" ? "success" : "neutral"}>{rx.status}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
