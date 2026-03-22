"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft, ChevronRight as ChevronRightIcon, Calendar, Clock,
  Video, MapPin, CheckCircle2, ArrowRight, Loader2,
} from "lucide-react";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval,
  getDay, isSameDay, isSameMonth, isToday, isBefore, startOfDay, addMinutes, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api, ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";

interface DoctorDetail {
  id: string; firstName: string; lastName: string; specialty: string;
  profileImageUrl?: string; consultationFee?: number;
  availability: { dayOfWeek: string; startTime: string; endTime: string; slotDuration: number }[];
}
interface ApiSlot { start: string; end: string; available: boolean; }
interface Slot { time: string; available: boolean; }

const DAY_MAP: Record<string, number> = { SUNDAY:0,MONDAY:1,TUESDAY:2,WEDNESDAY:3,THURSDAY:4,FRIDAY:5,SATURDAY:6 };

type Step = "calendar" | "slot" | "details" | "confirm";

export default function BookingPage() {
  const { doctorId } = useParams<{ doctorId: string }>();
  const router = useRouter();

  const [step, setStep] = useState<Step>("calendar");
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [appointmentType, setAppointmentType] = useState<"VIDEO" | "IN_PERSON">("VIDEO");
  const [chiefComplaint, setChiefComplaint] = useState("");

  const { data: doctor, isLoading } = useQuery<DoctorDetail>({
    queryKey: ["doctor", doctorId],
    queryFn: () => api.get(`/doctors/${doctorId}`),
  });

  const { data: slotsData, isLoading: slotsLoading } = useQuery<{ slots: ApiSlot[] }>({
    queryKey: ["slots", doctorId, selectedDate?.toISOString()],
    queryFn: () =>
      api.get(`/appointments/slots?doctorId=${doctorId}&date=${format(selectedDate!, "yyyy-MM-dd")}`),
    enabled: !!selectedDate,
  });

  const bookMutation = useMutation({
    mutationFn: () =>
      api.post("/appointments", {
        doctorId,
        scheduledAt: selectedSlot,
        type: appointmentType,
        chiefComplaint: chiefComplaint || undefined,
        durationMinutes: 30,
      }),
    onSuccess: () => {
      setStep("confirm");
    },
  });

  // Which days have availability
  const availableDays = new Set(doctor?.availability?.map((a) => DAY_MAP[a.dayOfWeek]) ?? []);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startPad = getDay(monthStart); // 0=Sun
  const today = startOfDay(new Date());

  function isDaySelectable(date: Date) {
    return availableDays.has(getDay(date)) && !isBefore(date, today);
  }

  const slots: Slot[] = (slotsData?.slots ?? [])
    .filter((s) => s.available)
    .map((s) => ({ time: s.start, available: true }));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--color-brand-500)]" />
      </div>
    );
  }

  if (!doctor) return null;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Back link */}
      <Link
        href={`/doctors/${doctorId}`}
        className="inline-flex items-center gap-1.5 text-sm text-[var(--color-fg-muted)] hover:text-[var(--color-fg)] mb-6 transition-colors"
      >
        <ChevronLeft className="h-4 w-4" /> Back to profile
      </Link>

      {/* Doctor mini-card */}
      <div className="flex items-center gap-4 mb-7 p-4 bg-[var(--color-surface)] rounded-[var(--radius-xl)] border border-[var(--color-border)] shadow-[var(--shadow-xs)]">
        <div className="relative h-14 w-14 rounded-xl overflow-hidden bg-[var(--color-brand-100)] shrink-0">
          <Image
            src={doctor.profileImageUrl || "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=200&q=80&fit=crop&crop=face"}
            alt={`Dr. ${doctor.firstName}`} fill className="object-cover"
          />
        </div>
        <div>
          <p className="font-semibold text-[var(--color-fg)]">Dr. {doctor.firstName} {doctor.lastName}</p>
          <p className="text-sm text-[var(--color-brand-600)]">{doctor.specialty}</p>
        </div>
        {doctor.consultationFee != null && (
          <div className="ml-auto text-right">
            <p className="text-lg font-semibold text-[var(--color-fg)]">${doctor.consultationFee}</p>
            <p className="text-xs text-[var(--color-fg-subtle)]">per visit</p>
          </div>
        )}
      </div>

      {/* Progress indicator */}
      <div className="flex items-center gap-2 mb-7">
        {(["calendar","slot","details","confirm"] as Step[]).map((s, i) => (
          <React.Fragment key={s}>
            <div className={cn(
              "flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold transition-all duration-200",
              step === s
                ? "bg-[var(--color-brand-600)] text-white scale-110"
                : ["confirm"].includes(s) && step === "confirm"
                  ? "bg-[var(--color-success)] text-white"
                  : (["calendar","slot","details"].indexOf(s) < ["calendar","slot","details"].indexOf(step))
                    ? "bg-[var(--color-brand-200)] text-[var(--color-brand-800)]"
                    : "bg-[var(--color-border)] text-[var(--color-fg-subtle)]"
            )}>
              {i + 1}
            </div>
            {i < 3 && <div className={cn("h-px flex-1 transition-colors duration-300", ["calendar","slot","details"].indexOf(s) < ["calendar","slot","details"].indexOf(step) ? "bg-[var(--color-brand-300)]" : "bg-[var(--color-border)]")} />}
          </React.Fragment>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* ── Step 1: Calendar ─────────────────────────────────────────────── */}
        {step === "calendar" && (
          <motion.div key="calendar" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.25 }}>
            <Card className="overflow-hidden">
              <div className="flex items-center justify-between px-6 pt-6 pb-4">
                <h2 className="font-semibold text-[var(--color-fg)]">
                  {format(currentMonth, "MMMM yyyy")}
                </h2>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                    disabled={isSameMonth(currentMonth, new Date())}
                    className="p-1.5 rounded-[var(--radius-md)] hover:bg-[var(--color-surface-2)] text-[var(--color-fg-muted)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                    disabled={isSameMonth(currentMonth, addMonths(new Date(), 2))}
                    className="p-1.5 rounded-[var(--radius-md)] hover:bg-[var(--color-surface-2)] text-[var(--color-fg-muted)] disabled:opacity-30 transition-colors"
                  >
                    <ChevronRightIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="px-6 pb-6">
                {/* Day headers */}
                <div className="grid grid-cols-7 mb-2">
                  {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((d) => (
                    <div key={d} className="text-center text-xs font-semibold text-[var(--color-fg-subtle)] py-2">{d}</div>
                  ))}
                </div>

                {/* Days grid */}
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: startPad }).map((_, i) => <div key={`pad-${i}`} />)}
                  {days.map((day) => {
                    const selectable = isDaySelectable(day);
                    const selected = selectedDate && isSameDay(day, selectedDate);
                    const todayDay = isToday(day);
                    return (
                      <motion.button
                        key={day.toISOString()}
                        whileTap={selectable ? { scale: 0.92 } : {}}
                        onClick={() => { if (selectable) { setSelectedDate(day); setSelectedSlot(null); } }}
                        className={cn(
                          "aspect-square flex items-center justify-center rounded-[var(--radius-md)] text-sm font-medium transition-all duration-100",
                          selected
                            ? "bg-[var(--color-brand-600)] text-white shadow-[var(--shadow-sm)]"
                            : selectable
                              ? todayDay
                                ? "border-2 border-[var(--color-brand-400)] text-[var(--color-brand-700)] hover:bg-[var(--color-brand-50)]"
                                : "text-[var(--color-fg)] hover:bg-[var(--color-brand-50)] hover:text-[var(--color-brand-700)]"
                              : "text-[var(--color-fg-subtle)] cursor-not-allowed opacity-40",
                        )}
                      >
                        {format(day, "d")}
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              <div className="border-t border-[var(--color-border)] px-6 py-4 flex items-center justify-between">
                <span className="text-xs text-[var(--color-fg-subtle)] flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm bg-[var(--color-brand-600)]" />
                  Available days
                </span>
                <Button size="md" disabled={!selectedDate} onClick={() => setStep("slot")} className="gap-2">
                  Continue <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          </motion.div>
        )}

        {/* ── Step 2: Slot picker ───────────────────────────────────────────── */}
        {step === "slot" && selectedDate && (
          <motion.div key="slot" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
            <Card>
              <div className="px-6 pt-6 pb-4 border-b border-[var(--color-border)]">
                <button onClick={() => setStep("calendar")} className="text-sm text-[var(--color-fg-muted)] hover:text-[var(--color-fg)] flex items-center gap-1 mb-2 transition-colors">
                  <ChevronLeft className="h-4 w-4" /> Change date
                </button>
                <h2 className="font-semibold text-[var(--color-fg)]">
                  {format(selectedDate, "EEEE, MMMM d")}
                </h2>
                <p className="text-sm text-[var(--color-fg-muted)] mt-0.5">Choose an available time slot</p>
              </div>

              <div className="p-6">
                {slotsLoading ? (
                  <div className="grid grid-cols-3 gap-2">
                    {Array.from({ length: 9 }).map((_, i) => (
                      <div key={i} className="h-10 animate-pulse rounded-[var(--radius-md)] bg-[var(--color-border)]" />
                    ))}
                  </div>
                ) : slots.length === 0 ? (
                  <div className="py-10 text-center">
                    <Clock className="h-8 w-8 text-[var(--color-fg-subtle)] mx-auto mb-3" />
                    <p className="text-sm font-medium text-[var(--color-fg)]">No slots available</p>
                    <p className="text-xs text-[var(--color-fg-muted)] mt-1">Try another date</p>
                    <Button variant="secondary" size="sm" className="mt-4" onClick={() => setStep("calendar")}>Pick another day</Button>
                  </div>
                ) : (
                  <motion.div className="grid grid-cols-3 gap-2">
                    {slots.map(({ time }, i) => {
                      const parsed = parseISO(time);
                      const isSelected = selectedSlot === time;
                      return (
                        <motion.button
                          key={time}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: i * 0.03, duration: 0.2 }}
                          onClick={() => setSelectedSlot(time)}
                          className={cn(
                            "flex flex-col items-center justify-center gap-0.5 rounded-[var(--radius-md)] border py-2.5 text-xs font-medium transition-all duration-150",
                            isSelected
                              ? "border-[var(--color-brand-600)] bg-[var(--color-brand-600)] text-white shadow-[var(--shadow-sm)]"
                              : "border-[var(--color-border)] text-[var(--color-fg)] hover:border-[var(--color-brand-300)] hover:bg-[var(--color-brand-50)] hover:text-[var(--color-brand-700)]"
                          )}
                        >
                          <span className="font-semibold">{format(parsed, "h:mm")}</span>
                          <span className={isSelected ? "opacity-80" : "text-[var(--color-fg-subtle)]"}>{format(parsed, "a")}</span>
                        </motion.button>
                      );
                    })}
                  </motion.div>
                )}
              </div>

              <div className="border-t border-[var(--color-border)] px-6 py-4 flex justify-end">
                <Button size="md" disabled={!selectedSlot} onClick={() => setStep("details")} className="gap-2">
                  Continue <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          </motion.div>
        )}

        {/* ── Step 3: Visit details ─────────────────────────────────────────── */}
        {step === "details" && (
          <motion.div key="details" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
            <Card>
              <div className="px-6 pt-6 pb-4 border-b border-[var(--color-border)]">
                <button onClick={() => setStep("slot")} className="text-sm text-[var(--color-fg-muted)] hover:text-[var(--color-fg)] flex items-center gap-1 mb-2 transition-colors">
                  <ChevronLeft className="h-4 w-4" /> Change time
                </button>
                <h2 className="font-semibold text-[var(--color-fg)]">Visit details</h2>
              </div>

              <div className="p-6 flex flex-col gap-5">
                {/* Appointment type */}
                <div>
                  <p className="text-sm font-medium text-[var(--color-fg)] mb-2.5">Appointment type</p>
                  <div className="grid grid-cols-2 gap-2.5">
                    {(["VIDEO","IN_PERSON"] as const).map((type) => (
                      <button
                        key={type}
                        onClick={() => setAppointmentType(type)}
                        className={cn(
                          "flex items-center gap-3 rounded-[var(--radius-lg)] border p-3.5 text-sm font-medium transition-all duration-150",
                          appointmentType === type
                            ? "border-[var(--color-brand-500)] bg-[var(--color-brand-50)] text-[var(--color-brand-800)]"
                            : "border-[var(--color-border)] text-[var(--color-fg-muted)] hover:border-[var(--color-brand-300)]"
                        )}
                      >
                        {type === "VIDEO" ? (
                          <Video className={cn("h-4.5 w-4.5 shrink-0", appointmentType === type && "text-[var(--color-brand-600)]")} />
                        ) : (
                          <MapPin className={cn("h-4.5 w-4.5 shrink-0", appointmentType === type && "text-[var(--color-brand-600)]")} />
                        )}
                        {type === "VIDEO" ? "Video call" : "In-person"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Chief complaint */}
                <div>
                  <label className="text-sm font-medium text-[var(--color-fg)] block mb-1.5">
                    Reason for visit <span className="text-[var(--color-fg-subtle)] font-normal">(optional)</span>
                  </label>
                  <textarea
                    value={chiefComplaint}
                    onChange={(e) => setChiefComplaint(e.target.value)}
                    placeholder="Briefly describe your symptoms or what you'd like to discuss…"
                    maxLength={500}
                    rows={4}
                    className="w-full resize-none rounded-[var(--radius-md)] border border-[var(--color-border-2)] bg-[var(--color-surface)] px-3 py-2.5 text-sm text-[var(--color-fg)] placeholder:text-[var(--color-fg-subtle)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-200)] focus:border-[var(--color-brand-400)] transition-colors"
                  />
                  <p className="text-xs text-[var(--color-fg-subtle)] mt-1 text-right">{chiefComplaint.length}/500</p>
                </div>

                {/* Summary */}
                {selectedDate && selectedSlot && (
                  <div className="rounded-[var(--radius-lg)] bg-[var(--color-brand-50)] border border-[var(--color-brand-200)] p-4 text-sm">
                    <p className="font-semibold text-[var(--color-brand-800)] mb-2">Booking summary</p>
                    <div className="flex flex-col gap-1.5 text-[var(--color-brand-700)]">
                      <span className="flex items-center gap-2"><Calendar className="h-4 w-4 shrink-0" />{format(selectedDate, "EEEE, MMMM d, yyyy")}</span>
                      <span className="flex items-center gap-2"><Clock className="h-4 w-4 shrink-0" />{format(parseISO(selectedSlot), "h:mm a")}</span>
                      {doctor.consultationFee != null && (
                        <span className="flex items-center gap-2 font-semibold">${doctor.consultationFee} consultation fee</span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t border-[var(--color-border)] px-6 py-4 flex justify-between items-center">
                <Button variant="secondary" size="md" onClick={() => setStep("slot")}>Back</Button>
                <Button
                  size="md"
                  loading={bookMutation.isPending}
                  onClick={() => bookMutation.mutate()}
                  className="gap-2"
                >
                  Confirm booking <CheckCircle2 className="h-4 w-4" />
                </Button>
              </div>

              {bookMutation.isError && (
                <div className="mx-6 mb-4 rounded-[var(--radius-md)] bg-red-50 border border-red-200 px-3.5 py-2.5 text-sm text-red-700">
                  {bookMutation.error instanceof ApiError ? bookMutation.error.message : "Booking failed. Please try again."}
                </div>
              )}
            </Card>
          </motion.div>
        )}

        {/* ── Step 4: Confirm ───────────────────────────────────────────────── */}
        {step === "confirm" && (
          <motion.div key="confirm" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.35 }}>
            <Card className="text-center p-10">
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
                className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100"
              >
                <CheckCircle2 className="h-10 w-10 text-emerald-600" />
              </motion.div>
              <h2 className="font-display text-2xl text-[var(--color-fg)] mb-2">Appointment booked!</h2>
              <p className="text-[var(--color-fg-muted)] text-sm max-w-xs mx-auto leading-relaxed">
                You&apos;ll receive a confirmation email shortly. The doctor will confirm within 24 hours.
              </p>
              {selectedDate && selectedSlot && (
                <div className="mt-5 inline-flex flex-col gap-1.5 bg-[var(--color-brand-50)] rounded-[var(--radius-lg)] border border-[var(--color-brand-200)] px-5 py-3 text-sm text-[var(--color-brand-700)]">
                  <span className="font-semibold">{format(selectedDate, "EEEE, MMMM d, yyyy")}</span>
                  <span>{format(parseISO(selectedSlot), "h:mm a")}</span>
                </div>
              )}
              <div className="mt-7 flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/dashboard/appointments">
                  <Button variant="primary" size="lg">View appointments</Button>
                </Link>
                <Link href="/doctors">
                  <Button variant="secondary" size="lg">Browse more doctors</Button>
                </Link>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
