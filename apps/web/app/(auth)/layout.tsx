import Link from "next/link";
import { Activity } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh flex flex-col bg-[var(--color-canvas)]">
      {/* Minimal nav */}
      <header className="flex h-16 items-center px-6 border-b border-[var(--color-border)] bg-[var(--color-surface)]">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--color-brand-600)]">
            <Activity className="h-4 w-4 text-white" strokeWidth={2.5} />
          </div>
          <span className="text-base font-semibold text-[var(--color-fg)] tracking-tight">
            Med<span className="text-[var(--color-brand-600)]">Flow</span>
          </span>
        </Link>
      </header>

      {/* Centered content */}
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        {children}
      </div>
    </div>
  );
}
