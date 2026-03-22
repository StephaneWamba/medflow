"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Pill, Plus, Search, User, Clock, CheckCircle2, XCircle } from "lucide-react";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api, ApiError } from "@/lib/api";

interface PrescriptionMedication {
  id: string;
  medicationName: string;
  dosage: string;
  frequency: string;
  durationDays: number;
  refillsAllowed: number;
  instructions?: string;
}

interface Prescription {
  id: string;
  status: string;
  diagnosis: string;
  notes?: string;
  issuedAt: string;
  expiresAt: string;
  patient: { firstName: string; lastName: string };
  medications: PrescriptionMedication[];
}

interface AppointmentOption {
  id: string;
  scheduledAt: string;
  patient: { firstName: string; lastName: string };
}

const STATUS_CONFIG: Record<string, { label: string; variant: "success" | "neutral" | "danger" }> = {
  ACTIVE:    { label: "Active",    variant: "success" },
  COMPLETED: { label: "Completed", variant: "neutral" },
  CANCELLED: { label: "Cancelled", variant: "danger" },
};

const prescriptionSchema = z.object({
  appointmentId: z.string().min(1, "Select appointment"),
  diagnosis: z.string().min(1, "Required"),
  notes: z.string().optional(),
  expiresAt: z.string().min(1, "Required"),
  medicationName: z.string().min(1, "Required"),
  dosage: z.string().min(1, "Required"),
  frequency: z.string().min(1, "Required"),
  durationDays: z.coerce.number().int().positive().min(1),
  refillsAllowed: z.coerce.number().min(0).optional(),
  instructions: z.string().optional(),
});
type PrescriptionForm = z.infer<typeof prescriptionSchema>;

