"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Calendar, Video, MapPin, Clock, CheckCircle2, AlertCircle, Plus, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

interface Appointment {
  id: string; scheduledAt: string; status: string; type: string; durationMinutes: number;
  chiefComplaint?: string; cancelReason?: string;
  doctor: { id: string; firstName: string; lastName: string; specialty: string; profileImageUrl?: string };
}

const STATUS_CONFIG = {
  PENDING:   { label:"Pending",   variant:"warning" as const,  icon:<Clock className="h-3.5 w-3.5" /> },
  CONFIRMED: { label:"Confirmed", variant:"default" as const,  icon:<CheckCircle2 className="h-3.5 w-3.5" /> },
  CANCELLED: { label:"Cancelled", variant:"danger" as const,   icon:<AlertCircle className="h-3.5 w-3.5" /> },
  COMPLETED: { label:"Completed", variant:"success" as const,  icon:<CheckCircle2 className="h-3.5 w-3.5" /> },
  NO_SHOW:   { label:"No Show",   variant:"danger" as const,   icon:<AlertCircle className="h-3.5 w-3.5" /> },
};

function AppointmentRow({ appt, index }: { appt: Appointment; index: number }) {
  const cfg = STATUS_CONFIG[appt.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.PENDING;
  const date = new Date(appt.scheduledAt);
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
      <Link href={`/dashboard/appointments/${appt.id}`}>
        <div className="flex items-start gap-4 p-4 rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-brand-200)] hover:shadow-[var(--shadow-sm)] transition-all duration-150 cursor-pointer">
          {/* Date block */}
          <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-[var(--radius-lg)] bg-[var(--color-brand-50)] text-[var(--color-brand-700)]">
            <span className="text-[10px] font-semibold uppercase">{format(date, "MMM")}</span>
            <span className="text-xl font-bold leading-tight">{format(date, "d")}</span>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-0.5">
              <span className="text-sm font-semibold text-[var(--color-fg)]">Dr. {appt.doctor.firstName} {appt.doctor.lastName}</span>
              <Badge variant={cfg.variant} className="flex items-center gap-1">{cfg.icon} {cfg.label}</Badge>
            </div>
            <p className="text-xs text-[var(--color-fg-muted)]">{appt.doctor.specialty}</p>
            <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-[var(--color-fg-subtle)]">
              <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{format(date, "h:mm a")}</span>
              <span className="flex items-center gap-1">
                {appt.type === "VIDEO" ? <Video className="h-3 w-3" /> : <MapPin className="h-3 w-3" />}
                {appt.type === "VIDEO" ? "Video" : "In-person"}
              </span>
              <span>{appt.durationMinutes} min</span>
            </div>
          </div>

          {/* Action */}
          <div className="shrink-0 flex items-center gap-1.5 text-[var(--color-brand-600)] text-xs font-medium">
            View <ArrowRight className="h-3.5 w-3.5" />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export default function AppointmentsPage() {
  const [tab, setTab] = useState("upcoming");
  const statusMap: Record<string, string> = {
    upcoming: "CONFIRMED", pending: "PENDING", past: "COMPLETED", cancelled: "CANCELLED",
  };

  const { data, isLoading } = useQuery<{ appointments: Appointment[]; total: number }>({
    queryKey: ["appointments-list", tab],
    queryFn: () => api.get(`/appointments?status=${statusMap[tab]}&limit=20`),
  });

  const appts = data?.appointments ?? [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl text-[var(--color-fg)]">Appointments</h1>
          <p className="text-sm text-[var(--color-fg-muted)] mt-0.5">Manage your consultations</p>
        </div>
        <Link href="/doctors">
          <Button size="md" className="gap-2"><Plus className="h-4 w-4" /> Book new</Button>
        </Link>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-5">
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="past">Past</TabsTrigger>
          <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
        </TabsList>

        {["upcoming","pending","past","cancelled"].map((t) => (
          <TabsContent key={t} value={t}>
            {isLoading ? (
              <div className="flex flex-col gap-3">
                {[1,2,3].map((i) => <Skeleton key={i} className="h-20" />)}
              </div>
            ) : appts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Calendar className="h-10 w-10 text-[var(--color-fg-subtle)] mb-3" />
                <p className="font-medium text-[var(--color-fg)]">No {t} appointments</p>
                <p className="text-sm text-[var(--color-fg-muted)] mt-1 mb-5">
                  {t === "upcoming" ? "Book a consultation to get started" : "Nothing here yet"}
                </p>
                {t === "upcoming" && (
                  <Link href="/doctors"><Button size="sm" className="gap-1.5"><Plus className="h-4 w-4" /> Book appointment</Button></Link>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {appts.map((a, i) => <AppointmentRow key={a.id} appt={a} index={i} />)}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
