import React from "react";
import { FileText, AlertTriangle, UserCheck, Lock, Scale, Info } from "lucide-react";

export const metadata = {
  title: "Terms of Service — MedFlow",
  description: "Terms and conditions governing your use of the MedFlow telehealth platform.",
};

const sections = [
  {
    icon: <Info className="h-5 w-5" />,
    title: "1. Acceptance of Terms",
    items: [
      "By creating an account or using MedFlow, you agree to these Terms of Service and our Privacy Policy. If you do not agree, do not use the platform.",
      "These terms constitute a legally binding agreement between you and MedFlow Technologies, Inc. (\"MedFlow\", \"we\", \"us\").",
      "We may update these terms from time to time. Continued use of the platform after notification of changes constitutes acceptance.",
      "Users must be at least 18 years of age to register independently. Parents or legal guardians may register on behalf of minors.",
    ],
  },
  {
    icon: <FileText className="h-5 w-5" />,
    title: "2. Description of Services",
    items: [
      "MedFlow provides a technology platform that facilitates video consultations between patients and independently licensed healthcare providers (\"Providers\").",
      "MedFlow is a technology facilitator — not a healthcare provider, medical group, or employer of any Provider. All medical services are rendered solely by the independent licensed Providers.",
      "Services include: scheduling appointments, encrypted video consultations, secure messaging, digital prescription delivery, and health record management.",
      "MedFlow services are intended for non-emergency consultations only. In the event of a medical emergency, call 911 or go to your nearest emergency department immediately.",
    ],
  },
  {
    icon: <AlertTriangle className="h-5 w-5" />,
    title: "3. Medical Disclaimer",
    items: [
      "Information provided through MedFlow does not constitute a substitute for professional medical advice, diagnosis, or treatment from a qualified healthcare provider.",
      "The existence of a telehealth consultation does not establish a long-term physician-patient relationship unless explicitly stated by both parties.",
      "Providers on MedFlow are independently licensed. MedFlow does not practice medicine and does not direct, supervise, or control the clinical judgement of any Provider.",
      "Some conditions may not be appropriate for telehealth assessment. Your Provider will inform you if an in-person visit is required.",
      "Prescription issuance is entirely at the discretion of the consulting Provider and is subject to applicable state laws and professional standards.",
    ],
  },
  {
    icon: <UserCheck className="h-5 w-5" />,
    title: "4. User Obligations",
    items: [
      "You agree to provide accurate, complete, and up-to-date information when creating your account and during consultations. Providing false medical history may harm your health and is a breach of these terms.",
      "You are responsible for maintaining the confidentiality of your account credentials. Notify us immediately at security@medflow.health if you suspect unauthorised access.",
      "Patients agree to use the platform in good faith for genuine health consultations. Misuse to obtain controlled substances fraudulently is a violation of law and these terms.",
      "Doctors registering on MedFlow confirm that they hold a valid, active medical licence in the state(s) they indicate, and will immediately notify MedFlow of any change to their licensure status.",
      "You agree not to record video consultations without the explicit prior consent of all parties.",
    ],
  },
  {
    icon: <Lock className="h-5 w-5" />,
    title: "5. Prohibited Uses",
    items: [
      "Using the platform to seek treatment for emergency medical conditions — contact 911 immediately.",
      "Attempting to access another user's health records, prescriptions, or account.",
      "Providing false identity or licensure information to register as a healthcare provider.",
      "Using the platform to distribute spam, malware, or conduct any form of cyber attack.",
      "Scraping, harvesting, or otherwise extracting data from the platform without written authorisation.",
      "Reverse engineering, decompiling, or attempting to extract source code from MedFlow's software.",
    ],
  },
  {
    icon: <Scale className="h-5 w-5" />,
    title: "6. Payments & Cancellations",
    items: [
      "Consultation fees are set by each Provider and are displayed before booking. Payment is charged at the time of booking.",
      "Cancellations made more than 24 hours before a scheduled appointment will receive a full refund. Cancellations within 24 hours may be subject to a late cancellation fee.",
      "No-show appointments (patient fails to join within 15 minutes of start time) are non-refundable.",
      "MedFlow collects a platform fee as a percentage of each consultation. This is included in the displayed price and is not charged additionally to patients.",
    ],
  },
  {
    icon: <AlertTriangle className="h-5 w-5" />,
    title: "7. Limitation of Liability",
    items: [
      "To the maximum extent permitted by law, MedFlow shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the platform.",
      "MedFlow's total liability for any claim arising from these terms or your use of the platform shall not exceed the amount you paid to MedFlow in the 12 months preceding the claim.",
      "MedFlow is not liable for the clinical decisions, treatment recommendations, or acts or omissions of any Provider using the platform.",
      "We do not warrant that the platform will be uninterrupted, error-free, or free of viruses or other harmful components.",
    ],
  },
  {
    icon: <Scale className="h-5 w-5" />,
    title: "8. Governing Law",
    items: [
      "These terms are governed by the laws of the State of New York, without regard to its conflict of law provisions.",
      "Any disputes arising under these terms shall be resolved by binding arbitration in New York, NY, under the rules of the American Arbitration Association.",
      "You waive any right to participate in a class action lawsuit or class-wide arbitration against MedFlow.",
      "Nothing in this section prevents either party from seeking emergency injunctive relief from a court of competent jurisdiction.",
    ],
  },
];

