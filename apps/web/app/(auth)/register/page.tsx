"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Mail, Lock, User, Stethoscope } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api, ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";

const patientSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  gender: z.enum(["MALE", "FEMALE", "OTHER", "PREFER_NOT_TO_SAY"], { required_error: "Gender is required" }),
  phoneNumber: z.string().optional(),
});

const doctorSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  specialty: z.string().min(1, "Specialty is required"),
  licenseNumber: z.string().min(1, "License number is required"),
  licenseState: z.string().min(1, "License state is required"),
  consultationFee: z.coerce.number().positive("Enter a valid fee"),
  yearsExperience: z.coerce.number().int().positive("Enter valid years"),
  phoneNumber: z.string().optional(),
});

type PatientForm = z.infer<typeof patientSchema>;
type DoctorForm = z.infer<typeof doctorSchema>;

export default function RegisterPage() {
  const [role, setRole] = useState<"PATIENT" | "DOCTOR">("PATIENT");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const patientForm = useForm<PatientForm>({ resolver: zodResolver(patientSchema) });
  const doctorForm = useForm<DoctorForm>({ resolver: zodResolver(doctorSchema) });

  async function onPatientSubmit(values: PatientForm) {
    setError(null);
    try {
      await api.post("/auth/register/patient", values);
      setSuccess(true);
      setTimeout(() => router.push("/login"), 2500);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Registration failed.");
    }
  }

  async function onDoctorSubmit(values: DoctorForm) {
    setError(null);
    try {
      await api.post("/auth/register/doctor", values);
      setSuccess(true);
      setTimeout(() => router.push("/login"), 2500);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Registration failed.");
    }
  }

  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm text-center bg-[var(--color-surface)] rounded-[var(--radius-xl)] border border-[var(--color-border)] shadow-[var(--shadow-lg)] p-10"
      >
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
          <svg className="h-8 w-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="font-display text-2xl text-[var(--color-fg)] mb-2">Account created!</h2>
        <p className="text-sm text-[var(--color-fg-muted)]">
          Check your email to verify your account. Redirecting to sign in…
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full max-w-md"
    >
      <div className="bg-[var(--color-surface)] rounded-[var(--radius-xl)] border border-[var(--color-border)] shadow-[var(--shadow-lg)] p-8">
        <div className="mb-7">
          <h1 className="font-display text-2xl text-[var(--color-fg)]">Create your account</h1>
          <p className="text-sm text-[var(--color-fg-muted)] mt-1.5">Join MedFlow today — it&apos;s free</p>
        </div>

        {/* Role toggle */}
        <div className="flex gap-2 mb-6 p-1 bg-[var(--color-surface-2)] rounded-[var(--radius-lg)]">
          {(["PATIENT", "DOCTOR"] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRole(r)}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2 rounded-[var(--radius-md)] text-sm font-medium transition-all duration-150",
                role === r
                  ? "bg-[var(--color-surface)] text-[var(--color-fg)] shadow-[var(--shadow-xs)]"
                  : "text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]",
              )}
            >
              {r === "PATIENT" ? (
                <User className="h-4 w-4" />
              ) : (
                <Stethoscope className="h-4 w-4" />
              )}
              {r === "PATIENT" ? "I am a Patient" : "I am a Doctor"}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {role === "PATIENT" ? (
            <motion.form
              key="patient"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.25 }}
              onSubmit={patientForm.handleSubmit(onPatientSubmit)}
              className="flex flex-col gap-4"
            >
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label>First name</Label>
                  <Input placeholder="Jane" leftIcon={<User className="h-4 w-4" />} error={!!patientForm.formState.errors.firstName} {...patientForm.register("firstName")} />
                  {patientForm.formState.errors.firstName && <p className="text-xs text-[var(--color-danger)]">{patientForm.formState.errors.firstName.message}</p>}
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Last name</Label>
                  <Input placeholder="Doe" error={!!patientForm.formState.errors.lastName} {...patientForm.register("lastName")} />
                  {patientForm.formState.errors.lastName && <p className="text-xs text-[var(--color-danger)]">{patientForm.formState.errors.lastName.message}</p>}
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Email</Label>
                <Input type="email" placeholder="you@example.com" leftIcon={<Mail className="h-4 w-4" />} error={!!patientForm.formState.errors.email} {...patientForm.register("email")} />
                {patientForm.formState.errors.email && <p className="text-xs text-[var(--color-danger)]">{patientForm.formState.errors.email.message}</p>}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Date of birth</Label>
                <Input type="date" error={!!patientForm.formState.errors.dateOfBirth} {...patientForm.register("dateOfBirth")} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Gender</Label>
                <select
                  className={cn(
                    "h-10 w-full rounded-[var(--radius-md)] border bg-[var(--color-surface)] px-3 text-sm text-[var(--color-fg)] outline-none transition-colors focus:ring-2 focus:ring-[var(--color-brand-500)]",
                    patientForm.formState.errors.gender ? "border-[var(--color-danger)]" : "border-[var(--color-border)]"
                  )}
                  {...patientForm.register("gender")}
                >
                  <option value="">Select gender…</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                  <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
                </select>
                {patientForm.formState.errors.gender && <p className="text-xs text-[var(--color-danger)]">{patientForm.formState.errors.gender.message}</p>}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Password</Label>
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Min. 8 characters"
                  leftIcon={<Lock className="h-4 w-4" />}
                  rightIcon={<button type="button" onClick={() => setShowPassword(!showPassword)} className="hover:text-[var(--color-fg)]">{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>}
                  error={!!patientForm.formState.errors.password}
                  {...patientForm.register("password")}
                />
                {patientForm.formState.errors.password && <p className="text-xs text-[var(--color-danger)]">{patientForm.formState.errors.password.message}</p>}
              </div>
              {error && <div className="rounded-[var(--radius-md)] bg-red-50 border border-red-200 px-3.5 py-2.5 text-sm text-red-700">{error}</div>}
              <Button type="submit" size="lg" loading={patientForm.formState.isSubmitting} className="mt-1">Create account</Button>
            </motion.form>
          ) : (
            <motion.form
              key="doctor"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.25 }}
              onSubmit={doctorForm.handleSubmit(onDoctorSubmit)}
              className="flex flex-col gap-4"
            >
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label>First name</Label>
                  <Input placeholder="John" leftIcon={<User className="h-4 w-4" />} error={!!doctorForm.formState.errors.firstName} {...doctorForm.register("firstName")} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Last name</Label>
                  <Input placeholder="Smith" error={!!doctorForm.formState.errors.lastName} {...doctorForm.register("lastName")} />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Email</Label>
                <Input type="email" placeholder="doctor@clinic.com" leftIcon={<Mail className="h-4 w-4" />} error={!!doctorForm.formState.errors.email} {...doctorForm.register("email")} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label>Specialty</Label>
                  <Input placeholder="Cardiology" leftIcon={<Stethoscope className="h-4 w-4" />} error={!!doctorForm.formState.errors.specialty} {...doctorForm.register("specialty")} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>License #</Label>
                  <Input placeholder="MD-12345" error={!!doctorForm.formState.errors.licenseNumber} {...doctorForm.register("licenseNumber")} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label>License State</Label>
                  <Input placeholder="CA" error={!!doctorForm.formState.errors.licenseState} {...doctorForm.register("licenseState")} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Consultation Fee ($)</Label>
                  <Input type="number" placeholder="150" error={!!doctorForm.formState.errors.consultationFee} {...doctorForm.register("consultationFee")} />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Years of Experience</Label>
                <Input type="number" placeholder="5" error={!!doctorForm.formState.errors.yearsExperience} {...doctorForm.register("yearsExperience")} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Password</Label>
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Min. 8 characters"
                  leftIcon={<Lock className="h-4 w-4" />}
                  rightIcon={<button type="button" onClick={() => setShowPassword(!showPassword)} className="hover:text-[var(--color-fg)]">{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>}
                  error={!!doctorForm.formState.errors.password}
                  {...doctorForm.register("password")}
                />
                {doctorForm.formState.errors.password && <p className="text-xs text-[var(--color-danger)]">{doctorForm.formState.errors.password.message}</p>}
              </div>
              {error && <div className="rounded-[var(--radius-md)] bg-red-50 border border-red-200 px-3.5 py-2.5 text-sm text-red-700">{error}</div>}
              <Button type="submit" size="lg" loading={doctorForm.formState.isSubmitting} className="mt-1">Apply as Doctor</Button>
            </motion.form>
          )}
        </AnimatePresence>

        <p className="mt-5 text-center text-sm text-[var(--color-fg-muted)]">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-[var(--color-brand-600)] hover:underline">Sign in</Link>
        </p>
      </div>
    </motion.div>
  );
}
