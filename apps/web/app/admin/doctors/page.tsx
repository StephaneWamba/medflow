"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { UserCheck, UserX, Search, Shield, Star, Clock } from "lucide-react";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { api } from "@/lib/api";
import { useDebounce } from "@/hooks/useDebounce";

interface Doctor {
  id: string; firstName: string; lastName: string; specialty: string;
  licenseNumber: string; isVerified: boolean; yearsExperience: number;
  rating: string | null; reviewCount: number; createdAt: string;
  user: { id: string; email: string; createdAt: string };
}

export default function AdminDoctorsPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "pending" | "verified">("pending");
  const debouncedSearch = useDebounce(search, 350);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<{ doctors: Doctor[]; total: number }>({
    queryKey: ["admin-doctors", debouncedSearch, filter],
    queryFn: () => {
      const params = new URLSearchParams({ limit: "50" });
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (filter === "pending") params.set("isVerified", "false");
      if (filter === "verified") params.set("isVerified", "true");
      return api.get(`/admin/doctors?${params}`);
    },
  });

  const verifyMutation = useMutation({
    mutationFn: ({ id, verified }: { id: string; verified: boolean }) =>
      api.patch(`/admin/doctors/${id}/verify`, { isVerified: verified }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-doctors"] }),
  });

  const doctors = data?.doctors ?? [];

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl text-[var(--color-fg)]">Doctor Verification</h1>
        <p className="text-sm text-[var(--color-fg-muted)] mt-0.5">Review and verify doctor credentials</p>
      </div>

      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <div className="flex-1 max-w-sm">
          <Input placeholder="Search doctors…" leftIcon={<Search className="h-4 w-4" />} value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        {(["all", "pending", "verified"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors capitalize ${
              filter === f
                ? "bg-[var(--color-brand-600)] text-white border-[var(--color-brand-600)]"
                : "border-[var(--color-border)] text-[var(--color-fg-muted)] hover:border-[var(--color-brand-300)]"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 max-w-4xl sm:grid-cols-2">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-44" />)
        ) : doctors.length === 0 ? (
          <div className="col-span-2 flex flex-col items-center justify-center py-16 text-center">
            <UserCheck className="h-10 w-10 text-[var(--color-fg-subtle)] mb-3" />
            <p className="text-sm text-[var(--color-fg-muted)]">
              {filter === "pending" ? "No pending verifications" : "No doctors found"}
            </p>
          </div>
        ) : (
          doctors.map((doc, i) => (
            <motion.div key={doc.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-700 font-semibold">
                        {doc.firstName[0]}{doc.lastName[0]}
                      </div>
                      <div>
                        <p className="font-semibold text-[var(--color-fg)]">Dr. {doc.firstName} {doc.lastName}</p>
                        <p className="text-xs text-[var(--color-brand-600)]">{doc.specialty}</p>
                      </div>
                    </div>
                    <Badge variant={doc.isVerified ? "success" : "warning"}>
                      {doc.isVerified ? "Verified" : "Pending"}
                    </Badge>
                  </div>

                  <div className="flex flex-col gap-1.5 mb-4">
                    <div className="flex items-center gap-2 text-xs text-[var(--color-fg-muted)]">
                      <Shield className="h-3.5 w-3.5 shrink-0" />
                      License: <span className="font-medium text-[var(--color-fg)]">{doc.licenseNumber}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-[var(--color-fg-muted)]">
                      <Clock className="h-3.5 w-3.5 shrink-0" />
                      Joined: {format(new Date(doc.createdAt), "MMM d, yyyy")}
                    </div>
                    {doc.rating && (
                      <div className="flex items-center gap-2 text-xs text-[var(--color-fg-muted)]">
                        <Star className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                        {parseFloat(doc.rating).toFixed(1)} ({doc.reviewCount} reviews)
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    {!doc.isVerified ? (
                      <Button size="sm" className="flex-1 gap-1.5" loading={verifyMutation.isPending}
                        onClick={() => verifyMutation.mutate({ id: doc.id, verified: true })}>
                        <UserCheck className="h-3.5 w-3.5" /> Verify
                      </Button>
                    ) : (
                      <Button variant="secondary" size="sm" className="flex-1 gap-1.5" loading={verifyMutation.isPending}
                        onClick={() => verifyMutation.mutate({ id: doc.id, verified: false })}>
                        <UserX className="h-3.5 w-3.5" /> Revoke
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
