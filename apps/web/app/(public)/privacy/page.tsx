import React from "react";
import { Shield, Lock, Eye, FileText, Bell, Mail } from "lucide-react";

export const metadata = {
  title: "Privacy Policy — MedFlow",
  description: "How MedFlow collects, uses, and protects your personal health information.",
};

const sections = [
  {
    icon: <FileText className="h-5 w-5" />,
    title: "Information We Collect",
    content: [
      {
        subtitle: "Account Information",
        text: "When you register, we collect your name, email address, date of birth, and password. Doctors additionally provide their medical license number, state, specialty, and professional biography.",
      },
      {
        subtitle: "Health Information",
        text: "During consultations and as you use the platform, we may collect health records, consultation notes, vital signs, prescriptions, medical documents, and information you choose to share with your care providers.",
      },
      {
        subtitle: "Usage Data",
        text: "We collect device information, IP addresses, browser type, and pages visited to improve the platform and for security monitoring. This data is never linked to your health records.",
      },
      {
        subtitle: "Communications",
        text: "Messages sent through MedFlow's secure messaging system are stored encrypted. We do not read, sell, or share the contents of your conversations.",
      },
    ],
  },
  {
    icon: <Eye className="h-5 w-5" />,
    title: "How We Use Your Information",
    content: [
      {
        subtitle: "Providing Care",
        text: "Your health information is used to facilitate consultations, generate prescriptions, and maintain your health record — accessible only to you and the licensed doctors you consult.",
      },
      {
        subtitle: "Platform Operations",
        text: "We use account information to operate the platform, send appointment reminders, and provide customer support. We do not use your health data for advertising.",
      },
      {
        subtitle: "Safety & Compliance",
        text: "We may process your information to comply with legal obligations, prevent fraud, and respond to lawful requests from public authorities where required.",
      },
      {
        subtitle: "Service Improvement",
        text: "We use anonymised, aggregated data (never individually identifiable) to improve our platform features and user experience.",
      },
    ],
  },
  {
    icon: <Shield className="h-5 w-5" />,
    title: "HIPAA & Protected Health Information",
    content: [
      {
        subtitle: "We are a HIPAA-Covered Entity",
        text: "MedFlow operates as a covered entity under the Health Insurance Portability and Accountability Act (HIPAA). Your Protected Health Information (PHI) is handled in strict accordance with HIPAA Privacy and Security Rules.",
      },
      {
        subtitle: "Business Associate Agreements",
        text: "All third-party service providers with access to PHI have executed Business Associate Agreements (BAAs) with MedFlow, including our infrastructure and communications providers.",
      },
      {
        subtitle: "Minimum Necessary Standard",
        text: "We apply the HIPAA minimum necessary standard — accessing, using, or disclosing only the minimum amount of PHI necessary to accomplish each function.",
      },
    ],
  },
  {
    icon: <Lock className="h-5 w-5" />,
    title: "Data Security",
    content: [
      {
        subtitle: "Encryption",
        text: "All health records are encrypted at rest using AES-256-GCM. All data in transit is protected by TLS 1.3. Messages are end-to-end encrypted — not even MedFlow staff can read them.",
      },
      {
        subtitle: "Access Controls",
        text: "Access to your health information is restricted to you and the licensed providers you have consulted. Internal staff access is role-based, logged, and audited.",
      },
      {
        subtitle: "Audit Logging",
        text: "All access to PHI is logged with timestamp, user ID, and action type. These logs are write-only, tamper-evident, and retained for a minimum of six years as required by HIPAA.",
      },
      {
        subtitle: "Breach Notification",
        text: "In the event of a data breach involving your PHI, we will notify you within 60 days as required by HIPAA, or sooner where required by applicable state law.",
      },
    ],
  },
  {
    icon: <Bell className="h-5 w-5" />,
    title: "Your Rights",
    content: [
      {
        subtitle: "Access & Portability",
        text: "You have the right to request a copy of your personal data and health records at any time. We will provide them in a machine-readable format within 30 days.",
      },
      {
        subtitle: "Correction",
        text: "If any personal information we hold is inaccurate, you may request a correction through your account profile or by contacting our privacy team.",
      },
      {
        subtitle: "Deletion",
        text: "You may request deletion of your account and non-medical personal data. Note that health records may be retained for legal and medical record-keeping periods as required by state and federal law.",
      },
      {
        subtitle: "Opt-Out",
        text: "You may opt out of non-essential communications (marketing emails, product updates) at any time via your notification settings. Appointment reminders cannot be disabled as they are a safety feature.",
      },
    ],
  },
  {
    icon: <Mail className="h-5 w-5" />,
    title: "Third-Party Services",
    content: [
      {
        subtitle: "Infrastructure Partners",
        text: "MedFlow uses Neon (PostgreSQL), Cloudflare R2 (document storage), and LiveKit (encrypted video). These partners process data only as directed by MedFlow under contractual data protection terms.",
      },
      {
        subtitle: "No Advertising Networks",
        text: "We do not use advertising networks, tracking pixels, or third-party analytics that would expose your health information or browsing behaviour to advertisers.",
      },
      {
        subtitle: "No Data Sales",
        text: "MedFlow does not sell, rent, or trade your personal information or health data to any third party, ever.",
      },
    ],
  },
];

