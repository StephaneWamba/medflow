"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  ChevronLeft, FileText, Activity, Paperclip, Download, Trash2,
  Calendar, User, Plus, Upload, AlertCircle, Heart, Thermometer,
  Wind, Droplets
} from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { api, ApiError } from "@/lib/api";

interface Vitals {
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  heartRate?: number;
  temperature?: number;
  respiratoryRate?: number;
  oxygenSaturation?: number;
  weight?: number;
  height?: number;
}

interface Document {
  id: string;
  fileName: string;
  fileType: string;
  fileSizeBytes: number;
  createdAt: string;
}

interface HealthRecord {
  id: string;
  title: string;
  category: string;
  recordDate: string;
  createdAt: string;
  chiefComplaint?: string;
  presentIllness?: string;
  assessment?: string;
  plan?: string;
  vitals?: Vitals;
  documents: Document[];
  doctor?: { firstName: string; lastName: string; specialty: string };
  appointment?: { id: string; scheduledAt: string };
}

const CATEGORY_LABELS: Record<string, string> = {
  VISIT_SUMMARY: "Visit Summary", LAB_RESULT: "Lab Result", IMAGING: "Imaging",
  VACCINATION: "Vaccination", OTHER: "Other",
};
const CATEGORY_VARIANTS: Record<string, "default" | "success" | "warning" | "neutral"> = {
  VISIT_SUMMARY: "default", LAB_RESULT: "success", IMAGING: "warning",
  VACCINATION: "neutral", OTHER: "neutral",
};

