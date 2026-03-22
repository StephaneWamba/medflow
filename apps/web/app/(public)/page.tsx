"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useInView } from "framer-motion";
import {
  Video, Shield, FileText, MessageSquare, Star, ArrowRight,
  CheckCircle2, Clock, Calendar, Award, Activity, ChevronRight,
  Mic, Phone, MoreHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

/* ─── Types ──────────────────────────────────────────────────────────────── */
interface Doctor {
  id: string;
  firstName: string;
  lastName: string;
  specialty: string;
  subSpecialty?: string;
  profileImageUrl?: string;
  rating?: number;
  reviewCount?: number;
  yearsExperience?: number;
  consultationFee?: number;
}

/* ─── Animation helpers ──────────────────────────────────────────────────── */
function FadeUp({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ─── Stats strip ────────────────────────────────────────────────────────── */
const stats = [
  { value: "12,000+", label: "Consultations" },
  { value: "500+", label: "Verified Doctors" },
  { value: "4.9★", label: "Avg. Rating" },
  { value: "24/7", label: "Availability" },
];

/* ─── How it works ───────────────────────────────────────────────────────── */
const steps = [
  {
    number: "01",
    icon: <Award className="h-6 w-6" />,
    title: "Find your doctor",
    description:
      "Search by specialty, language, availability, or name. Every doctor is licensed and verified.",
  },
  {
    number: "02",
    icon: <Calendar className="h-6 w-6" />,
    title: "Book a time slot",
    description:
      "Choose from real-time available slots. Receive an instant confirmation with a calendar invite.",
  },
  {
    number: "03",
    icon: <Video className="h-6 w-6" />,
    title: "Consult securely",
    description:
      "Join your private video consultation. Receive prescriptions and health records in your account.",
  },
];

/* ─── Features ───────────────────────────────────────────────────────────── */
const features = [
  {
    icon: <Video className="h-5 w-5" />,
    title: "HD Video Consultations",
    description: "Crystal-clear video powered by LiveKit. End-to-end encrypted, no third-party access.",
  },
  {
    icon: <Shield className="h-5 w-5" />,
    title: "HIPAA Compliant",
    description: "All health data is encrypted at rest and in transit. Your privacy is non-negotiable.",
  },
  {
    icon: <FileText className="h-5 w-5" />,
    title: "Digital Prescriptions",
    description: "Receive signed digital prescriptions following your consultation, sent directly to your account.",
  },
  {
    icon: <MessageSquare className="h-5 w-5" />,
    title: "Secure Messaging",
    description: "End-to-end encrypted messaging with your care team. Ask follow-up questions any time.",
  },
  {
    icon: <Activity className="h-5 w-5" />,
    title: "Health Records",
    description: "Your full medical history, vitals, and documents — organized and always accessible.",
  },
  {
    icon: <Clock className="h-5 w-5" />,
    title: "Appointment Reminders",
    description: "Automated reminders via email so you never miss a consultation.",
  },
];

/* ─── Doctor card ────────────────────────────────────────────────────────── */
function DoctorPreviewCard({ doctor, index }: { doctor: Doctor; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.45, ease: "easeOut" }}
      className="group shrink-0 w-64 bg-[var(--color-surface)] rounded-[var(--radius-xl)] border border-[var(--color-border)] shadow-[var(--shadow-sm)] overflow-hidden hover:shadow-[var(--shadow-md)] hover:border-[var(--color-brand-200)] transition-all duration-250"
    >
      {/* Photo */}
      <div className="relative h-44 bg-[var(--color-brand-50)] overflow-hidden">
        <Image
          src={
            doctor.profileImageUrl ||
            `https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&q=80&fit=crop&crop=face`
          }
          alt={`Dr. ${doctor.firstName} ${doctor.lastName}`}
          fill
          className="object-cover object-top transition-transform duration-500 group-hover:scale-105"
          sizes="256px"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        {doctor.rating && (
          <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-white/90 backdrop-blur-sm rounded-full px-2.5 py-1 text-xs font-semibold text-[var(--color-fg)]">
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
            {Number(doctor.rating).toFixed(1)}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <p className="font-semibold text-[var(--color-fg)] text-sm leading-tight">
          Dr. {doctor.firstName} {doctor.lastName}
        </p>
        <p className="text-xs text-[var(--color-brand-600)] font-medium mt-0.5">{doctor.specialty}</p>
        {doctor.yearsExperience && (
          <p className="text-xs text-[var(--color-fg-subtle)] mt-0.5">
            {doctor.yearsExperience} yrs experience
          </p>
        )}
        <div className="mt-3 flex items-center justify-between">
          {doctor.consultationFee != null && (
            <span className="text-xs font-semibold text-[var(--color-fg-muted)]">
              ${doctor.consultationFee}
              <span className="font-normal"> / visit</span>
            </span>
          )}
          <Link
            href={`/doctors/${doctor.id}`}
            className="text-xs font-medium text-[var(--color-brand-600)] hover:text-[var(--color-brand-700)] flex items-center gap-0.5 transition-colors"
          >
            View profile <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Placeholder doctor cards (shown while loading or no data) ─────────── */
const PLACEHOLDER_DOCTORS: Doctor[] = [
  { id: "1", firstName: "Sarah", lastName: "Chen", specialty: "Cardiology", yearsExperience: 12, rating: 4.9, reviewCount: 148, consultationFee: 85, profileImageUrl: "https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=400&q=80&fit=crop&crop=face" },
  { id: "2", firstName: "James", lastName: "Okafor", specialty: "Internal Medicine", yearsExperience: 8, rating: 4.8, reviewCount: 92, consultationFee: 75, profileImageUrl: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&q=80&fit=crop&crop=face" },
  { id: "3", firstName: "Priya", lastName: "Sharma", specialty: "Dermatology", yearsExperience: 10, rating: 4.9, reviewCount: 203, consultationFee: 90, profileImageUrl: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&q=80&fit=crop&crop=face" },
  { id: "4", firstName: "Marcus", lastName: "Weber", specialty: "Psychiatry", yearsExperience: 15, rating: 4.7, reviewCount: 76, consultationFee: 110, profileImageUrl: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&q=80&fit=crop&crop=face" },
  { id: "5", firstName: "Aisha", lastName: "Hassan", specialty: "Pediatrics", yearsExperience: 9, rating: 5.0, reviewCount: 117, consultationFee: 80, profileImageUrl: "https://images.unsplash.com/photo-1527613426441-4da17471b66d?w=400&q=80&fit=crop&crop=face" },
];

/* ─── Animated ECG waveform ─────────────────────────────────────────────── */
function HeartbeatLine() {
  const pattern = "M0,14 L18,14 L25,14 L30,4 L34,24 L38,14 L50,14 L68,14 L75,14 L80,4 L84,24 L88,14 L100,14 L118,14 L125,14 L130,4 L134,24 L138,14 L150,14 L168,14 L175,14 L180,4 L184,24 L188,14 L200,14";
  return (
    <div className="h-7 overflow-hidden relative">
      <motion.div
        className="absolute flex"
        style={{ width: "200%" }}
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 2.6, ease: "linear", repeat: Infinity }}
      >
        {[0, 1].map((i) => (
          <svg key={i} viewBox="0 0 200 28" preserveAspectRatio="none" style={{ width: "50%", height: "28px", minWidth: "50%" }}>
            <path d={pattern} fill="none" stroke="oklch(0.86 0.065 193)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" />
          </svg>
        ))}
      </motion.div>
    </div>
  );
}

/* ─── Live duration counter ──────────────────────────────────────────────── */
function DurationCounter() {
  const [secs, setSecs] = useState(754);
  useEffect(() => {
    const t = setInterval(() => setSecs((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, []);
  const m = Math.floor(secs / 60).toString().padStart(2, "0");
  const s = (secs % 60).toString().padStart(2, "0");
  return <span className="text-xs font-mono text-white">{m}:{s}</span>;
}

/* ─── Telehealth video-call mockup ───────────────────────────────────────── */
function TelehealthMockup() {
  return (
    <div className="relative overflow-hidden rounded-[var(--radius-xl)] shadow-[var(--shadow-xl)] aspect-[4/5] max-h-[620px] bg-slate-800">
      {/* Doctor "video feed" */}
      <Image
        src="https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=900&q=85&fit=crop&crop=top"
        alt="Doctor conducting a secure video consultation"
        fill
        className="object-cover object-top opacity-90"
        priority
        sizes="(max-width: 1280px) 50vw, 640px"
      />
      {/* Cinematic gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-transparent to-slate-900/30" />

      {/* LIVE badge */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.4 }}
        className="absolute top-4 left-4 flex items-center gap-2 bg-black/50 backdrop-blur-sm rounded-full px-3 py-1.5"
      >
        <motion.div
          className="h-2 w-2 rounded-full bg-red-400"
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ duration: 1.4, repeat: Infinity }}
        />
        <span className="text-[11px] font-semibold text-white tracking-widest">LIVE</span>
      </motion.div>

      {/* Duration counter */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.65, duration: 0.4 }}
        className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm rounded-full px-3 py-1.5"
      >
        <DurationCounter />
      </motion.div>

      {/* Patient picture-in-picture */}
      <motion.div
        initial={{ opacity: 0, scale: 0.88 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.95, duration: 0.4 }}
        className="absolute bottom-28 right-4 w-24 h-32 rounded-xl overflow-hidden border-2 border-white/25 shadow-[0_4px_24px_rgba(0,0,0,0.4)]"
      >
        <Image
          src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&q=80&fit=crop&crop=face"
          alt="Patient on video call"
          fill
          className="object-cover"
          sizes="96px"
        />
        <div className="absolute bottom-1.5 left-0 right-0 flex justify-center">
          <span className="text-[9px] font-medium text-white/80 bg-black/40 rounded-full px-2 py-0.5">You</span>
        </div>
      </motion.div>

      {/* Bottom controls */}
      <div className="absolute bottom-0 left-0 right-0 px-5 pb-5 pt-2">
        <HeartbeatLine />
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.4 }}
          className="flex items-center justify-center gap-3 mt-2"
        >
          {[
            { Icon: Mic },
            { Icon: Video },
          ].map(({ Icon }, i) => (
            <div key={i} className="h-10 w-10 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center ring-1 ring-white/20">
              <Icon className="h-4 w-4 text-white" />
            </div>
          ))}
          <motion.div whileHover={{ scale: 1.08 }} className="h-12 w-12 rounded-full bg-red-500 flex items-center justify-center shadow-lg cursor-pointer">
            <Phone className="h-5 w-5 text-white rotate-[135deg]" />
          </motion.div>
          {[
            { Icon: MessageSquare },
            { Icon: MoreHorizontal },
          ].map(({ Icon }, i) => (
            <div key={i} className="h-10 w-10 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center ring-1 ring-white/20">
              <Icon className="h-4 w-4 text-white" />
            </div>
          ))}
        </motion.div>
        <p className="text-center text-[11px] text-white/55 mt-2.5 tracking-wide">
          Secure consultation · End-to-end encrypted
        </p>
      </div>
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────────────────────────── */
export default function LandingPage() {
  const { data: doctorsData } = useQuery({
    queryKey: ["doctors-landing"],
    queryFn: () => api.get<{ doctors: Doctor[] }>("/doctors?limit=6"),
    staleTime: 5 * 60_000,
  });

  const doctors =
    doctorsData?.doctors && doctorsData.doctors.length > 0
      ? doctorsData.doctors
      : PLACEHOLDER_DOCTORS;

  return (
    <div className="overflow-x-hidden">
      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section
        className="relative min-h-[100dvh] flex items-center pt-16"
        style={{ background: "var(--color-canvas)" }}
      >
        {/* Subtle background pattern */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle at 25% 35%, oklch(0.86 0.065 193 / 0.18) 0%, transparent 55%), radial-gradient(circle at 75% 65%, oklch(0.93 0.035 193 / 0.12) 0%, transparent 50%)`,
          }}
        />

        <div className="container-xl relative z-10">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16 items-center">
            {/* Text column */}
            <div>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="inline-flex items-center gap-2 rounded-full border border-[var(--color-brand-200)] bg-[var(--color-brand-50)] px-3.5 py-1.5 text-xs font-medium text-[var(--color-brand-700)] mb-8"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-brand-500)] animate-pulse" />
                500+ licensed doctors available now
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="font-display text-[clamp(2.6rem,5.5vw,4rem)] leading-[1.08] tracking-[-0.025em] text-[var(--color-fg)]"
              >
                Healthcare,
                <br />
                <em className="not-italic text-[var(--color-brand-600)]">delivered</em>{" "}
                with precision.
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.32 }}
                className="mt-6 text-lg text-[var(--color-fg-muted)] leading-relaxed max-w-[44ch]"
              >
                Connect with verified, licensed doctors via secure video consultations.
                Book in minutes, receive prescriptions, manage your health — all in one place.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.44 }}
                className="mt-8 flex flex-wrap gap-3"
              >
                <Link href="/doctors">
                  <Button variant="primary" size="xl" className="gap-2">
                    Find a Doctor
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/register">
                  <Button variant="secondary" size="xl">
                    Create free account
                  </Button>
                </Link>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="mt-10 flex flex-wrap items-center gap-5"
              >
                {[
                  "No waiting rooms",
                  "Digital prescriptions",
                  "Full medical records",
                ].map((txt) => (
                  <span
                    key={txt}
                    className="flex items-center gap-1.5 text-sm text-[var(--color-fg-muted)]"
                  >
                    <CheckCircle2 className="h-4 w-4 text-[var(--color-success)]" />
                    {txt}
                  </span>
                ))}
              </motion.div>
            </div>

            {/* Telehealth mockup column */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="relative hidden lg:block"
            >
              <TelehealthMockup />

              {/* Floating card: doctors available */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 1.1 }}
                className="glass absolute -bottom-4 left-2 rounded-[var(--radius-xl)] shadow-[var(--shadow-lg)] p-4 flex items-center gap-3"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand-100)]">
                  <motion.div
                    className="h-3 w-3 rounded-full bg-[var(--color-success)]"
                    animate={{ scale: [1, 1.4, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                </div>
                <div>
                  <p className="text-xs font-semibold text-[var(--color-fg)]">Doctors available now</p>
                  <p className="text-sm font-medium text-[var(--color-brand-600)] mt-0.5">Consult within minutes</p>
                </div>
              </motion.div>

              {/* Floating card: patient trust */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 1.2 }}
                className="glass absolute -top-4 right-2 rounded-[var(--radius-xl)] shadow-[var(--shadow-lg)] p-4"
              >
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-7 w-7 rounded-full border-2 border-white overflow-hidden bg-[var(--color-brand-100)]">
                        <Image
                          src={`https://images.unsplash.com/photo-${i === 1 ? "1494790108377-be9c29b29330" : i === 2 ? "1599566150163-29194dcaad36" : "1527980965255-d3b416303d12"}?w=60&q=70&fit=crop&crop=face`}
                          alt="patient"
                          width={28}
                          height={28}
                          className="object-cover"
                        />
                      </div>
                    ))}
                  </div>
                  <div>
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Star key={i} className="h-3 w-3 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <p className="text-xs text-[var(--color-fg-muted)] mt-0.5">Trusted by patients</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Stats Strip ───────────────────────────────────────────────────── */}
      <section className="bg-[var(--color-surface)] border-y border-[var(--color-border)]">
        <div className="container-xl py-10">
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {stats.map((stat, i) => (
              <FadeUp key={stat.label} delay={i * 0.08}>
                <div className="text-center">
                  <p className="text-3xl font-semibold tracking-tight text-[var(--color-brand-700)]">
                    {stat.value}
                  </p>
                  <p className="mt-1 text-sm text-[var(--color-fg-muted)]">{stat.label}</p>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it Works ──────────────────────────────────────────────────── */}
      <section id="how-it-works" className="section bg-[var(--color-canvas)]">
        <div className="container-lg">
          <FadeUp className="text-center mb-14">
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-brand-600)] mb-3">
              Simple process
            </p>
            <h2 className="font-display text-[clamp(2rem,4vw,2.75rem)] leading-tight text-[var(--color-fg)]">
              Three steps to better health
            </h2>
          </FadeUp>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {steps.map((step, i) => (
              <FadeUp key={step.number} delay={i * 0.12}>
                <div className="relative bg-[var(--color-surface)] rounded-[var(--radius-xl)] border border-[var(--color-border)] p-8 shadow-[var(--shadow-sm)] group hover:border-[var(--color-brand-200)] hover:shadow-[var(--shadow-md)] transition-all duration-250">
                  <div className="absolute top-6 right-6 font-display text-5xl text-[var(--color-border-2)] select-none">
                    {step.number}
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-[var(--radius-lg)] bg-[var(--color-brand-100)] text-[var(--color-brand-700)] mb-5 group-hover:bg-[var(--color-brand-200)] transition-colors">
                    {step.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-[var(--color-fg)] mb-2">{step.title}</h3>
                  <p className="text-sm text-[var(--color-fg-muted)] leading-relaxed">{step.description}</p>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ── Doctor Carousel ───────────────────────────────────────────────── */}
      <section className="section bg-[var(--color-surface)] border-y border-[var(--color-border)]">
        <div className="container-xl">
          <FadeUp className="mb-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-brand-600)] mb-2">
                Our doctors
              </p>
              <h2 className="font-display text-[clamp(2rem,4vw,2.75rem)] leading-tight text-[var(--color-fg)]">
                Meet your care team
              </h2>
            </div>
            <Link href="/doctors">
              <Button variant="outline" size="md" className="shrink-0 gap-2">
                View all doctors <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </FadeUp>

          <div className="flex gap-5 overflow-x-auto pb-4 no-scrollbar">
            {doctors.map((doc, i) => (
              <DoctorPreviewCard key={doc.id} doctor={doc} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Features Grid ─────────────────────────────────────────────────── */}
      <section id="features" className="section bg-[var(--color-canvas)]">
        <div className="container-lg">
          <FadeUp className="text-center mb-14">
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-brand-600)] mb-3">
              Everything you need
            </p>
            <h2 className="font-display text-[clamp(2rem,4vw,2.75rem)] leading-tight text-[var(--color-fg)]">
              Built for modern healthcare
            </h2>
            <p className="mt-4 text-[var(--color-fg-muted)] max-w-[52ch] mx-auto">
              MedFlow brings together the tools patients and doctors need — in a single,
              secure, beautifully designed platform.
            </p>
          </FadeUp>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <FadeUp key={f.title} delay={i * 0.07}>
                <div className="bg-[var(--color-surface)] rounded-[var(--radius-xl)] border border-[var(--color-border)] p-6 shadow-[var(--shadow-xs)] group hover:border-[var(--color-brand-200)] hover:shadow-[var(--shadow-sm)] transition-all duration-250">
                  <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-brand-50)] text-[var(--color-brand-600)] mb-4 group-hover:bg-[var(--color-brand-100)] transition-colors">
                    {f.icon}
                  </div>
                  <h3 className="text-sm font-semibold text-[var(--color-fg)] mb-1.5">{f.title}</h3>
                  <p className="text-sm text-[var(--color-fg-muted)] leading-relaxed">{f.description}</p>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ── Trust Badges ──────────────────────────────────────────────────── */}
      <section className="bg-[var(--color-surface)] border-y border-[var(--color-border)]">
        <div className="container-xl py-10">
          <FadeUp>
            <div className="flex flex-wrap items-center justify-center gap-8 text-sm font-medium text-[var(--color-fg-muted)]">
              {[
                { icon: <Shield className="h-4 w-4" />, text: "HIPAA Compliant" },
                { icon: <CheckCircle2 className="h-4 w-4" />, text: "Licensed Doctors Only" },
                { icon: <Shield className="h-4 w-4" />, text: "256-bit Encryption" },
                { icon: <Star className="h-4 w-4" />, text: "4.9★ Average Rating" },
                { icon: <Clock className="h-4 w-4" />, text: "24/7 Support" },
              ].map((item) => (
                <div key={item.text} className="flex items-center gap-2 text-[var(--color-fg-subtle)]">
                  <span className="text-[var(--color-brand-500)]">{item.icon}</span>
                  {item.text}
                </div>
              ))}
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────────── */}
      <section
        className="section relative overflow-hidden"
        style={{ background: "var(--color-brand-700)" }}
      >
        {/* Subtle glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(ellipse at 30% 50%, oklch(0.53 0.115 193 / 0.5) 0%, transparent 60%)`,
          }}
        />
        <div className="container-lg relative z-10 text-center">
          <FadeUp>
            <h2 className="font-display text-[clamp(2rem,4.5vw,3.25rem)] leading-tight text-white mb-5">
              Your health deserves
              <br />
              expert care.
            </h2>
            <p className="text-[oklch(0.82_0.04_193)] text-lg max-w-[44ch] mx-auto mb-10">
              Thousands of patients connect with licensed doctors through MedFlow every month — conveniently, securely, and on their schedule.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/register">
                <Button
                  size="xl"
                  className="bg-white text-[var(--color-brand-800)] hover:bg-[var(--color-brand-50)] shadow-[var(--shadow-lg)] gap-2"
                >
                  Get started for free
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/doctors">
                <Button
                  size="xl"
                  className="bg-transparent text-white border border-white/30 hover:bg-white/10 hover:border-white/50"
                >
                  Browse doctors
                </Button>
              </Link>
            </div>
            <p className="mt-6 text-sm text-[oklch(0.72_0.04_193)]">
              No credit card required · Cancel anytime
            </p>
            <p className="mt-3 text-xs text-[oklch(0.62_0.03_193)]">
              For non-emergency consultations only. If you are experiencing a medical emergency, call 911 immediately.
            </p>
          </FadeUp>
        </div>
      </section>
    </div>
  );
}
