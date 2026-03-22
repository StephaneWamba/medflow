"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Clock, Plus, Trash2, Save, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { api, ApiError } from "@/lib/api";

const DAYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];
const DAY_LABELS: Record<string, string> = {
  MONDAY: "Mon", TUESDAY: "Tue", WEDNESDAY: "Wed", THURSDAY: "Thu",
  FRIDAY: "Fri", SATURDAY: "Sat", SUNDAY: "Sun",
};

interface AvailabilitySlot {
  id?: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  slotDuration: number;
}

interface DoctorProfile {
  availability: AvailabilitySlot[];
  consultationFee?: number;
  isAcceptingPatients?: boolean;
}

export default function DoctorAvailabilityPage() {
  const queryClient = useQueryClient();
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");

  const { data: profile, isLoading } = useQuery<DoctorProfile>({
    queryKey: ["doctor-profile"],
    queryFn: () => api.get("/doctors/me"),
  });

  useEffect(() => {
    if (profile?.availability) setSlots(profile.availability);
  }, [profile]);

  const mutation = useMutation({
    mutationFn: (availability: AvailabilitySlot[]) =>
      api.put("/doctors/me/availability", availability),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["doctor-profile"] });
      setSaveStatus("success");
      setTimeout(() => setSaveStatus("idle"), 3000);
    },
    onError: () => {
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 3000);
    },
  });

  function addSlot(day: string) {
    setSlots((prev) => [...prev, { dayOfWeek: day, startTime: "09:00", endTime: "17:00", slotDuration: 30 }]);
  }

  function removeSlot(index: number) {
    setSlots((prev) => prev.filter((_, i) => i !== index));
  }

  function updateSlot(index: number, field: keyof AvailabilitySlot, value: string | number) {
    setSlots((prev) => prev.map((s, i) => i === index ? { ...s, [field]: value } : s));
  }

  if (isLoading) {
    return (
      <div>
        <Skeleton className="h-7 w-48 mb-6" />
        <div className="flex flex-col gap-4">{[1,2,3].map(i => <Skeleton key={i} className="h-32" />)}</div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl text-[var(--color-fg)]">Availability</h1>
          <p className="text-sm text-[var(--color-fg-muted)] mt-0.5">Set your weekly schedule</p>
        </div>
        <Button
          onClick={() => mutation.mutate(slots)}
          loading={mutation.isPending}
          className="gap-2"
        >
          {saveStatus === "success" ? <CheckCircle2 className="h-4 w-4" /> : <Save className="h-4 w-4" />}
          {saveStatus === "success" ? "Saved!" : "Save schedule"}
        </Button>
      </div>

      {saveStatus === "error" && (
        <div className="mb-4 flex items-center gap-2 rounded-[var(--radius-md)] bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" /> Failed to save. Please try again.
        </div>
      )}

      <div className="flex flex-col gap-4">
        {DAYS.map((day) => {
          const daySlots = slots.map((s, i) => ({ ...s, _index: i })).filter((s) => s.dayOfWeek === day);
          return (
            <motion.div key={day} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-[var(--color-fg)]">{DAY_LABELS[day] === "Sat" || DAY_LABELS[day] === "Sun" ? <span className="text-[var(--color-fg-muted)]">{DAY_LABELS[day]}</span> : DAY_LABELS[day]}</h3>
                    <Button variant="outline" size="sm" className="gap-1.5 h-7 text-xs" onClick={() => addSlot(day)}>
                      <Plus className="h-3 w-3" /> Add slot
                    </Button>
                  </div>
                  {daySlots.length === 0 ? (
                    <p className="text-xs text-[var(--color-fg-subtle)] italic">No availability — day off</p>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {daySlots.map((slot) => (
                        <div key={slot._index} className="flex items-center gap-3 p-2.5 rounded-[var(--radius-md)] bg-[var(--color-surface-2)] border border-[var(--color-border)]">
                          <Clock className="h-4 w-4 text-[var(--color-fg-subtle)] shrink-0" />
                          <input
                            type="time"
                            value={slot.startTime}
                            onChange={(e) => updateSlot(slot._index, "startTime", e.target.value)}
                            className="text-sm bg-transparent border-none outline-none text-[var(--color-fg)] w-[90px]"
                          />
                          <span className="text-[var(--color-fg-subtle)] text-sm">→</span>
                          <input
                            type="time"
                            value={slot.endTime}
                            onChange={(e) => updateSlot(slot._index, "endTime", e.target.value)}
                            className="text-sm bg-transparent border-none outline-none text-[var(--color-fg)] w-[90px]"
                          />
                          <select
                            value={slot.slotDuration}
                            onChange={(e) => updateSlot(slot._index, "slotDuration", Number(e.target.value))}
                            className="text-xs bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-sm)] px-2 py-1 text-[var(--color-fg)] focus:outline-none"
                          >
                            <option value={15}>15 min slots</option>
                            <option value={30}>30 min slots</option>
                            <option value={45}>45 min slots</option>
                            <option value={60}>60 min slots</option>
                          </select>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400 hover:text-red-600 hover:bg-red-50 ml-auto" onClick={() => removeSlot(slot._index)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
