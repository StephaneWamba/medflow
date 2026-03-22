"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ChevronLeft, Video, MapPin, Clock, Calendar, FileText, X, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
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
interface VideoTokenResponse { token: string; roomName: string; }

const STATUS_MAP = {
  PENDING:   { label:"Pending",   class:"bg-amber-50 text-amber-700 border-amber-200" },
  CONFIRMED: { label:"Confirmed", class:"bg-[var(--color-brand-50)] text-[var(--color-brand-700)] border-[var(--color-brand-200)]" },
  CANCELLED: { label:"Cancelled", class:"bg-red-50 text-red-700 border-red-200" },
  COMPLETED: { label:"Completed", class:"bg-emerald-50 text-emerald-700 border-emerald-200" },
  NO_SHOW:   { label:"No Show",   class:"bg-red-50 text-red-700 border-red-200" },
};

export default function AppointmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [cancelling, setCancelling] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  const { data: appt, isLoading } = useQuery<AppointmentDetail>({
    queryKey: ["appointment", id],
    queryFn: () => api.get(`/appointments/${id}`),
  });

  const cancelMutation = useMutation({
    mutationFn: () => api.patch(`/appointments/${id}/cancel`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointment", id] });
      queryClient.invalidateQueries({ queryKey: ["appointments-list"] });
      setCancelling(false);
    },
  });

  async function joinVideo() {
    setJoinError(null);
    try {
      const { token, roomName } = await api.get<VideoTokenResponse>(`/appointments/${id}/video-token`);
      localStorage.setItem("lk_token", token);
      localStorage.setItem("lk_room", roomName);
      router.push(`/dashboard/video/${id}`);
    } catch {
      setJoinError("Could not join the video call. The room may not be ready yet.");
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto">
        <Skeleton className="h-5 w-28 mb-8" />
        <Skeleton className="h-48 rounded-[var(--radius-xl)]" />
      </div>
    );
  }
  if (!appt) return <div className="text-center py-20 text-[var(--color-fg-muted)]">Appointment not found.</div>;

  const statusCfg = STATUS_MAP[appt.status as keyof typeof STATUS_MAP] ?? STATUS_MAP.PENDING;
  const date = new Date(appt.scheduledAt);
  const canJoin = appt.status === "CONFIRMED" && appt.type === "VIDEO";
  const canCancel = ["PENDING","CONFIRMED"].includes(appt.status);

  return (
    <div className="max-w-2xl mx-auto">
      <Link href="/dashboard/appointments" className="inline-flex items-center gap-1.5 text-sm text-[var(--color-fg-muted)] hover:text-[var(--color-fg)] mb-6 transition-colors">
        <ChevronLeft className="h-4 w-4" /> Back to appointments
      </Link>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="flex flex-col gap-5">
        {/* Header card */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-5">
              <div>
                <h1 className="font-display text-xl text-[var(--color-fg)]">
                  Dr. {appt.doctor.firstName} {appt.doctor.lastName}
                </h1>
                <p className="text-sm text-[var(--color-brand-600)] mt-0.5">{appt.doctor.specialty}</p>
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
                {appt.type === "VIDEO" ? <Video className="h-4 w-4 text-[var(--color-brand-500)] shrink-0" /> : <MapPin className="h-4 w-4 text-[var(--color-brand-500)] shrink-0" />}
                {appt.type === "VIDEO" ? "Video consultation" : "In-person visit"}
              </div>
            </div>

            {appt.chiefComplaint && (
              <div className="mt-4 p-3.5 rounded-[var(--radius-md)] bg-[var(--color-surface-2)] border border-[var(--color-border)]">
                <p className="text-xs font-semibold text-[var(--color-fg-muted)] mb-1 uppercase tracking-wide">Reason for visit</p>
                <p className="text-sm text-[var(--color-fg)]">{appt.chiefComplaint}</p>
              </div>
            )}

            {appt.notes && (
              <div className="mt-3 p-3.5 rounded-[var(--radius-md)] bg-[var(--color-surface-2)] border border-[var(--color-border)]">
                <p className="text-xs font-semibold text-[var(--color-fg-muted)] mb-1 uppercase tracking-wide">Doctor&apos;s notes</p>
                <p className="text-sm text-[var(--color-fg)]">{appt.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex flex-wrap gap-3">
          {canJoin && (
            <Button size="lg" onClick={joinVideo} className="gap-2 flex-1 sm:flex-none">
              <Video className="h-4 w-4" /> Join video call
            </Button>
          )}
          {joinError && (
            <p className="w-full text-sm text-red-600">{joinError}</p>
          )}
          {canCancel && !cancelling && (
            <Button variant="secondary" size="lg" onClick={() => setCancelling(true)} className="gap-2">
              <X className="h-4 w-4" /> Cancel appointment
            </Button>
          )}
          {cancelling && (
            <div className="w-full p-4 rounded-[var(--radius-xl)] border border-red-200 bg-red-50">
              <p className="text-sm font-medium text-red-800 mb-3">Are you sure you want to cancel this appointment?</p>
              <div className="flex gap-2">
                <Button
                  variant="danger"
                  size="sm"
                  loading={cancelMutation.isPending}
                  onClick={() => cancelMutation.mutate()}
                >
                  Yes, cancel
                </Button>
                <Button variant="secondary" size="sm" onClick={() => setCancelling(false)}>Keep it</Button>
              </div>
            </div>
          )}
          <Link href={`/dashboard/messages`} className="flex-1 sm:flex-none">
            <Button variant="outline" size="lg" className="w-full gap-2">
              <FileText className="h-4 w-4" /> Message doctor
            </Button>
          </Link>
        </div>

        {appt.status === "COMPLETED" && (
          <Card>
            <CardContent className="p-5">
              <p className="text-sm text-[var(--color-fg-muted)] flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                This consultation is complete. View your prescriptions or health records for any updates.
              </p>
              <div className="flex gap-2 mt-3">
                <Link href="/dashboard/prescriptions"><Button variant="outline" size="sm">Prescriptions</Button></Link>
                <Link href="/dashboard/health-records"><Button variant="outline" size="sm">Health records</Button></Link>
              </div>
            </CardContent>
          </Card>
        )}
      </motion.div>
    </div>
  );
}