export default function TermsPage() {
  return (
    <div className="bg-[var(--color-canvas)] min-h-screen">
      {/* Header */}
      <div className="bg-[var(--color-surface)] border-b border-[var(--color-border)]">
        <div className="container-lg py-16">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-brand-100)] text-[var(--color-brand-700)]">
              <FileText className="h-5 w-5" />
            </div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-brand-600)]">
              Legal
            </p>
          </div>
          <h1 className="font-display text-[clamp(2rem,4vw,2.75rem)] leading-tight text-[var(--color-fg)] mb-4">
            Terms of Service
          </h1>
          <p className="text-[var(--color-fg-muted)] max-w-[60ch] leading-relaxed">
            These terms govern your use of the MedFlow platform. Please read them carefully before
            creating an account or using our services.
          </p>
          <p className="text-xs text-[var(--color-fg-subtle)] mt-4">
            Last updated: March 7, 2026 · Effective: March 7, 2026
          </p>
        </div>
      </div>

      {/* Emergency notice */}
      <div className="bg-red-50 border-b border-red-200">
        <div className="container-lg py-4">
          <p className="text-sm font-medium text-red-800 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            MedFlow is for non-emergency consultations only. If you are experiencing a medical emergency,
            call <strong>911</strong> or go to your nearest emergency department immediately.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="container-lg py-14">
        <div className="max-w-3xl flex flex-col gap-10">
          {sections.map((section) => (
            <section key={section.title} className="bg-[var(--color-surface)] rounded-[var(--radius-xl)] border border-[var(--color-border)] p-8">
              <div className="flex items-center gap-3 mb-5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-brand-100)] text-[var(--color-brand-700)]">
                  {section.icon}
                </div>
                <h2 className="text-lg font-semibold text-[var(--color-fg)]">{section.title}</h2>
              </div>
              <ul className="flex flex-col gap-3">
                {section.items.map((item, i) => (
                  <li key={i} className="flex gap-3 text-sm text-[var(--color-fg-muted)] leading-relaxed">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-brand-400)]" />
                    {item}
                  </li>
                ))}
              </ul>
            </section>
          ))}

          {/* Contact */}
          <section className="bg-[var(--color-brand-50)] rounded-[var(--radius-xl)] border border-[var(--color-brand-200)] p-8">
            <h2 className="text-lg font-semibold text-[var(--color-fg)] mb-2">Questions?</h2>
            <p className="text-sm text-[var(--color-fg-muted)] leading-relaxed">
              For questions about these Terms of Service, contact our legal team at{" "}
              <span className="text-[var(--color-brand-600)] font-medium">legal@medflow.health</span>
              {" "}or write to MedFlow Technologies, Inc., 350 Fifth Avenue, Suite 4100, New York, NY 10118.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
