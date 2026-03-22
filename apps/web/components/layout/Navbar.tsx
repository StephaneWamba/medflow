"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/auth.store";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/doctors", label: "Find Doctors" },
  { href: "/#how-it-works", label: "How it Works" },
  { href: "/#features", label: "For Doctors" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, token, logout } = useAuthStore();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const dashboardHref =
    user?.role === "DOCTOR" ? "/doctor" : user?.role === "ADMIN" ? "/admin" : "/dashboard";

  return (
    <header
      className={cn(
        "fixed top-0 inset-x-0 z-40 transition-all duration-300",
        scrolled
          ? "bg-[var(--color-surface)]/95 backdrop-blur-md shadow-[var(--shadow-sm)] border-b border-[var(--color-border)]"
          : "bg-transparent",
      )}
    >
      <div className="container-xl flex h-16 items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-brand-600)] text-white group-hover:bg-[var(--color-brand-700)] transition-colors">
            <Activity className="h-4.5 w-4.5" strokeWidth={2.5} />
          </div>
          <span className="text-lg font-semibold text-[var(--color-fg)] tracking-tight">
            Med<span className="text-[var(--color-brand-600)]">Flow</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "px-3.5 py-2 rounded-[var(--radius-md)] text-sm font-medium transition-colors",
                pathname === link.href
                  ? "text-[var(--color-brand-700)] bg-[var(--color-brand-50)]"
                  : "text-[var(--color-fg-muted)] hover:text-[var(--color-fg)] hover:bg-[var(--color-surface-2)]",
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Desktop actions */}
        <div className="hidden md:flex items-center gap-2">
          {token && user ? (
            <>
              <Link href={dashboardHref}>
                <Button variant="ghost" size="md">Dashboard</Button>
              </Link>
              <Button
                variant="secondary"
                size="md"
                onClick={() => { logout(); router.push("/"); }}
              >
                Sign out
              </Button>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="md">Sign in</Button>
              </Link>
              <Link href="/register">
                <Button variant="primary" size="md">Get started</Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          className="md:hidden p-2 rounded-[var(--radius-md)] text-[var(--color-fg-muted)] hover:text-[var(--color-fg)] hover:bg-[var(--color-surface-2)] transition-colors"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="md:hidden overflow-hidden bg-[var(--color-surface)] border-b border-[var(--color-border)]"
          >
            <div className="container-xl py-4 flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="px-3 py-2.5 rounded-[var(--radius-md)] text-sm font-medium text-[var(--color-fg-muted)] hover:text-[var(--color-fg)] hover:bg-[var(--color-surface-2)] transition-colors"
                >
                  {link.label}
                </Link>
              ))}
              <div className="border-t border-[var(--color-border)] mt-2 pt-3 flex flex-col gap-2">
                {token ? (
                  <>
                    <Link href={dashboardHref} onClick={() => setMobileOpen(false)}>
                      <Button variant="primary" size="md" className="w-full">Dashboard</Button>
                    </Link>
                    <Button variant="secondary" size="md" className="w-full" onClick={() => { logout(); setMobileOpen(false); router.push("/"); }}>
                      Sign out
                    </Button>
                  </>
                ) : (
                  <>
                    <Link href="/login" onClick={() => setMobileOpen(false)}>
                      <Button variant="secondary" size="md" className="w-full">Sign in</Button>
                    </Link>
                    <Link href="/register" onClick={() => setMobileOpen(false)}>
                      <Button variant="primary" size="md" className="w-full">Get started</Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
