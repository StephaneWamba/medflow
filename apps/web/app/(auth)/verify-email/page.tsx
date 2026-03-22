"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api, ApiError } from "@/lib/api";

function VerifyEmailContent() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) { setStatus("error"); setMessage("No verification token provided."); return; }
    api.get(`/auth/verify-email?token=${token}`)
      .then(() => { setStatus("success"); setTimeout(() => router.push("/login"), 2000); })
      .catch((err) => {
        setStatus("error");
        setMessage(err instanceof ApiError ? err.message : "Verification failed.");
      });
  }, [token, router]);

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
      <div className="bg-[var(--color-surface)] rounded-[var(--radius-xl)] border border-[var(--color-border)] shadow-[var(--shadow-lg)] p-8 text-center">
        {status === "loading" && (
          <>
            <Loader2 className="h-10 w-10 text-[var(--color-brand-500)] animate-spin mx-auto mb-4" />
            <h2 className="font-display text-xl text-[var(--color-fg)]">Verifying your email…</h2>
          </>
        )}
        {status === "success" && (
          <>
            <CheckCircle2 className="h-12 w-12 text-[var(--color-success)] mx-auto mb-4" />
            <h2 className="font-display text-xl text-[var(--color-fg)] mb-2">Email verified!</h2>
            <p className="text-sm text-[var(--color-fg-muted)]">Redirecting to sign in…</p>
          </>
        )}
        {status === "error" && (
          <>
            <XCircle className="h-12 w-12 text-[var(--color-danger)] mx-auto mb-4" />
            <h2 className="font-display text-xl text-[var(--color-fg)] mb-2">Verification failed</h2>
            <p className="text-sm text-[var(--color-fg-muted)] mb-6">{message}</p>
            <Link href="/login"><Button variant="primary" size="md">Go to sign in</Button></Link>
          </>
        )}
      </div>
    </motion.div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="w-full max-w-sm bg-[var(--color-surface)] rounded-[var(--radius-xl)] border border-[var(--color-border)] shadow-[var(--shadow-lg)] p-8 text-center">
        <Loader2 className="h-10 w-10 text-[var(--color-brand-500)] animate-spin mx-auto mb-4" />
        <p className="text-sm text-[var(--color-fg-muted)]">Loading…</p>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
