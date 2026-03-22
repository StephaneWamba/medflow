"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api, ApiError } from "@/lib/api";
import { useAuthStore, type AuthUser } from "@/stores/auth.store";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});
type FormValues = z.infer<typeof schema>;

interface LoginResponse {
  token: string;
  user: { id: string; email: string; role: string; emailVerified: boolean };
  patient?: { id: string; firstName: string; lastName: string };
  doctor?: { id: string; firstName: string; lastName: string };
}

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login } = useAuthStore();
  const router = useRouter();

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(values: FormValues) {
    setError(null);
    try {
      const data = await api.post<LoginResponse>("/auth/login", values);
      const profile = data.patient ?? data.doctor;
      const user: AuthUser = {
        id: data.user.id,
        email: data.user.email,
        role: data.user.role as AuthUser["role"],
        emailVerified: data.user.emailVerified,
        profileId: profile?.id ?? null,
        firstName: profile?.firstName,
        lastName: profile?.lastName,
      };
      login(data.token, user);

      if (user.role === "DOCTOR") router.push("/doctor");
      else if (user.role === "ADMIN") router.push("/admin");
      else router.push("/dashboard");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Something went wrong. Please try again.");
      }
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="w-full max-w-sm"
    >
      <div className="bg-[var(--color-surface)] rounded-[var(--radius-xl)] border border-[var(--color-border)] shadow-[var(--shadow-lg)] p-8">
        <div className="mb-7">
          <h1 className="font-display text-2xl text-[var(--color-fg)]">Welcome back</h1>
          <p className="text-sm text-[var(--color-fg-muted)] mt-1.5">
            Sign in to your MedFlow account
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">Email address</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              leftIcon={<Mail className="h-4 w-4" />}
              error={!!errors.email}
              {...register("email")}
            />
            {errors.email && (
              <p className="text-xs text-[var(--color-danger)]">{errors.email.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link href="/forgot-password" className="text-xs text-[var(--color-brand-600)] hover:underline">
                Forgot password?
              </Link>
            </div>
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              leftIcon={<Lock className="h-4 w-4" />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="hover:text-[var(--color-fg)] transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              }
              error={!!errors.password}
              {...register("password")}
            />
            {errors.password && (
              <p className="text-xs text-[var(--color-danger)]">{errors.password.message}</p>
            )}
          </div>

          {error && (
            <div className="rounded-[var(--radius-md)] bg-red-50 border border-red-200 px-3.5 py-2.5 text-sm text-red-700">
              {error}
            </div>
          )}

          <Button type="submit" variant="primary" size="lg" loading={isSubmitting} className="mt-1">
            Sign in
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-[var(--color-fg-muted)]">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="font-medium text-[var(--color-brand-600)] hover:underline">
            Create one
          </Link>
        </p>
      </div>
    </motion.div>
  );
}