function VitalCard({ icon, label, value, unit }: { icon: React.ReactNode; label: string; value?: number | string; unit?: string }) {
  if (value === undefined || value === null) return null;
  return (
    <div className="flex items-center gap-3 p-3.5 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)]">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand-50)] text-[var(--color-brand-600)]">
        {icon}
      </div>
      <div>
        <p className="text-xs text-[var(--color-fg-subtle)]">{label}</p>
        <p className="text-sm font-semibold text-[var(--color-fg)]">{value}{unit && <span className="text-xs font-normal text-[var(--color-fg-muted)] ml-1">{unit}</span>}</p>
      </div>
    </div>
  );
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function HealthRecordDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const { data: record, isLoading } = useQuery<HealthRecord>({
    queryKey: ["health-record", id],
    queryFn: () => api.get(`/health-records/${id}`),
  });

  const deleteMutation = useMutation({
    mutationFn: (docId: string) => api.delete(`/health-records/documents/${docId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["health-record", id] }),
  });

  async function handleDownload(docId: string, fileName: string) {
    try {
      const { url } = await api.get<{ url: string }>(`/health-records/documents/${docId}/download`);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      a.click();
    } catch {}
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError("");
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      await api.upload(`/health-records/${id}/documents`, formData);
      queryClient.invalidateQueries({ queryKey: ["health-record", id] });
    } catch (err) {
      setUploadError(err instanceof ApiError ? ((err.body as { message?: string })?.message ?? "Upload failed") : "Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto">
        <Skeleton className="h-5 w-28 mb-8" />
        <Skeleton className="h-40 rounded-[var(--radius-xl)] mb-4" />
        <Skeleton className="h-40 rounded-[var(--radius-xl)]" />
      </div>
    );
  }

  if (!record) return <div className="text-center py-20 text-[var(--color-fg-muted)]">Record not found.</div>;

  const vitals = record.vitals as Vitals | undefined;
  const hasVitals = vitals && Object.values(vitals).some((v) => v !== undefined && v !== null);
  const hasNarrative = record.chiefComplaint || record.presentIllness || record.assessment || record.plan;

  return (
    <div className="max-w-3xl mx-auto">
      <Link href="/dashboard/health-records" className="inline-flex items-center gap-1.5 text-sm text-[var(--color-fg-muted)] hover:text-[var(--color-fg)] mb-6 transition-colors">
        <ChevronLeft className="h-4 w-4" /> Back to health records
      </Link>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="flex flex-col gap-5">
        {/* Header */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-brand-50)]">
                  <FileText className="h-6 w-6 text-[var(--color-brand-600)]" />
                </div>
                <div>
                  <h1 className="font-display text-xl text-[var(--color-fg)] leading-snug">{record.title}</h1>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <Badge variant={CATEGORY_VARIANTS[record.category] ?? "neutral"}>
                      {CATEGORY_LABELS[record.category] ?? record.category}
                    </Badge>
                    <span className="flex items-center gap-1 text-xs text-[var(--color-fg-subtle)]">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(record.recordDate), "MMMM d, yyyy")}
                    </span>
                    {record.doctor && (
                      <span className="flex items-center gap-1 text-xs text-[var(--color-fg-subtle)]">
                        <User className="h-3 w-3" />
                        Dr. {record.doctor.firstName} {record.doctor.lastName}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              {record.appointment && (
                <Link href={`/dashboard/appointments/${record.appointment.id}`}>
                  <Button variant="outline" size="sm">View appointment</Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Vitals */}
        {hasVitals && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-[var(--color-brand-500)]" />
                Vitals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {vitals?.bloodPressureSystolic && vitals?.bloodPressureDiastolic && (
                  <VitalCard
                    icon={<Heart className="h-4 w-4" />}
                    label="Blood Pressure"
                    value={`${vitals.bloodPressureSystolic}/${vitals.bloodPressureDiastolic}`}
                    unit="mmHg"
                  />
                )}
                <VitalCard icon={<Heart className="h-4 w-4" />} label="Heart Rate" value={vitals?.heartRate} unit="bpm" />
                <VitalCard icon={<Thermometer className="h-4 w-4" />} label="Temperature" value={vitals?.temperature} unit="°F" />
                <VitalCard icon={<Wind className="h-4 w-4" />} label="Respiratory Rate" value={vitals?.respiratoryRate} unit="/min" />
                <VitalCard icon={<Droplets className="h-4 w-4" />} label="O₂ Saturation" value={vitals?.oxygenSaturation} unit="%" />
                <VitalCard icon={<Activity className="h-4 w-4" />} label="Weight" value={vitals?.weight} unit="kg" />
                <VitalCard icon={<Activity className="h-4 w-4" />} label="Height" value={vitals?.height} unit="cm" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Clinical Narrative */}
        {hasNarrative && (
          <Card>
            <CardHeader>
              <CardTitle>Clinical Notes</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {record.chiefComplaint && (
                <div>
                  <p className="text-xs font-semibold text-[var(--color-fg-muted)] uppercase tracking-wide mb-1.5">Chief Complaint</p>
                  <p className="text-sm text-[var(--color-fg)] leading-relaxed">{record.chiefComplaint}</p>
                </div>
              )}
              {record.presentIllness && (
                <div>
                  <p className="text-xs font-semibold text-[var(--color-fg-muted)] uppercase tracking-wide mb-1.5">History of Present Illness</p>
                  <p className="text-sm text-[var(--color-fg)] leading-relaxed">{record.presentIllness}</p>
                </div>
              )}
              {record.assessment && (
                <div>
                  <p className="text-xs font-semibold text-[var(--color-fg-muted)] uppercase tracking-wide mb-1.5">Assessment</p>
                  <p className="text-sm text-[var(--color-fg)] leading-relaxed">{record.assessment}</p>
                </div>
              )}
              {record.plan && (
                <div>
                  <p className="text-xs font-semibold text-[var(--color-fg-muted)] uppercase tracking-wide mb-1.5">Plan</p>
                  <p className="text-sm text-[var(--color-fg)] leading-relaxed">{record.plan}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Documents */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Paperclip className="h-4 w-4 text-[var(--color-brand-500)]" />
                Documents
                {record.documents.length > 0 && (
                  <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-brand-100)] text-xs font-semibold text-[var(--color-brand-700)]">
                    {record.documents.length}
                  </span>
                )}
              </CardTitle>
              <label>
                <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx" onChange={handleUpload} disabled={uploading} />
                <Button variant="outline" size="sm" className="gap-1.5 cursor-pointer" loading={uploading} onClick={(e) => e.currentTarget.parentElement?.querySelector("input")?.click()}>
                  <Upload className="h-3.5 w-3.5" /> Upload
                </Button>
              </label>
            </div>
          </CardHeader>
          <CardContent>
            {uploadError && (
              <div className="mb-3 flex items-center gap-2 rounded-[var(--radius-md)] bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
                <AlertCircle className="h-4 w-4 shrink-0" /> {uploadError}
              </div>
            )}
            {record.documents.length === 0 ? (
              <div className="py-8 text-center">
                <Paperclip className="h-8 w-8 text-[var(--color-fg-subtle)] mx-auto mb-2" />
                <p className="text-sm text-[var(--color-fg-muted)]">No documents attached</p>
                <p className="text-xs text-[var(--color-fg-subtle)] mt-0.5">Upload PDFs, images, or documents</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {record.documents.map((doc) => (
                  <div key={doc.id} className="flex items-center gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] p-3 group">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--color-surface-2)]">
                      <FileText className="h-4 w-4 text-[var(--color-fg-muted)]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--color-fg)] truncate">{doc.fileName}</p>
                      <p className="text-xs text-[var(--color-fg-subtle)]">
                        {formatFileSize(doc.fileSizeBytes)} · {format(new Date(doc.createdAt), "MMM d, yyyy")}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" onClick={() => handleDownload(doc.id, doc.fileName)} title="Download">
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                        loading={deleteMutation.isPending}
                        onClick={() => deleteMutation.mutate(doc.id)}
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
