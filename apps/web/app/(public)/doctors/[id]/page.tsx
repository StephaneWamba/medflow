"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Star, Calendar, Video, Languages, Award, Clock, CheckCircle2,
  ChevronLeft, MessageSquare, ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/auth.store";
import { format } from "date-fns";

interface DoctorAvailability { dayOfWeek: string; startTime: string; endTime: string; slotDuration: number; }
interface DoctorReview { rating: number; comment?: string; createdAt: string; }
interface DoctorDetail {
  id: string; firstName: string; lastName: string; specialty: string; subSpecialty?: string;
  bio?: string; profileImageUrl?: string; consultationFee?: number; yearsExperience?: number;
  languages?: string[]; rating?: number; reviewCount?: number; isVerified: boolean; isAcceptingNew: boolean;
  availability: DoctorAvailability[]; reviews: DoctorReview[];
}

const DAY_ORDER = ["MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY","SUNDAY"];
const DAY_LABELS: Record<string, string> = { MONDAY:"Mon",TUESDAY:"Tue",WEDNESDAY:"Wed",THURSDAY:"Thu",FRIDAY:"Fri",SATURDAY:"Sat",SUNDAY:"Sun" };

export default function DoctorProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { token, user } = useAuthStore();
  const router = useRouter();

  const { data: doctor, isLoading } = useQuery<DoctorDetail>({
    queryKey: ["doctor", id],
    queryFn: () => api.get(`/doctors/${id}`),
  });

  function handleBook() {
    if (!token) { router.push("/login"); return; }
    if (user?.role !== "PATIENT") { router.push("/dashboard/book/" + id); return; }
    router.push(`/dashboard/book/${id}`);
  }

  if (isLoading) {
    return (
      <div className="min-h-dvh pt-20">
        <div className="container-lg py-10">
          <Skeleton className="h-6 w-24 mb-8" />
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-10">
            <div className="flex flex-col gap-6">
              <div className="flex gap-6"><Skeleton className="h-28 w-28 rounded-full" /><div className="flex-1 flex flex-col gap-3"><Skeleton className="h-7 w-3/4" /><Skeleton className="h-4 w-1/2" /></div></div>
              <Skeleton className="h-32 w-full" />
            </div>
            <Skeleton className="h-64 rounded-[var(--radius-xl)]" />
          </div>
        </div>
      </div>
    );
  }

  if (!doctor) return <div className="min-h-dvh pt-20 flex items-center justify-center"><p className="text-[var(--color-fg-muted)]">Doctor not found.</p></div>;

  const sortedAvailability = [...(doctor.availability ?? [])].sort(
    (a, b) => DAY_ORDER.indexOf(a.dayOfWeek) - DAY_ORDER.indexOf(b.dayOfWeek)
  );

  return (
    <div className="min-h-dvh pt-20 bg-[var(--color-canvas)]">
      <div className="container-lg py-10">
        {/* Breadcrumb */}
        <Link href="/doctors" className="inline-flex items-center gap-1.5 text-sm text-[var(--color-fg-muted)] hover:text-[var(--color-fg)] mb-8 transition-colors">
          <ChevronLeft className="h-4 w-4" /> Back to doctors
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-10 items-start">
          {/* Left: doctor info */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
            {/* Profile header */}
            <div className="bg-[var(--color-surface)] rounded-[var(--radius-xl)] border border-[var(--color-border)] shadow-[var(--shadow-sm)] overflow-hidden">
              {/* Banner */}
              <div className="h-28 bg-gradient-to-r from-[var(--color-brand-700)] to-[var(--color-brand-500)] relative">
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23fff' fill-opacity='1'%3E%3Ccircle cx='20' cy='20' r='1'/%3E%3C/g%3E%3C/svg%3E\")" }} />
              </div>

              <div className="px-7 pb-7">
                <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-14 mb-5">
                  <div className="relative h-28 w-28 rounded-2xl border-4 border-[var(--color-surface)] shadow-[var(--shadow-md)] overflow-hidden bg-[var(--color-brand-100)] shrink-0">
                    <Image
                      src={doctor.profileImageUrl || "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=300&q=80&fit=crop&crop=face"}
                      alt={`Dr. ${doctor.firstName} ${doctor.lastName}`}
                      fill className="object-cover"
                    />
                  </div>
                  <div className="pb-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h1 className="text-xl font-semibold text-[var(--color-fg)]">
                        Dr. {doctor.firstName} {doctor.lastName}
                      </h1>
                      {doctor.isVerified && (
                        <span className="flex items-center gap-1 text-xs font-medium text-[var(--color-brand-700)] bg-[var(--color-brand-50)] border border-[var(--color-brand-200)] rounded-full px-2 py-0.5">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Verified
                        </span>
                      )}
                    </div>
                    <p className="text-[var(--color-brand-600)] font-medium">{doctor.specialty}</p>
                    {doctor.subSpecialty && <p className="text-sm text-[var(--color-fg-subtle)]">{doctor.subSpecialty}</p>}
                  </div>
                </div>

                {/* Stats row */}
                <div className="flex flex-wrap gap-5 text-sm py-4 border-y border-[var(--color-border)] mb-5">
                  {doctor.rating && (
                    <div className="flex items-center gap-1.5">
                      <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                      <span className="font-semibold text-[var(--color-fg)]">{Number(doctor.rating).toFixed(1)}</span>
                      <span className="text-[var(--color-fg-muted)]">({doctor.reviewCount} reviews)</span>
                    </div>
                  )}
                  {doctor.yearsExperience && (
                    <div className="flex items-center gap-1.5 text-[var(--color-fg-muted)]">
                      <Award className="h-4 w-4" />
                      {doctor.yearsExperience} years experience
                    </div>
                  )}
                  {doctor.languages && doctor.languages.length > 0 && (
                    <div className="flex items-center gap-1.5 text-[var(--color-fg-muted)]">
                      <Languages className="h-4 w-4" />
                      {doctor.languages.join(", ")}
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 text-[var(--color-fg-muted)]">
                    <Video className="h-4 w-4" />
                    Video & In-person
                  </div>
                </div>

                {/* Bio */}
                {doctor.bio && (
                  <p className="text-sm text-[var(--color-fg-muted)] leading-relaxed">{doctor.bio}</p>
                )}
              </div>
            </div>

            {/* Availability */}
            {sortedAvailability.length > 0 && (
              <div className="bg-[var(--color-surface)] rounded-[var(--radius-xl)] border border-[var(--color-border)] shadow-[var(--shadow-sm)] p-6 mt-5">
                <h2 className="font-semibold text-[var(--color-fg)] flex items-center gap-2 mb-4">
                  <Calendar className="h-4.5 w-4.5 text-[var(--color-brand-600)]" /> Weekly schedule
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {sortedAvailability.map((slot) => (
                    <div key={slot.dayOfWeek} className="flex items-center gap-2 bg-[var(--color-brand-50)] rounded-[var(--radius-md)] px-3.5 py-2.5">
                      <span className="text-xs font-semibold text-[var(--color-brand-700)] w-7">{DAY_LABELS[slot.dayOfWeek]}</span>
                      <span className="text-xs text-[var(--color-fg-muted)]">{slot.startTime} – {slot.endTime}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reviews */}
            {doctor.reviews && doctor.reviews.length > 0 && (
              <div className="bg-[var(--color-surface)] rounded-[var(--radius-xl)] border border-[var(--color-border)] shadow-[var(--shadow-sm)] p-6 mt-5">
                <h2 className="font-semibold text-[var(--color-fg)] flex items-center gap-2 mb-4">
                  <MessageSquare className="h-4.5 w-4.5 text-[var(--color-brand-600)]" /> Patient reviews
                </h2>
                <div className="flex flex-col gap-4">
                  {doctor.reviews.map((review, i) => (
                    <div key={i} className={i > 0 ? "border-t border-[var(--color-border)] pt-4" : ""}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-0.5">
                          {Array.from({ length: 5 }).map((_, j) => (
                            <Star key={j} className={`h-3.5 w-3.5 ${j < review.rating ? "fill-amber-400 text-amber-400" : "text-[var(--color-border-2)]"}`} />
                          ))}
                        </div>
                        <span className="text-xs text-[var(--color-fg-subtle)]">{format(new Date(review.createdAt), "MMM d, yyyy")}</span>
                      </div>
                      {review.comment && <p className="text-sm text-[var(--color-fg-muted)] leading-relaxed">{review.comment}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>

          {/* Right: booking card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.45, delay: 0.1 }}
            className="lg:sticky lg:top-24"
          >
            <div className="bg-[var(--color-surface)] rounded-[var(--radius-xl)] border border-[var(--color-border)] shadow-[var(--shadow-md)] p-6">
              <div className="flex items-baseline justify-between mb-5">
                <div>
                  {doctor.consultationFee != null && (
                    <p className="text-2xl font-semibold text-[var(--color-fg)]">
                      ${doctor.consultationFee}
                      <span className="text-sm font-normal text-[var(--color-fg-muted)]"> / visit</span>
                    </p>
                  )}
                </div>
                {doctor.isAcceptingNew && (
                  <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2.5 py-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Accepting patients
                  </span>
                )}
              </div>

              <Separator className="mb-5" />

              <div className="flex flex-col gap-2.5 mb-5 text-sm text-[var(--color-fg-muted)]">
                <div className="flex items-center gap-2.5">
                  <Video className="h-4 w-4 text-[var(--color-brand-500)] shrink-0" />
                  Video consultation available
                </div>
                <div className="flex items-center gap-2.5">
                  <Clock className="h-4 w-4 text-[var(--color-brand-500)] shrink-0" />
                  {doctor.availability?.[0]?.slotDuration ?? 30}-minute sessions
                </div>
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-[var(--color-brand-500)] shrink-0" />
                  Instant confirmation
                </div>
              </div>

              <Button
                onClick={handleBook}
                disabled={!doctor.isAcceptingNew}
                size="lg"
                className="w-full gap-2"
              >
                Book appointment <ArrowRight className="h-4 w-4" />
              </Button>

              {!token && (
                <p className="text-xs text-center text-[var(--color-fg-subtle)] mt-3">
                  You&apos;ll be asked to sign in or create an account
                </p>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