export default function DoctorPrescriptionsPage() {
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<{ prescriptions: Prescription[]; total: number }>({
    queryKey: ["doctor-prescriptions"],
    queryFn: () => api.get("/prescriptions?limit=100"),
  });

  const { data: apptData } = useQuery<{ appointments: AppointmentOption[]; total: number }>({
    queryKey: ["doctor-rx-appts"],
    queryFn: async () => {
      const [confirmed, completed] = await Promise.all([
        api.get<{ appointments: AppointmentOption[] }>("/appointments?status=CONFIRMED&limit=100"),
        api.get<{ appointments: AppointmentOption[] }>("/appointments?status=COMPLETED&limit=100"),
      ]);
      return { appointments: [...(confirmed.appointments ?? []), ...(completed.appointments ?? [])], total: 0 };
    },
    enabled: showForm,
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<PrescriptionForm>({
    resolver: zodResolver(prescriptionSchema),
  });

  const mutation = useMutation({
    mutationFn: (data: PrescriptionForm) => api.post("/prescriptions", {
      appointmentId: data.appointmentId,
      diagnosis: data.diagnosis,
      notes: data.notes,
      expiresAt: new Date(data.expiresAt).toISOString(),
      medications: [{
        medicationName: data.medicationName,
        dosage: data.dosage,
        frequency: data.frequency,
        durationDays: data.durationDays,
        refillsAllowed: data.refillsAllowed ?? 0,
        instructions: data.instructions,
      }],
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["doctor-prescriptions"] });
      setShowForm(false);
      reset();
    },
  });

  const prescriptions = (data?.prescriptions ?? []).filter((p) =>
    !search || p.medications.some(m => m.medicationName.toLowerCase().includes(search.toLowerCase())) ||
    `${p.patient.firstName} ${p.patient.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
    p.diagnosis.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl text-[var(--color-fg)]">Prescriptions</h1>
          <p className="text-sm text-[var(--color-fg-muted)] mt-0.5">Medications you've prescribed</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="gap-2">
          <Plus className="h-4 w-4" /> New prescription
        </Button>
      </div>

      {/* New prescription form */}
      {showForm && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <Card>
            <CardHeader><CardTitle>New Prescription</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-xs font-semibold text-[var(--color-fg-muted)] uppercase tracking-wide mb-1.5 block">Appointment</label>
                  <select {...register("appointmentId")} className="flex h-10 w-full rounded-[var(--radius-md)] border border-[var(--color-border-2)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-fg)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-200)]">
                    <option value="">Select appointment</option>
                    {(apptData?.appointments ?? []).map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.patient.firstName} {a.patient.lastName} — {format(new Date(a.scheduledAt), "MMM d, yyyy")}
                      </option>
                    ))}
                  </select>
                  {errors.appointmentId && <p className="text-xs text-red-600 mt-1">{errors.appointmentId.message}</p>}
                </div>

                <div className="col-span-2">
                  <label className="text-xs font-semibold text-[var(--color-fg-muted)] uppercase tracking-wide mb-1.5 block">Diagnosis</label>
                  <Input placeholder="e.g. Bacterial sinusitis" {...register("diagnosis")} error={!!errors.diagnosis} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[var(--color-fg-muted)] uppercase tracking-wide mb-1.5 block">Expires on</label>
                  <Input type="date" {...register("expiresAt")} error={!!errors.expiresAt} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[var(--color-fg-muted)] uppercase tracking-wide mb-1.5 block">Medication</label>
                  <Input placeholder="e.g. Amoxicillin" {...register("medicationName")} error={!!errors.medicationName} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[var(--color-fg-muted)] uppercase tracking-wide mb-1.5 block">Dosage</label>
                  <Input placeholder="e.g. 500mg" {...register("dosage")} error={!!errors.dosage} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[var(--color-fg-muted)] uppercase tracking-wide mb-1.5 block">Frequency</label>
                  <Input placeholder="e.g. 3× daily" {...register("frequency")} error={!!errors.frequency} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[var(--color-fg-muted)] uppercase tracking-wide mb-1.5 block">Duration (days)</label>
                  <Input type="number" placeholder="e.g. 7" {...register("durationDays")} error={!!errors.durationDays} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[var(--color-fg-muted)] uppercase tracking-wide mb-1.5 block">Refills allowed</label>
                  <Input type="number" defaultValue="0" {...register("refillsAllowed")} />
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-semibold text-[var(--color-fg-muted)] uppercase tracking-wide mb-1.5 block">Instructions</label>
                  <Input placeholder="Take with food, avoid alcohol…" {...register("instructions")} />
                </div>

                {mutation.isError && (
                  <div className="col-span-2 text-xs text-red-600">
                    {mutation.error instanceof ApiError ? ((mutation.error.body as { message?: string })?.message ?? "Failed") : "Failed to create"}
                  </div>
                )}

                <div className="col-span-2 flex gap-2">
                  <Button type="submit" loading={mutation.isPending}>Create prescription</Button>
                  <Button type="button" variant="secondary" onClick={() => { setShowForm(false); reset(); }}>Cancel</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <div className="mb-4 max-w-sm">
        <Input placeholder="Search…" leftIcon={<Search className="h-4 w-4" />} value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="flex flex-col gap-3 max-w-2xl">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20" />)
        ) : prescriptions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Pill className="h-10 w-10 text-[var(--color-fg-subtle)] mb-3" />
            <p className="font-medium text-[var(--color-fg)]">No prescriptions yet</p>
          </div>
        ) : (
          prescriptions.map((rx, i) => {
            const cfg = STATUS_CONFIG[rx.status] ?? STATUS_CONFIG.COMPLETED;
            return (
              <motion.div key={rx.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-amber-50 text-amber-600">
                        <Pill className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <p className="text-sm font-semibold text-[var(--color-fg)]">{rx.diagnosis}</p>
                          <Badge variant={cfg.variant}>{cfg.label}</Badge>
                        </div>
                        {rx.medications.slice(0, 2).map((m) => (
                          <p key={m.id} className="text-xs text-[var(--color-fg-muted)] mb-0.5">
                            {m.medicationName} {m.dosage} · {m.frequency} · {m.durationDays}d
                          </p>
                        ))}
                        {rx.medications.length > 2 && <p className="text-xs text-[var(--color-fg-subtle)]">+{rx.medications.length - 2} more</p>}
                        <p className="text-xs text-[var(--color-fg-subtle)] flex items-center gap-3 mt-1">
                          <span className="flex items-center gap-1"><User className="h-3 w-3" />{rx.patient.firstName} {rx.patient.lastName}</span>
                          <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{format(new Date(rx.issuedAt), "MMM d, yyyy")}</span>
                        </p>
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
