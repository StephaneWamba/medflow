import React from "react";
import { Shield, Lock, FileText, UserCheck, Bell, CheckCircle2 } from "lucide-react";

export const metadata = {
  title: "HIPAA Compliance — MedFlow",
  description: "MedFlow's Notice of Privacy Practices and HIPAA compliance information.",
};

const rights = [
  {
    title: "Right to Access",
    text: "You have the right to inspect and obtain a copy of your Protected Health Information (PHI) held by MedFlow. We will provide this within 30 days of your request.",
  },
  {
    title: "Right to Amend",
    text: "If you believe PHI we hold is incorrect or incomplete, you may request an amendment. We will respond within 60 days.",
  },
  {
    title: "Right to an Accounting",
    text: "You may request a list of disclosures of your PHI made by MedFlow for purposes other than treatment, payment, and health care operations.",
  },
  {
    title: "Right to Restrict",
    text: "You may request restrictions on how MedFlow uses or discloses your PHI. We are required to agree to certain restrictions, particularly where you have paid out-of-pocket.",
  },
  {
    title: "Right to Confidential Communications",
    text: "You may request that MedFlow communicate with you about your health matters in a specific way or at a specific location.",
  },
  {
    title: "Right to File a Complaint",
    text: "If you believe your privacy rights have been violated, you may file a complaint with MedFlow or with the U.S. Department of Health & Human Services Office for Civil Rights — without retaliation.",
  },
];

const disclosures = [
  {
    type: "Treatment",
    description: "We share PHI with your consulting Providers to enable diagnosis and treatment. With your consent, a Provider may share records with another specialist.",
  },
  {
    type: "Payment",
    description: "We use PHI to process payments, submit insurance claims (where applicable), and verify coverage. Payment processors operate under BAAs.",
  },
  {
    type: "Healthcare Operations",
    description: "PHI may be used for quality assurance, provider performance assessment, compliance audits, and training — always subject to the minimum necessary standard.",
  },
  {
    type: "Legal Requirements",
    description: "We may disclose PHI when required by law, including responses to court orders, subpoenas, or public health reporting obligations (e.g., communicable disease reporting).",
  },
  {
    type: "Emergency Circumstances",
    description: "If you are unable to consent and disclosure is necessary to prevent serious harm, we may share PHI with emergency responders or next of kin.",
  },
];

const safeguards = [
  { icon: <Lock className="h-5 w-5" />, title: "AES-256 Encryption at Rest", description: "All health records stored on MedFlow are encrypted using AES-256-GCM before being written to disk." },
  { icon: <Shield className="h-5 w-5" />, title: "TLS 1.3 in Transit", description: "All data transmitted between your device and MedFlow servers is protected by TLS 1.3 encryption." },
  { icon: <FileText className="h-5 w-5" />, title: "End-to-End Encrypted Messaging", description: "Messages use ECDH key exchange + AES-256 encryption. MedFlow staff cannot read your messages." },
  { icon: <UserCheck className="h-5 w-5" />, title: "Role-Based Access Controls", description: "Patient PHI is accessible only to that patient and their consulting Providers — not to other patients or uninvolved staff." },
  { icon: <Bell className="h-5 w-5" />, title: "Immutable Audit Logs", description: "Every access to PHI is logged with user ID, timestamp, action, and IP address. Logs are write-only and retained for 6 years." },
  { icon: <FileText className="h-5 w-5" />, title: "Business Associate Agreements", description: "All vendors who process PHI on behalf of MedFlow have executed legally binding BAAs per 45 CFR § 164.504(e)." },
];

