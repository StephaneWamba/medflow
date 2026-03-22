import Link from "next/link";
import { Activity } from "lucide-react";

const links = {
  Platform: [
    { href: "/doctors", label: "Find Doctors" },
    { href: "/#how-it-works", label: "How it Works" },
    { href: "/register", label: "For Doctors" },
  ],
  Support: [
    { href: "/login", label: "Sign In" },
    { href: "/register", label: "Register" },
    { href: "/forgot-password", label: "Reset Password" },
  ],
  Legal: [
    { href: "/privacy", label: "Privacy Policy" },
    { href: "/terms", label: "Terms of Service" },
    { href: "/hipaa", label: "HIPAA Compliance" },
  ],
};

export function Footer() {
  return (
    <footer className="bg-[var(--color-fg)] text-[oklch(0.85_0.01_255)]">
      <div className="container-xl py-16">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
          {/* Brand */}
          <div>
            <Link href="/" className="flex items-center gap-2.5 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-brand-500)]">
                <Activity className="h-4.5 w-4.5 text-white" strokeWidth={2.5} />
              </div>
              <span className="text-lg font-semibold text-white tracking-tight">MedFlow</span>
            </Link>
            <p className="text-sm leading-relaxed text-[oklch(0.62_0.01_255)] max-w-xs">
              Healthcare, delivered with precision. Connect with licensed doctors
              via secure, private video consultations.
            </p>
            <div className="mt-6 flex items-center gap-3 text-xs text-[oklch(0.55_0.01_255)]">
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-success)]" />
                HIPAA Compliant
              </span>
              <span>·</span>
              <span>256-bit Encryption</span>
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(links).map(([heading, items]) => (
            <div key={heading}>
              <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-[oklch(0.55_0.01_255)]">
                {heading}
              </p>
              <ul className="flex flex-col gap-2.5">
                {items.map((item) => (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      className="text-sm text-[oklch(0.72_0.01_255)] hover:text-white transition-colors"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-6 border-t border-[oklch(0.28_0.01_255)] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[oklch(0.50_0.01_255)]">
          <p>© {new Date().getFullYear()} MedFlow. All rights reserved.</p>
          <p>Built for healthcare professionals and patients.</p>
        </div>
      </div>
    </footer>
  );
}
