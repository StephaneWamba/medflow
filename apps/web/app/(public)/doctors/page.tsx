"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Search, SlidersHorizontal, Star, ChevronRight, Video, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { useDebounce } from "@/hooks/useDebounce";

interface Doctor {
  id: string; firstName: string; lastName: string; specialty: string;
  subSpecialty?: string; bio?: string; profileImageUrl?: string;
  consultationFee?: number; yearsExperience?: number; languages?: string[];
  rating?: number; reviewCount?: number;
}

interface DoctorsResponse { doctors: Doctor[]; total: number; page: number; limit: number; }

const SPECIALTIES = [
  "All", "Cardiology", "Dermatology", "Internal Medicine", "Pediatrics",
  "Psychiatry", "Orthopedics", "Neurology", "Gynecology", "Ophthalmology",
  "General Practice", "Endocrinology", "Gastroenterology", "Pulmonology",
  "Oncology", "Emergency Medicine",
];

function DoctorCard({ doctor, index }: { doctor: Doctor; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.35, ease: "easeOut" }}
    >
      <Link href={`/doctors/${doctor.id}`}>
        <div className="group bg-[var(--color-surface)] rounded-[var(--radius-xl)] border border-[var(--color-border)] shadow-[var(--shadow-sm)] overflow-hidden hover:shadow-[var(--shadow-md)] hover:border-[var(--color-brand-200)] transition-all duration-200 cursor-pointer h-full flex flex-col">
          {/* Photo */}
          <div className="relative h-52 bg-[var(--color-brand-50)] overflow-hidden">
            <Image
              src={doctor.profileImageUrl || "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&q=80&fit=crop&crop=face"}
              alt={`Dr. ${doctor.firstName} ${doctor.lastName}`}
              fill className="object-cover object-top transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            {doctor.rating && (
              <div className="absolute bottom-3 left-3 flex items-center gap-1 bg-white/90 backdrop-blur-sm rounded-full px-2.5 py-1 text-xs font-semibold">
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                {Number(doctor.rating).toFixed(1)}
                {doctor.reviewCount && <span className="text-[var(--color-fg-subtle)] font-normal">({doctor.reviewCount})</span>}
              </div>
            )}
            <div className="absolute top-3 right-3">
              <span className="flex items-center gap-1 bg-emerald-50 text-emerald-700 rounded-full px-2.5 py-0.5 text-xs font-medium border border-emerald-200">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Available
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="flex flex-col gap-3 p-5 flex-1">
            <div>
              <h3 className="font-semibold text-[var(--color-fg)]">Dr. {doctor.firstName} {doctor.lastName}</h3>
              <p className="text-sm text-[var(--color-brand-600)] font-medium mt-0.5">{doctor.specialty}</p>
              {doctor.subSpecialty && (
                <p className="text-xs text-[var(--color-fg-subtle)] mt-0.5">{doctor.subSpecialty}</p>
              )}
            </div>

            {doctor.bio && (
              <p className="text-sm text-[var(--color-fg-muted)] line-clamp-2 leading-relaxed">{doctor.bio}</p>
            )}

            <div className="flex flex-wrap gap-1.5 mt-auto">
              {doctor.yearsExperience && (
                <Badge variant="neutral">{doctor.yearsExperience}y exp</Badge>
              )}
              {doctor.languages?.slice(0, 2).map((lang) => (
                <Badge key={lang} variant="outline">{lang}</Badge>
              ))}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-[var(--color-border)] mt-1">
              <div>
                {doctor.consultationFee != null && (
                  <span className="text-sm font-semibold text-[var(--color-fg)]">
                    ${doctor.consultationFee}
                    <span className="text-xs font-normal text-[var(--color-fg-muted)]"> / visit</span>
                  </span>
                )}
              </div>
              <span className="flex items-center gap-1 text-sm font-medium text-[var(--color-brand-600)] group-hover:gap-1.5 transition-all">
                Book now <ChevronRight className="h-4 w-4" />
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

function DoctorCardSkeleton() {
  return (
    <div className="bg-[var(--color-surface)] rounded-[var(--radius-xl)] border border-[var(--color-border)] overflow-hidden">
      <Skeleton className="h-52 rounded-none" />
      <div className="p-5 flex flex-col gap-3">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
    </div>
  );
}

export default function DoctorsPage() {
  const [search, setSearch] = useState("");
  const [specialty, setSpecialty] = useState("All");
  const [page] = useState(1);
  const debouncedSearch = useDebounce(search, 350);

  const { data, isLoading } = useQuery<DoctorsResponse>({
    queryKey: ["doctors", debouncedSearch, specialty, page],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page), limit: "18" });
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (specialty !== "All") params.set("specialty", specialty);
      return api.get(`/doctors?${params.toString()}`);
    },
  });

  return (
    <div className="min-h-dvh pt-20">
      {/* Header */}
      <div className="bg-[var(--color-surface)] border-b border-[var(--color-border)]">
        <div className="container-xl py-10">
          <h1 className="font-display text-[clamp(1.8rem,4vw,2.5rem)] text-[var(--color-fg)] mb-2">
            Find your doctor
          </h1>
          <p className="text-[var(--color-fg-muted)] mb-7">
            Browse verified, licensed doctors across all specialties
          </p>

          {/* Search bar */}
          <div className="flex flex-col sm:flex-row gap-3 max-w-2xl">
            <div className="flex-1">
              <Input
                placeholder="Search by name or specialty…"
                leftIcon={<Search className="h-4 w-4" />}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-11"
              />
            </div>
            <Button variant="secondary" size="lg" className="gap-2 shrink-0">
              <SlidersHorizontal className="h-4 w-4" /> Filters
            </Button>
          </div>
        </div>
      </div>

      <div className="container-xl py-8">
        {/* Specialty pills */}
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar mb-8">
          {SPECIALTIES.map((s) => (
            <button
              key={s}
              onClick={() => setSpecialty(s)}
              className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium border transition-all duration-150 ${
                specialty === s
                  ? "bg-[var(--color-brand-600)] text-white border-[var(--color-brand-600)]"
                  : "bg-[var(--color-surface)] text-[var(--color-fg-muted)] border-[var(--color-border)] hover:border-[var(--color-brand-300)] hover:text-[var(--color-brand-700)]"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Results count */}
        {data && (
          <p className="text-sm text-[var(--color-fg-muted)] mb-6">
            {data.total} doctor{data.total !== 1 ? "s" : ""} found
          </p>
        )}

        {/* Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => <DoctorCardSkeleton key={i} />)
            : data?.doctors.map((doc, i) => (
                <DoctorCard key={doc.id} doctor={doc} index={i} />
              ))
          }
        </div>

        {!isLoading && (!data?.doctors || data.doctors.length === 0) && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="h-16 w-16 rounded-full bg-[var(--color-surface-2)] flex items-center justify-center mb-4">
              <Search className="h-7 w-7 text-[var(--color-fg-subtle)]" />
            </div>
            <p className="font-medium text-[var(--color-fg)]">No doctors found</p>
            <p className="text-sm text-[var(--color-fg-muted)] mt-1">Try a different search term or specialty</p>
          </div>
        )}
      </div>
    </div>
  );
}
