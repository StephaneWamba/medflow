"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Calendar, Video, MapPin, Clock, CheckCircle2, AlertCircle, Search } from "lucide-react";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { api } from "@/lib/api";

interface Appointment {
  id: string; scheduledAt: string; status: string; type: string; durationMinutes: number;
  patient: { firstName: string; lastName: string };
}

const TABS = [
  { label: "Upcoming", status: "CONFIRMED" },
  { label: "Pending",  status: "PENDING" },
  { label: "Past",     status: "COMPLETED" },
  { label: "Cancelled",status: "CANCELLED" },
];

const STATUS_CONFIG = {
  PENDING:   { label: "Pending",   variant: "warning" as const },
  CONFIRMED: { label: "Confirmed", variant: "default" as const },
  COMPLETED: { label: "Completed", variant: "success" as const },
  CANCELLED: { label: "Cancelled", variant: "danger" as const },
  NO_SHOW:   { label: "No Show",   variant: "danger" as const },
};

export default function DoctorAppointmentsPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<{ appointments: Appointment[]; total: number }>({
    queryKey: ["doctor-appointments", TABS[activeTab].status],
    queryFn: () => api.get(`/appointments?status=${TABS[activeTab].status}&limit=50`),
  });

  const confirmMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/appointments/${id}/confirm`, {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["doctor-appointments"] }),
  });

  const appointments = (data?.appointments ?? []).filter((a) =>
    !search ||
    `${a.patient.firstName} ${a.patient.lastName}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl text-[var(--color-fg)]">Appointments</h1>
        <p className="text-sm text-[var(--color-fg-muted)] mt-0.5">Manage your patient consultations</p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-5 border-b border-[var(--color-border)]">
        {TABS.map((tab, i) => (
          <button
            key={tab.label}
            onClick={() => setActiveTab(i)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors relative -mb-px ${
              activeTab === i
                ? "text-[var(--color-brand-600)] border-b-2 border-[var(--color-brand-500)]"
                : "text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mb-4 max-w-sm">
        <Input placeholder="Search patients…" leftIcon={<Search className="h-4 w-4" />} value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="flex flex-col gap-3 max-w-2xl">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20" />)
        ) : appointments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Calendar className="h-10 w-10 text-[var(--color-fg-subtle)] mb-3" />
            <p className="font-medium text-[var(--color-fg)]">No {TABS[activeTab].label.toLowerCase()} appointments</p>
          </div>
        ) : (
          appointments.map((appt, i) => {
            const cfg = STATUS_CONFIG[appt.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.PENDING;
            const apptDate = new Date(appt.scheduledAt);
            return (
              <motion.div key={appt.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                <Card hover className="cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-brand-100)] text-[var(--color-brand-700)]">
                        <span className="text-[10px] font-semibold uppercase leading-none">{format(apptDate, "MMM")}</span>
                        <span className="text-lg font-bold leading-tight">{format(apptDate, "d")}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <Link href={`/doctor/appointments/${appt.id}`}>
                          <p className="text-sm font-semibold text-[var(--color-fg)] hover:text-[var(--color-brand-600)] transition-colors">
                            {appt.patient.firstName} {appt.patient.lastName}
                          </p>
                        </Link>
                        <p className="text-xs text-[var(--color-fg-muted)] flex items-center gap-2 mt-0.5">
                          <Clock className="h-3 w-3" />
                          {format(apptDate, "h:mm a")} · {appt.durationMinutes} min ·{" "}
                          {appt.type === "VIDEO" ? <><Video className="h-3 w-3" /> Video</> : <><MapPin className="h-3 w-3" /> In-person</>}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge variant={cfg.variant}>{cfg.label}</Badge>
                        {appt.status === "PENDING" && (
                          <Button size="sm" className="h-7 text-xs" loading={confirmMutation.isPending} onClick={() => confirmMutation.mutate(appt.id)}>
                            Confirm
                          </Button>
                        )}
                        {appt.status === "CONFIRMED" && appt.type === "VIDEO" && (
                          <Link href={`/doctor/video/${appt.id}`}>
                            <Button size="sm" className="h-7 text-xs gap-1">
                              <Video className="h-3 w-3" /> Join
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
