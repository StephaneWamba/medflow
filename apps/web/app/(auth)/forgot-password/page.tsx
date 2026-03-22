"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api, ApiError } from "@/lib/api";

const schema = z.object({ email: z.string().email("Enter a valid email") });

export default function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
  });

  async function onSubmit({ email }: { email: string }) {
    try {
      await api.post("/auth/forgot-password", { email });
    } catch {
      // Always show success to prevent email enumeration
    } finally {
      setSubmitted(true);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full max-w-sm"
    >
      <div className="bg-[var(--color-surface)] rounded-[var(--radius-xl)] border border-[var(--color-border)] shadow-[var(--shadow-lg)] p-8">
        {submitted ? (
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-brand-100)]">
              <Mail className="h-6 w-6 text-[var(--color-brand-600)]" />
            </div>
            <h2 className="font-display text-xl text-[var(--color-fg)] mb-2">Check your email</h2>
            <p className="text-sm text-[var(--color-fg-muted)] leading-relaxed">
              If an account exists for that address, we&apos;ve sent a password reset link.
            </p>
            <Link href="/login" className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-[var(--color-brand-600)] hover:underline">
              <ArrowLeft className="h-4 w-4" /> Back to sign in
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <Link href="/login" className="inline-flex items-center gap-1.5 text-sm text-[var(--color-fg-muted)] hover:text-[var(--color-fg)] mb-4 transition-colors">
                <ArrowLeft className="h-4 w-4" /> Back to sign in
              </Link>
              <h1 className="font-display text-2xl text-[var(--color-fg)]">Reset your password</h1>
              <p className="text-sm text-[var(--color-fg-muted)] mt-1.5">
                Enter your email and we&apos;ll send a reset link.
              </p>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="email">Email address</Label>
                <Input id="email" type="email" placeholder="you@example.com" leftIcon={<Mail className="h-4 w-4" />} error={!!errors.email} {...register("email")} />
                {errors.email && <p className="text-xs text-[var(--color-danger)]">{errors.email.message}</p>}
              </div>
              <Button type="submit" size="lg" loading={isSubmitting}>Send reset link</Button>
            </form>
          </>
        )}
      </div>
    </motion.div>
  );
}