export default function PrivacyPage() {
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
              Legal
            </p>
          </div>
          <h1 className="font-display text-[clamp(2rem,4vw,2.75rem)] leading-tight text-[var(--color-fg)] mb-4">
            Privacy Policy
          </h1>
          <p className="text-[var(--color-fg-muted)] max-w-[60ch] leading-relaxed">
            MedFlow is committed to protecting your personal and health information. This policy
            explains what we collect, how we use it, and your rights as a patient or healthcare provider.
          </p>
          <p className="text-xs text-[var(--color-fg-subtle)] mt-4">
            Last updated: March 7, 2026 · Effective: March 7, 2026
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="container-lg py-14">
        <div className="max-w-3xl flex flex-col gap-12">
          {sections.map((section) => (
            <section key={section.title}>
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-brand-100)] text-[var(--color-brand-700)]">
                  {section.icon}
                </div>
                <h2 className="text-xl font-semibold text-[var(--color-fg)]">{section.title}</h2>
              </div>
              <div className="flex flex-col gap-5 pl-12">
                {section.content.map((item) => (
                  <div key={item.subtitle}>
                    <h3 className="text-sm font-semibold text-[var(--color-fg)] mb-1">{item.subtitle}</h3>
                    <p className="text-sm text-[var(--color-fg-muted)] leading-relaxed">{item.text}</p>
                  </div>
                ))}
              </div>
            </section>
          ))}

          {/* Contact */}
          <section className="bg-[var(--color-surface)] rounded-[var(--radius-xl)] border border-[var(--color-border)] p-8">
            <h2 className="text-xl font-semibold text-[var(--color-fg)] mb-2">Contact Our Privacy Team</h2>
            <p className="text-sm text-[var(--color-fg-muted)] leading-relaxed mb-4">
              For privacy inquiries, data access requests, or HIPAA concerns, contact our Privacy Officer:
            </p>
            <div className="flex flex-col gap-1 text-sm">
              <p><span className="font-medium text-[var(--color-fg)]">Email:</span>{" "}
                <span className="text-[var(--color-brand-600)]">privacy@medflow.health</span>
              </p>
              <p><span className="font-medium text-[var(--color-fg)]">Response time:</span>{" "}
                <span className="text-[var(--color-fg-muted)]">Within 5 business days</span>
              </p>
              <p><span className="font-medium text-[var(--color-fg)]">HIPAA complaints:</span>{" "}
                <span className="text-[var(--color-fg-muted)]">You may also file a complaint with the U.S. Department of Health &amp; Human Services Office for Civil Rights.</span>
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
