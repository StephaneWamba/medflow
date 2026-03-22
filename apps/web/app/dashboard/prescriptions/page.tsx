"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Pill, Search, Clock, User, AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { api } from "@/lib/api";

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
  issuedAt: string;
  expiresAt: string;
  medications: PrescriptionMedication[];
  doctor: { firstName: string; lastName: string; specialty: string };
}

const STATUS_CONFIG: Record<string, { label: string; variant: "success" | "warning" | "danger" | "neutral"; icon: React.ReactNode }> = {
  ACTIVE:    { label: "Active",    variant: "success", icon: <CheckCircle2 className="h-3 w-3" /> },
  COMPLETED: { label: "Completed", variant: "neutral", icon: <Clock className="h-3 w-3" /> },
  CANCELLED: { label: "Cancelled", variant: "danger",  icon: <XCircle className="h-3 w-3" /> },
};

const PILL_COLORS = [
  "bg-emerald-50 text-emerald-600",
  "bg-violet-50 text-violet-600",
  "bg-amber-50 text-amber-600",
  "bg-[var(--color-brand-50)] text-[var(--color-brand-600)]",
  "bg-rose-50 text-rose-600",
];

export default function PrescriptionsPage() {
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery<{ prescriptions: Prescription[]; total: number }>({
    queryKey: ["prescriptions"],
    queryFn: () => api.get("/prescriptions?limit=50"),
  });

  const prescriptions = (data?.prescriptions ?? []).filter((p) =>
    !search || p.medications.some(m => m.medicationName.toLowerCase().includes(search.toLowerCase())) ||
    p.doctor.lastName.toLowerCase().includes(search.toLowerCase()) ||
    p.diagnosis.toLowerCase().includes(search.toLowerCase())
  );

  const active = prescriptions.filter((p) => p.status === "ACTIVE");
  const past = prescriptions.filter((p) => p.status !== "ACTIVE");

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl text-[var(--color-fg)]">Prescriptions</h1>
        <p className="text-sm text-[var(--color-fg-muted)] mt-0.5">Your medication history</p>
      </div>

      <div className="mb-6 max-w-md">
        <Input
          placeholder="Search medications…"
          leftIcon={<Search className="h-4 w-4" />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-3 max-w-2xl">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
      ) : prescriptions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Pill className="h-10 w-10 text-[var(--color-fg-subtle)] mb-3" />
          <p className="font-medium text-[var(--color-fg)]">No prescriptions yet</p>
          <p className="text-sm text-[var(--color-fg-muted)] mt-1">Prescriptions appear after a consultation</p>
        </div>
      ) : (
        <div className="max-w-2xl flex flex-col gap-8">
          {active.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold uppercase tracking-widest text-[var(--color-fg-subtle)] mb-3">Active</h2>
              <div className="flex flex-col gap-3">
                {active.map((rx, i) => <PrescriptionCard key={rx.id} rx={rx} index={i} colorIndex={i} />)}
              </div>
            </section>
          )}
          {past.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold uppercase tracking-widest text-[var(--color-fg-subtle)] mb-3">Past</h2>
              <div className="flex flex-col gap-3">
                {past.map((rx, i) => <PrescriptionCard key={rx.id} rx={rx} index={i} colorIndex={active.length + i} />)}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

function PrescriptionCard({ rx, index, colorIndex }: { rx: Prescription; index: number; colorIndex: number }) {
  const cfg = STATUS_CONFIG[rx.status] ?? STATUS_CONFIG.COMPLETED;
  const pillColor = PILL_COLORS[colorIndex % PILL_COLORS.length];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] ${pillColor}`}>
              <Pill className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-1">
                <p className="text-sm font-semibold text-[var(--color-fg)]">{rx.diagnosis}</p>
                <Badge variant={cfg.variant} className="flex items-center gap-1 shrink-0">
                  {cfg.icon}{cfg.label}
                </Badge>
              </div>
              {rx.medications.slice(0, 2).map((m) => (
                <p key={m.id} className="text-xs text-[var(--color-fg-muted)] mb-0.5">
                  {m.medicationName} {m.dosage} · {m.frequency} · {m.durationDays}d
                  {m.refillsAllowed > 0 ? ` · ${m.refillsAllowed} refill${m.refillsAllowed > 1 ? "s" : ""}` : ""}
                </p>
              ))}
              {rx.medications.length > 2 && <p className="text-xs text-[var(--color-fg-subtle)]">+{rx.medications.length - 2} more</p>}
              <p className="text-xs text-[var(--color-fg-subtle)] flex items-center gap-3 mt-1">
                <span className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  Dr. {rx.doctor.lastName} · {rx.doctor.specialty}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {format(new Date(rx.issuedAt), "MMMM d, yyyy")}
                </span>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
