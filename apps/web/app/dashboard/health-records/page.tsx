"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { FileText, Upload, Search, ArrowRight, Clock } from "lucide-react";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { api } from "@/lib/api";

interface HealthRecord {
  id: string; title: string; category: string; recordDate: string; createdAt: string;
  vitals?: object; _count?: { documents: number };
}

const CATEGORY_COLORS: Record<string, string> = {
  VISIT_SUMMARY: "default", LAB_RESULT: "success", IMAGING: "warning",
  VACCINATION: "neutral", OTHER: "neutral",
};
const CATEGORY_LABELS: Record<string, string> = {
  VISIT_SUMMARY: "Visit Summary", LAB_RESULT: "Lab Result", IMAGING: "Imaging",
  VACCINATION: "Vaccination", OTHER: "Other",
};

export default function HealthRecordsPage() {
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery<{ records: HealthRecord[]; total: number }>({
    queryKey: ["health-records"],
    queryFn: () => api.get("/health-records?limit=20"),
  });

  const records = (data?.records ?? []).filter((r) =>
    !search || r.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl text-[var(--color-fg)]">Health Records</h1>
          <p className="text-sm text-[var(--color-fg-muted)] mt-0.5">Your complete medical history</p>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-6 max-w-lg">
        <div className="flex-1">
          <Input placeholder="Search records…" leftIcon={<Search className="h-4 w-4" />} value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="flex flex-col gap-3 max-w-2xl">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20" />)
        ) : records.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <FileText className="h-10 w-10 text-[var(--color-fg-subtle)] mb-3" />
            <p className="font-medium text-[var(--color-fg)]">No health records yet</p>
            <p className="text-sm text-[var(--color-fg-muted)] mt-1">Records are created after your consultations</p>
          </div>
        ) : (
          records.map((record, i) => (
            <motion.div key={record.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Link href={`/dashboard/health-records/${record.id}`}>
                <Card hover className="cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-brand-50)]">
                        <FileText className="h-5 w-5 text-[var(--color-brand-600)]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-sm font-semibold text-[var(--color-fg)] truncate">{record.title}</p>
                          <Badge variant={CATEGORY_COLORS[record.category] as any ?? "neutral"} className="shrink-0">
                            {CATEGORY_LABELS[record.category] ?? record.category}
                          </Badge>
                        </div>
                        <p className="text-xs text-[var(--color-fg-subtle)] flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {format(new Date(record.recordDate), "MMMM d, yyyy")}
                          {record._count?.documents ? ` · ${record._count.documents} document${record._count.documents > 1 ? "s" : ""}` : ""}
                        </p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-[var(--color-fg-subtle)] shrink-0" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
