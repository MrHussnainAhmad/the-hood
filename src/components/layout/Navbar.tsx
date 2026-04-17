"use client";

import { ArrowUpRight, Home, LogOut, Menu, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { usePollingCount } from "@/lib/hooks/usePollingCount";

const guestLinks = [
  { label: "Services", href: "/services" },
  { label: "How It Works", href: "/#how" },
  { label: "Reviews", href: "/#reviews" },
];

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { data: session } = useSession();
  const isProvider = session?.user.role === "PROVIDER";
  const providerOrdersCount = usePollingCount({
    endpoint: "/api/provider/orders/count",
    enabled: isProvider,
  });

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/login" });
  };

  const dashboardHref =
    session?.user.role === "ADMIN"
      ? "/admin"
      : session?.user.role === "PROVIDER"
      ? "/provider"
      : "/dashboard";

  const navLinks = session
    ? session.user.role === "PROVIDER"
      ? [
          { label: "Workspace", href: "/provider" },
          { label: "Services", href: "/services" },
          { label: "Orders", href: "/provider/orders" },
        ]
      : session.user.role === "ADMIN"
      ? [
          { label: "Services", href: "/services" },
          { label: "Workspace", href: "/admin" },
          { label: "Reviews", href: "/#reviews" },
        ]
      : [
          { label: "Services", href: "/services" },
          { label: "Orders", href: "/dashboard" },
        ]
    : guestLinks;

  return (
    <header className="sticky top-0 z-50 border-b border-line/75 bg-paper/90 backdrop-blur-md">
      <div className="page-shell">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-ink text-paper">
              <Home className="h-4 w-4" />
            </span>
            <span className="font-display text-2xl leading-none text-ink">The Hood</span>
          </Link>

          <nav className="hidden items-center gap-1 rounded-xl border border-line/80 bg-white/65 p-1 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="inline-flex min-h-11 items-center gap-2 rounded-lg px-4 text-sm font-semibold text-neutral-700 transition hover:bg-white"
              >
                <span>{link.label}</span>
                {isProvider &&
                  link.href === "/provider/orders" &&
                  providerOrdersCount.hasBadge && (
                    <span className="inline-flex min-w-6 justify-center rounded-full bg-primary-600 px-1.5 py-0.5 text-[11px] font-semibold leading-4 text-white">
                      {providerOrdersCount.label}
                    </span>
                  )}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-2 md:flex">
            {session ? (
              <>
                {session.user.role === "ADMIN" && (
                  <Link href={dashboardHref}>
                    <Button variant="outline" size="sm">
                      Workspace
                    </Button>
                  </Link>
                )}
                <Button onClick={handleSignOut} variant="ghost" size="sm">
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link href="/register">
                  <Button size="sm">
                    Start Free
                    <ArrowUpRight className="h-4 w-4" />
                  </Button>
                </Link>
              </>
            )}
          </div>

          <button
            onClick={() => setIsMenuOpen((s) => !s)}
            className="focus-ring grid h-11 w-11 place-items-center rounded-lg border border-line bg-white/70 md:hidden"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        <div
          className={cn(
            "overflow-hidden border-t border-line/80 transition-all duration-300 md:hidden",
            isMenuOpen ? "max-h-[24rem] py-3 opacity-100" : "max-h-0 py-0 opacity-0"
          )}
        >
          <nav className="space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsMenuOpen(false)}
                className="flex min-h-11 items-center justify-between rounded-lg px-3 text-sm font-semibold text-neutral-700 hover:bg-white/80"
              >
                <span>{link.label}</span>
                {isProvider &&
                  link.href === "/provider/orders" &&
                  providerOrdersCount.hasBadge && (
                    <span className="inline-flex min-w-6 justify-center rounded-full bg-primary-600 px-1.5 py-0.5 text-[11px] font-semibold leading-4 text-white">
                      {providerOrdersCount.label}
                    </span>
                  )}
              </Link>
            ))}
          </nav>
          <div className="mt-3 flex flex-col gap-2 border-t border-line/80 pt-3">
            {session ? (
              <>
                {session.user.role === "ADMIN" && (
                  <Link href={dashboardHref} onClick={() => setIsMenuOpen(false)}>
                    <Button variant="outline" className="w-full justify-center">
                      Workspace
                    </Button>
                  </Link>
                )}
                <Button onClick={handleSignOut} variant="ghost" className="w-full justify-center">
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Link href="/login" onClick={() => setIsMenuOpen(false)}>
                  <Button variant="ghost" className="w-full justify-center">
                    Sign In
                  </Button>
                </Link>
                <Link href="/register" onClick={() => setIsMenuOpen(false)}>
                  <Button className="w-full justify-center">Start Free</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
