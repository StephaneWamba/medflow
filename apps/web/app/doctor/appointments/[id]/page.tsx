"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  ChevronLeft, Video, MapPin, Clock, Calendar, User, FileText,
  CheckCircle2, X, Stethoscope, ClipboardList
} from "lucide-react";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { api, ApiError } from "@/lib/api";

interface AppointmentDetail {
  id: string; scheduledAt: string; status: string; type: string; durationMinutes: number;
  chiefComplaint?: string; cancelReason?: string; notes?: string;
  doctor: { id: string; firstName: string; lastName: string; specialty: string };
  patient: { id: string; firstName: string; lastName: string };
}

const STATUS_MAP = {
  PENDING:   { label: "Pending",   class: "bg-amber-50 text-amber-700 border-amber-200" },
  CONFIRMED: { label: "Confirmed", class: "bg-[var(--color-brand-50)] text-[var(--color-brand-700)] border-[var(--color-brand-200)]" },
  CANCELLED: { label: "Cancelled", class: "bg-red-50 text-red-700 border-red-200" },
  COMPLETED: { label: "Completed", class: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  NO_SHOW:   { label: "No Show",   class: "bg-red-50 text-red-700 border-red-200" },
};

export default function DoctorAppointmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [cancelling, setCancelling] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const { register, handleSubmit, getValues } = useForm<{ notes: string }>();

  const { data: appt, isLoading } = useQuery<AppointmentDetail>({
    queryKey: ["doctor-appointment", id],
    queryFn: () => api.get(`/appointments/${id}`),
  });

  const confirmMutation = useMutation({
    mutationFn: () => api.patch(`/appointments/${id}/confirm`, {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["doctor-appointment", id] }),
  });

  const completeMutation = useMutation({
    mutationFn: (notes: string) => api.patch(`/appointments/${id}/complete`, { notes }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["doctor-appointment", id] }),
  });

  const cancelMutation = useMutation({
    mutationFn: () => api.patch(`/appointments/${id}/cancel`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["doctor-appointment", id] });
      setCancelling(false);
    },
  });

  async function joinVideo() {
    try {
      const { token, roomName } = await api.get<{ token: string; roomName: string }>(`/appointments/${id}/video-token`);
      localStorage.setItem("lk_token", token);
      localStorage.setItem("lk_room", roomName);
      router.push(`/doctor/video/${id}`);
    } catch {}
  }

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto">
        <Skeleton className="h-5 w-28 mb-8" />
        <Skeleton className="h-52 rounded-[var(--radius-xl)]" />
      </div>
    );
  }
  if (!appt) return <div className="text-center py-20 text-[var(--color-fg-muted)]">Appointment not found.</div>;

  const statusCfg = STATUS_MAP[appt.status as keyof typeof STATUS_MAP] ?? STATUS_MAP.PENDING;
  const date = new Date(appt.scheduledAt);
  const canConfirm = appt.status === "PENDING";
  const canComplete = appt.status === "CONFIRMED";
  const canCancel = ["PENDING", "CONFIRMED"].includes(appt.status);
  const canJoin = appt.status === "CONFIRMED" && appt.type === "VIDEO";

  return (
    <div className="max-w-2xl mx-auto">
      <Link href="/doctor/appointments" className="inline-flex items-center gap-1.5 text-sm text-[var(--color-fg-muted)] hover:text-[var(--color-fg)] mb-6 transition-colors">
        <ChevronLeft className="h-4 w-4" /> Back to appointments
      </Link>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="flex flex-col gap-5">
        {/* Header */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--color-surface-2)] border border-[var(--color-border)]">
                  <User className="h-6 w-6 text-[var(--color-fg-muted)]" />
                </div>
                <div>
                  <h1 className="font-display text-xl text-[var(--color-fg)]">
                    {appt.patient.firstName} {appt.patient.lastName}
                  </h1>
                  <Link href={`/doctor/patients`} className="text-sm text-[var(--color-brand-600)] hover:underline mt-0.5 inline-block">
                    View patient profile
                  </Link>
                </div>
              </div>
              <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${statusCfg.class}`}>
                {statusCfg.label}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2.5 text-[var(--color-fg-muted)]">
                <Calendar className="h-4 w-4 text-[var(--color-brand-500)] shrink-0" />
                {format(date, "EEEE, MMMM d, yyyy")}
              </div>
              <div className="flex items-center gap-2.5 text-[var(--color-fg-muted)]">
                <Clock className="h-4 w-4 text-[var(--color-brand-500)] shrink-0" />
                {format(date, "h:mm a")} ({appt.durationMinutes} min)
              </div>
              <div className="flex items-center gap-2.5 text-[var(--color-fg-muted)]">
                {appt.type === "VIDEO"
                  ? <Video className="h-4 w-4 text-[var(--color-brand-500)] shrink-0" />
                  : <MapPin className="h-4 w-4 text-[var(--color-brand-500)] shrink-0" />}
                {appt.type === "VIDEO" ? "Video consultation" : "In-person visit"}
              </div>
            </div>

            {appt.chiefComplaint && (
              <div className="mt-4 p-3.5 rounded-[var(--radius-md)] bg-[var(--color-surface-2)] border border-[var(--color-border)]">
                <p className="text-xs font-semibold text-[var(--color-fg-muted)] mb-1 uppercase tracking-wide">Chief Complaint</p>
                <p className="text-sm text-[var(--color-fg)]">{appt.chiefComplaint}</p>
              </div>
            )}

            {appt.notes && (
              <div className="mt-3 p-3.5 rounded-[var(--radius-md)] bg-[var(--color-surface-2)] border border-[var(--color-border)]">
                <p className="text-xs font-semibold text-[var(--color-fg-muted)] mb-1 uppercase tracking-wide">Consultation Notes</p>
                <p className="text-sm text-[var(--color-fg)]">{appt.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex flex-wrap gap-3">
          {canJoin && (
            <Button size="lg" onClick={joinVideo} className="gap-2">
              <Video className="h-4 w-4" /> Join video call
            </Button>
          )}
          {canConfirm && (
            <Button size="lg" loading={confirmMutation.isPending} onClick={() => confirmMutation.mutate()} className="gap-2">
              <CheckCircle2 className="h-4 w-4" /> Confirm appointment
            </Button>
          )}
          {canComplete && (
            <Button variant="secondary" size="lg" onClick={() => setShowNotes(true)} className="gap-2">
              <ClipboardList className="h-4 w-4" /> Complete & add notes
            </Button>
          )}
          {canCancel && !cancelling && (
            <Button variant="secondary" size="lg" onClick={() => setCancelling(true)} className="gap-2">
              <X className="h-4 w-4" /> Cancel
            </Button>
          )}
          <Link href="/doctor/messages">
            <Button variant="outline" size="lg" className="gap-2">
              <FileText className="h-4 w-4" /> Message patient
            </Button>
          </Link>
        </div>

        {/* Complete with notes panel */}
        {showNotes && (
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Stethoscope className="h-4 w-4" /> Consultation Notes</CardTitle></CardHeader>
            <CardContent>
              <textarea
                {...register("notes")}
                rows={5}
                placeholder="Add consultation notes, diagnosis, and treatment plan…"
                className="w-full rounded-[var(--radius-md)] border border-[var(--color-border-2)] bg-[var(--color-surface)] p-3 text-sm text-[var(--color-fg)] resize-none focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-200)] focus:border-[var(--color-brand-400)] transition-colors"
              />
              <div className="flex gap-2 mt-3">
                <Button
                  loading={completeMutation.isPending}
                  onClick={() => completeMutation.mutate(getValues("notes"))}
                  className="gap-2"
                >
                  <CheckCircle2 className="h-4 w-4" /> Mark complete
                </Button>
                <Button variant="secondary" onClick={() => setShowNotes(false)}>Cancel</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Cancel confirm */}
        {cancelling && (
          <div className="p-4 rounded-[var(--radius-xl)] border border-red-200 bg-red-50">
            <p className="text-sm font-medium text-red-800 mb-3">Are you sure you want to cancel this appointment?</p>
            <div className="flex gap-2">
              <Button variant="danger" size="sm" loading={cancelMutation.isPending} onClick={() => cancelMutation.mutate()}>Yes, cancel</Button>
              <Button variant="secondary" size="sm" onClick={() => setCancelling(false)}>Keep it</Button>
            </div>
          </div>
        )}

        {/* Post-completion actions */}
        {appt.status === "COMPLETED" && (
          <Card>
            <CardContent className="p-5">
              <p className="text-sm text-[var(--color-fg-muted)] flex items-center gap-2 mb-3">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                Consultation complete. You can now add a prescription or create a health record.
              </p>
              <div className="flex gap-2">
                <Link href="/doctor/prescriptions">
                  <Button variant="outline" size="sm">Add prescription</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </motion.div>
    </div>
  );
}
