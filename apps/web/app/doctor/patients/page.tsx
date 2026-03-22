"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Users, Search, User, Calendar, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";

interface Appointment {
  id: string;
  scheduledAt: string;
  patient: { id: string; firstName: string; lastName: string };
}

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  lastAppointmentDate: string;
  totalAppointments: number;
}

function derivePatients(appointments: Appointment[]): Patient[] {
  const map = new Map<string, Patient>();
  for (const appt of appointments) {
    const p = appt.patient;
    const existing = map.get(p.id);
    if (existing) {
      existing.totalAppointments += 1;
      if (appt.scheduledAt > existing.lastAppointmentDate) {
        existing.lastAppointmentDate = appt.scheduledAt;
      }
    } else {
      map.set(p.id, { id: p.id, firstName: p.firstName, lastName: p.lastName, lastAppointmentDate: appt.scheduledAt, totalAppointments: 1 });
    }
  }
  return Array.from(map.values());
}

export default function DoctorPatientsPage() {
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery<{ appointments: Appointment[]; total: number }>({
    queryKey: ["doctor-patients"],
    queryFn: () => api.get("/appointments?status=COMPLETED&limit=100"),
  });

  const allPatients = derivePatients(data?.appointments ?? []);
  const patients = allPatients.filter((p) =>
    !search || `${p.firstName} ${p.lastName}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl text-[var(--color-fg)]">Patients</h1>
        <p className="text-sm text-[var(--color-fg-muted)] mt-0.5">
          {allPatients.length} patient{allPatients.length !== 1 ? "s" : ""} from your consultations
        </p>
      </div>

      <div className="mb-5 max-w-md">
        <Input placeholder="Search patients…" leftIcon={<Search className="h-4 w-4" />} value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-w-5xl">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24" />)
        ) : patients.length === 0 ? (
          <div className="col-span-3 flex flex-col items-center justify-center py-16 text-center">
            <Users className="h-10 w-10 text-[var(--color-fg-subtle)] mb-3" />
            <p className="font-medium text-[var(--color-fg)]">No patients yet</p>
            <p className="text-sm text-[var(--color-fg-muted)] mt-1">Patients appear after completed consultations</p>
          </div>
        ) : (
          patients.map((patient, i) => (
            <motion.div key={patient.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
              <Card hover className="cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand-100)] text-[var(--color-brand-700)] text-sm font-semibold">
                      {patient.firstName[0]}{patient.lastName[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[var(--color-fg)] truncate">{patient.firstName} {patient.lastName}</p>
                      {patient.lastAppointmentDate && (
                        <p className="text-xs text-[var(--color-fg-subtle)] flex items-center gap-1 mt-0.5">
                          <Calendar className="h-3 w-3" />
                          Last visit: {format(new Date(patient.lastAppointmentDate), "MMM d, yyyy")}
                        </p>
                      )}
                      {patient.totalAppointments && (
                        <p className="text-xs text-[var(--color-fg-subtle)]">{patient.totalAppointments} consultation{patient.totalAppointments > 1 ? "s" : ""}</p>
                      )}
                    </div>
                    <ArrowRight className="h-4 w-4 text-[var(--color-fg-subtle)] shrink-0" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
