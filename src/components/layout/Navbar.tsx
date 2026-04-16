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
          { label: "Reviews", href: "/#reviews" },
        ]
    : guestLinks;

  return (
    <header className="sticky top-3 z-50 px-3 xs:px-4 lg:px-8">
      <div className="mx-auto flex w-full max-w-[84rem] items-center justify-between rounded-2xl border border-line/70 bg-paper/85 px-3 py-2 shadow-soft backdrop-blur-md sm:px-5">
        <Link href="/" className="group flex items-center gap-2 rounded-xl px-2 py-1.5">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-primary-500 to-accent-600 text-paper shadow-soft">
            <Home className="h-5 w-5" />
          </div>
          <div>
            <p className="font-display text-xl tracking-tight text-ink">Hood</p>
            <p className="-mt-1 text-[11px] uppercase tracking-[0.18em] text-neutral-600">Studio</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 rounded-full border border-line/70 bg-white/70 p-1 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-neutral-700 transition-all duration-300 hover:bg-mist hover:text-ink"
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
                  <Button variant="outline" size="sm" className="rounded-full border-accent-600/35 bg-white/80">
                    Workspace
                  </Button>
                </Link>
              )}
              <Button onClick={handleSignOut} variant="ghost" size="sm" className="rounded-full text-neutral-700">
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm" className="rounded-full text-neutral-700">Sign In</Button>
              </Link>
              <Link href="/register">
                <Button size="sm" className="rounded-full">
                  Join Now
                  <ArrowUpRight className="h-4 w-4" />
                </Button>
              </Link>
            </>
          )}
        </div>

        <button
          onClick={() => setIsMenuOpen((s) => !s)}
          className="grid h-11 w-11 place-items-center rounded-xl border border-line bg-white/70 md:hidden"
          aria-label="Toggle menu"
        >
          {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <div
        className={cn(
          "mx-auto mt-2 max-w-[84rem] overflow-hidden rounded-2xl border border-line/70 bg-paper/95 px-3 transition-all duration-300 md:hidden",
          isMenuOpen ? "max-h-[24rem] py-3 opacity-100" : "max-h-0 py-0 opacity-0"
        )}
      >
        <nav className="space-y-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setIsMenuOpen(false)}
              className="flex items-center justify-between rounded-xl px-3 py-3 text-sm font-medium text-neutral-700 hover:bg-white"
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
                  <Button variant="outline" className="w-full justify-center rounded-full">Workspace</Button>
                </Link>
              )}
              <Button onClick={handleSignOut} variant="ghost" className="w-full justify-center rounded-full">
                Sign Out
              </Button>
            </>
          ) : (
            <>
              <Link href="/login" onClick={() => setIsMenuOpen(false)}>
                <Button variant="ghost" className="w-full justify-center rounded-full">Sign In</Button>
              </Link>
              <Link href="/register" onClick={() => setIsMenuOpen(false)}>
                <Button className="w-full justify-center rounded-full">Join Now</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