export default function HipaaPage() {
  return (
    <div className="bg-[var(--color-canvas)] min-h-screen">
      {/* Header */}
      <div className="bg-[var(--color-surface)] border-b border-[var(--color-border)]">
        <div className="container-lg py-16">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-brand-100)] text-[var(--color-brand-700)]">
              <Shield className="h-5 w-5" />
            </div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-brand-600)]">
              Legal · HIPAA
            </p>
          </div>
          <h1 className="font-display text-[clamp(2rem,4vw,2.75rem)] leading-tight text-[var(--color-fg)] mb-4">
            HIPAA Compliance &amp; Notice of Privacy Practices
          </h1>
          <p className="text-[var(--color-fg-muted)] max-w-[60ch] leading-relaxed">
            MedFlow is a HIPAA-covered entity. This Notice of Privacy Practices describes how we use
            and disclose your Protected Health Information (PHI) and your rights under federal law.
          </p>
          <p className="text-xs text-[var(--color-fg-subtle)] mt-4">
            Effective: March 7, 2026 · As required by 45 CFR § 164.520
          </p>
        </div>
      </div>

      <div className="container-lg py-14">
        <div className="max-w-3xl flex flex-col gap-14">

          {/* What is PHI */}
          <section>
            <h2 className="text-xl font-semibold text-[var(--color-fg)] mb-4">What is Protected Health Information?</h2>
            <div className="bg-[var(--color-surface)] rounded-[var(--radius-xl)] border border-[var(--color-border)] p-6">
              <p className="text-sm text-[var(--color-fg-muted)] leading-relaxed">
                Protected Health Information (PHI) is any information that can identify you and relates to your past,
                present, or future physical or mental health condition, the provision of healthcare to you, or payment
                for that care. On MedFlow, PHI includes: consultation notes, diagnoses, prescriptions, vital signs,
                uploaded medical documents, and health records — including any combination of identifiers such as your
                name, date of birth, or account ID linked to health data.
              </p>
            </div>
          </section>

          {/* Technical Safeguards */}
          <section>
            <h2 className="text-xl font-semibold text-[var(--color-fg)] mb-6">Technical Safeguards</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {safeguards.map((s) => (
                <div key={s.title} className="bg-[var(--color-surface)] rounded-[var(--radius-xl)] border border-[var(--color-border)] p-5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-brand-100)] text-[var(--color-brand-700)] mb-3">
                    {s.icon}
                  </div>
                  <h3 className="text-sm font-semibold text-[var(--color-fg)] mb-1">{s.title}</h3>
                  <p className="text-xs text-[var(--color-fg-muted)] leading-relaxed">{s.description}</p>
                </div>
              ))}
            </div>
          </section>

          {/* How we use PHI */}
          <section>
            <h2 className="text-xl font-semibold text-[var(--color-fg)] mb-6">How We Use and Disclose PHI</h2>
            <div className="flex flex-col gap-4">
              {disclosures.map((d) => (
                <div key={d.type} className="flex gap-4">
                  <div className="mt-0.5">
                    <CheckCircle2 className="h-4 w-4 text-[var(--color-success)]" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[var(--color-fg)]">{d.type}</p>
                    <p className="text-sm text-[var(--color-fg-muted)] leading-relaxed mt-0.5">{d.description}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 bg-amber-50 rounded-[var(--radius-xl)] border border-amber-200 p-5">
              <p className="text-sm font-semibold text-amber-900 mb-1">We Never Sell PHI</p>
              <p className="text-sm text-amber-800 leading-relaxed">
                MedFlow does not sell, rent, trade, or exchange your Protected Health Information with any
                third party for commercial purposes. This commitment is unconditional and not subject to change.
              </p>
            </div>
          </section>

          {/* Your Rights */}
          <section>
            <h2 className="text-xl font-semibold text-[var(--color-fg)] mb-6">Your HIPAA Rights</h2>
            <div className="flex flex-col gap-4">
              {rights.map((r) => (
                <div key={r.title} className="bg-[var(--color-surface)] rounded-[var(--radius-xl)] border border-[var(--color-border)] p-5">
                  <h3 className="text-sm font-semibold text-[var(--color-fg)] mb-1">{r.title}</h3>
                  <p className="text-sm text-[var(--color-fg-muted)] leading-relaxed">{r.text}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Contact */}
          <section className="bg-[var(--color-surface)] rounded-[var(--radius-xl)] border border-[var(--color-border)] p-8">
            <h2 className="text-xl font-semibold text-[var(--color-fg)] mb-3">Contact Our Privacy Officer</h2>
            <div className="flex flex-col gap-2 text-sm">
              <p><span className="font-medium text-[var(--color-fg)]">HIPAA Privacy Officer:</span>{" "}
                <span className="text-[var(--color-fg-muted)]">MedFlow Technologies, Inc.</span>
              </p>
              <p><span className="font-medium text-[var(--color-fg)]">Email:</span>{" "}
                <span className="text-[var(--color-brand-600)]">hipaa@medflow.health</span>
              </p>
              <p><span className="font-medium text-[var(--color-fg)]">Address:</span>{" "}
                <span className="text-[var(--color-fg-muted)]">350 Fifth Avenue, Suite 4100, New York, NY 10118</span>
              </p>
              <p className="mt-2 text-[var(--color-fg-muted)] leading-relaxed">
                You may also file a complaint with the U.S. Department of Health &amp; Human Services, Office for
                Civil Rights, at{" "}
                <span className="text-[var(--color-brand-600)]">www.hhs.gov/hipaa/filing-a-complaint</span>
                {" "}— MedFlow will not retaliate against you for filing a complaint.
              </p>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
