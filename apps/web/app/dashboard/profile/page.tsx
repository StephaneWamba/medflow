"use client";

import React, { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { Mail, Phone, Calendar, Shield, Save, CheckCircle2, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api, ApiError } from "@/lib/api";
import { useAuthStore } from "@/stores/auth.store";

interface PatientProfile {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  phoneNumber: string | null;
  bloodType: string;
  allergies: string[];
  chronicConditions: string[];
  address: { street: string; city: string; state: string; country: string; zip: string } | null;
  user: { email: string; emailVerified: boolean; createdAt: string };
}

// Display ↔ API enum mapping
const BLOOD_TYPE_DISPLAY = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as const;
const BLOOD_TYPE_TO_API: Record<string, string> = {
  "A+": "A_POSITIVE", "A-": "A_NEGATIVE",
  "B+": "B_POSITIVE", "B-": "B_NEGATIVE",
  "AB+": "AB_POSITIVE", "AB-": "AB_NEGATIVE",
  "O+": "O_POSITIVE", "O-": "O_NEGATIVE",
};
const BLOOD_TYPE_FROM_API: Record<string, string> = Object.fromEntries(
  Object.entries(BLOOD_TYPE_TO_API).map(([k, v]) => [v, k])
);

const profileSchema = z.object({
  phoneNumber: z.string().optional(),
  bloodType: z.string().optional(),
});

type ProfileForm = z.infer<typeof profileSchema>;

export default function PatientProfilePage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useQuery<PatientProfile>({
    queryKey: ["patient-profile"],
    queryFn: () => api.get("/patients/me"),
  });

  const { register, handleSubmit, reset, formState: { isDirty } } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
  });

  useEffect(() => {
    if (profile) {
      reset({
        phoneNumber: profile.phoneNumber ?? "",
        bloodType: BLOOD_TYPE_FROM_API[profile.bloodType] ?? "",
      });
    }
  }, [profile, reset]);

  const mutation = useMutation({
    mutationFn: (data: ProfileForm) => {
      const payload: Record<string, string> = {};
      if (data.phoneNumber !== undefined) payload.phoneNumber = data.phoneNumber;
      if (data.bloodType) payload.bloodType = BLOOD_TYPE_TO_API[data.bloodType] ?? data.bloodType;
      return api.patch("/patients/me", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patient-profile"] });
      reset(undefined, { keepValues: true });
    },
  });

  const onSubmit = (data: ProfileForm) => mutation.mutate(data);

  const initials = profile
    ? `${profile.firstName?.[0] ?? ""}${profile.lastName?.[0] ?? ""}`.toUpperCase() || "??"
    : "??";

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="font-display text-2xl text-[var(--color-fg)]">My Profile</h1>
        <p className="text-sm text-[var(--color-fg-muted)] mt-0.5">Manage your personal information</p>
      </div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="flex flex-col gap-5">
        {/* Avatar + account info */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-5">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand-100)] text-[var(--color-brand-700)] text-xl font-semibold">
                {initials}
              </div>
              <div>
                <h2 className="text-lg font-semibold text-[var(--color-fg)]">
                  {profile ? `${profile.firstName} ${profile.lastName}` : "—"}
                </h2>
                <div className="flex items-center gap-1.5 text-sm text-[var(--color-fg-muted)] mt-0.5">
                  <Mail className="h-3.5 w-3.5" />
                  {profile?.user?.email ?? "—"}
                </div>
                {profile?.user?.emailVerified && (
                  <div className="flex items-center gap-1 text-xs text-emerald-600 mt-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Email verified
                  </div>
                )}
              </div>
              <div className="ml-auto">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--color-brand-50)] border border-[var(--color-brand-200)]">
                  <Shield className="h-3.5 w-3.5 text-[var(--color-brand-600)]" />
                  <span className="text-xs font-semibold text-[var(--color-brand-700)]">Patient</span>
                </div>
              </div>
            </div>

            {profile?.dateOfBirth && (
              <div className="mt-4 pt-4 border-t border-[var(--color-border)] flex items-center gap-2 text-sm text-[var(--color-fg-muted)]">
                <Calendar className="h-4 w-4 shrink-0" />
                Date of birth: {format(new Date(profile.dateOfBirth), "MMMM d, yyyy")}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Editable info */}
        <Card>
          <CardHeader>
            <CardTitle>Contact & Medical Info</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-semibold text-[var(--color-fg-muted)] uppercase tracking-wide mb-1.5 block">Phone</label>
                <Input
                  placeholder="+1 (555) 000-0000"
                  leftIcon={<Phone className="h-4 w-4" />}
                  {...register("phoneNumber")}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-[var(--color-fg-muted)] uppercase tracking-wide mb-1.5 block">Blood Type</label>
                <select
                  className="flex h-10 w-full items-center justify-between rounded-[var(--radius-md)] border border-[var(--color-border-2)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-fg)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-200)] focus:border-[var(--color-brand-400)] transition-colors"
                  {...register("bloodType")}
                >
                  <option value="">Select blood type</option>
                  {BLOOD_TYPE_DISPLAY.map((bt) => <option key={bt} value={bt}>{bt}</option>)}
                </select>
              </div>

              {mutation.isError && (
                <div className="flex items-center gap-2 rounded-[var(--radius-md)] bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {mutation.error instanceof ApiError ? ((mutation.error.body as { message?: string })?.message ?? "Save failed") : "Save failed"}
                </div>
              )}
              {mutation.isSuccess && (
                <div className="flex items-center gap-2 rounded-[var(--radius-md)] bg-emerald-50 border border-emerald-200 px-3 py-2 text-sm text-emerald-700">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  Profile saved successfully
                </div>
              )}

              <Button
                type="submit"
                className="gap-2 self-start"
                loading={mutation.isPending}
                disabled={!isDirty && !mutation.isError}
              >
                <Save className="h-4 w-4" /> Save changes
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Medical summary */}
        {(profile?.allergies?.length || profile?.chronicConditions?.length) ? (
          <Card>
            <CardHeader><CardTitle>Medical Summary</CardTitle></CardHeader>
            <CardContent className="flex flex-col gap-4">
              {profile.allergies && profile.allergies.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-[var(--color-fg-muted)] uppercase tracking-wide mb-2">Allergies</p>
                  <div className="flex flex-wrap gap-2">
                    {profile.allergies.map((a) => (
                      <span key={a} className="px-2.5 py-0.5 rounded-full bg-red-50 border border-red-200 text-xs font-medium text-red-700">{a}</span>
                    ))}
                  </div>
                </div>
              )}
              {profile.chronicConditions && profile.chronicConditions.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-[var(--color-fg-muted)] uppercase tracking-wide mb-2">Chronic Conditions</p>
                  <div className="flex flex-wrap gap-2">
                    {profile.chronicConditions.map((c) => (
                      <span key={c} className="px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-xs font-medium text-amber-700">{c}</span>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ) : null}
      </motion.div>
    </div>
  );
}
