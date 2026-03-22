"use client";

import React, { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { Save, CheckCircle2, AlertCircle, Stethoscope, Shield, Star, DollarSign, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api, ApiError } from "@/lib/api";

interface DoctorProfile {
  id: string; firstName: string; lastName: string;
  specialty: string; licenseNumber: string; yearsExperience: number;
  consultationFee: string; bio: string | null; languages: string[];
  isAcceptingNew: boolean; isVerified: boolean;
  rating: string | null; reviewCount: number;
  user: { email: string; emailVerified: boolean; createdAt: string };
}


const profileSchema = z.object({
  bio: z.string().optional(),
  consultationFee: z.coerce.number().min(0).optional(),
  languages: z.string().optional(),
  isAcceptingNew: z.boolean().optional(),
});
type ProfileForm = z.infer<typeof profileSchema>;

export default function DoctorProfilePage() {
  const queryClient = useQueryClient();

  const { data: profile } = useQuery<DoctorProfile>({
    queryKey: ["doctor-me"],
    queryFn: () => api.get("/doctors/me"),
  });

  const { register, handleSubmit, reset, formState: { isDirty } } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
  });

  useEffect(() => {
    if (profile) {
      reset({
        bio: profile.bio ?? "",
        consultationFee: parseFloat(profile.consultationFee ?? "0"),
        languages: (profile.languages ?? []).join(", "),
        isAcceptingNew: profile.isAcceptingNew ?? true,
      });
    }
  }, [profile, reset]);

  const mutation = useMutation({
    mutationFn: (data: ProfileForm) => api.patch("/doctors/me/profile", {
      bio: data.bio,
      consultationFee: data.consultationFee,
      isAcceptingNew: data.isAcceptingNew ?? true,
      languages: data.languages ? data.languages.split(",").map((l) => l.trim()).filter(Boolean) : [],
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["doctor-me"] });
      reset(undefined, { keepValues: true });
    },
  });

  const initials = profile ? `${profile.firstName[0]}${profile.lastName[0]}`.toUpperCase() : "??";

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="font-display text-2xl text-[var(--color-fg)]">My Profile</h1>
        <p className="text-sm text-[var(--color-fg-muted)] mt-0.5">Visible to patients when booking</p>
      </div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="flex flex-col gap-5">
        {/* Account info */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-5">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand-100)] text-[var(--color-brand-700)] text-xl font-semibold">
                {initials}
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-[var(--color-fg)]">
                  Dr. {profile?.firstName} {profile?.lastName}
                </h2>
                <p className="text-sm text-[var(--color-brand-600)] mt-0.5">{profile?.specialty}</p>
                <p className="text-xs text-[var(--color-fg-muted)] mt-0.5">{profile?.user?.email}</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                {profile?.isVerified && (
                  <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-700">
                    <Shield className="h-3 w-3" /> Verified
                  </div>
                )}
                {profile?.rating && (
                  <div className="flex items-center gap-1 text-sm font-semibold text-amber-600">
                    <Star className="h-4 w-4 fill-current" />
                    {parseFloat(profile.rating).toFixed(1)}
                    <span className="font-normal text-xs text-[var(--color-fg-subtle)]">({profile.reviewCount})</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* License info (read-only) */}
        {profile?.licenseNumber && (
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Stethoscope className="h-4 w-4 text-[var(--color-brand-500)]" /> License Information</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-[var(--color-fg-subtle)] mb-0.5">License Number</p>
                  <p className="font-medium text-[var(--color-fg)]">{profile.licenseNumber}</p>
                </div>
                <div>
                  <p className="text-xs text-[var(--color-fg-subtle)] mb-0.5">Specialty</p>
                  <p className="font-medium text-[var(--color-fg)]">{profile.specialty}</p>
                </div>
              </div>
              <p className="text-xs text-[var(--color-fg-subtle)] mt-3">License details cannot be changed after verification. Contact support to update.</p>
            </CardContent>
          </Card>
        )}

        {/* Editable profile */}
        <Card>
          <CardHeader><CardTitle>Professional Details</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-semibold text-[var(--color-fg-muted)] uppercase tracking-wide mb-1.5 block">Bio</label>
                <textarea
                  rows={4}
                  placeholder="Tell patients about your background, approach to care, and areas of expertise…"
                  className="w-full rounded-[var(--radius-md)] border border-[var(--color-border-2)] bg-[var(--color-surface)] p-3 text-sm text-[var(--color-fg)] resize-none focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-200)] focus:border-[var(--color-brand-400)] transition-colors"
                  {...register("bio")}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-[var(--color-fg-muted)] uppercase tracking-wide mb-1.5 block">Consultation fee (USD)</label>
                <Input type="number" placeholder="e.g. 75" leftIcon={<DollarSign className="h-4 w-4" />} {...register("consultationFee")} />
              </div>
              <div>
                <label className="text-xs font-semibold text-[var(--color-fg-muted)] uppercase tracking-wide mb-1.5 block">Languages (comma-separated)</label>
                <Input placeholder="e.g. English, Spanish, French" leftIcon={<Globe className="h-4 w-4" />} {...register("languages")} />
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" id="accepting" {...register("isAcceptingNew")} className="h-4 w-4 rounded border-[var(--color-border-2)] text-[var(--color-brand-600)]" />
                <label htmlFor="accepting" className="text-sm text-[var(--color-fg)]">Accepting new patients</label>
              </div>

              {mutation.isError && (
                <div className="flex items-center gap-2 rounded-[var(--radius-md)] bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {mutation.error instanceof ApiError ? ((mutation.error.body as { message?: string })?.message ?? "Save failed") : "Save failed"}
                </div>
              )}
              {mutation.isSuccess && (
                <div className="flex items-center gap-2 rounded-[var(--radius-md)] bg-emerald-50 border border-emerald-200 px-3 py-2 text-sm text-emerald-700">
                  <CheckCircle2 className="h-4 w-4 shrink-0" /> Profile saved successfully
                </div>
              )}

              <Button type="submit" className="gap-2 self-start" loading={mutation.isPending} disabled={!isDirty && !mutation.isError}>
                <Save className="h-4 w-4" /> Save changes
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
