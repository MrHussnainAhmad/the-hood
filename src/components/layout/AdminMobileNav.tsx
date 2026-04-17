"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Home } from "lucide-react";
import { signOut } from "next-auth/react";
import { usePollingCount } from "@/lib/hooks/usePollingCount";
import { useAdminVerificationBadge } from "@/lib/hooks/useAdminVerificationBadge";

export default function AdminMobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const verificationCount = usePollingCount({
    endpoint: "/api/admin/verifications/count",
    pollMs: 8000,
  });
  const verificationBadge = useAdminVerificationBadge(verificationCount.count, pathname);

  return (
    <div className="sticky top-0 z-50 border-b border-line bg-paper/92 backdrop-blur-md md:hidden">
      <div className="flex items-center justify-between h-16 px-4">
        <Link href="/admin" className="flex items-center gap-2">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-ink text-paper">
            <Home className="h-5 w-5" />
          </div>
          <div>
            <span className="text-xl font-display text-ink">The Hood Admin</span>
          </div>
        </Link>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="focus-ring rounded-lg p-2 hover:bg-white/70"
        >
          {isOpen ? (
            <X className="w-6 h-6 text-neutral-700" />
          ) : (
            <Menu className="w-6 h-6 text-neutral-700" />
          )}
        </button>
      </div>

      {isOpen && (
        <div className="space-y-2 border-t border-line px-4 py-4">
          <Link
            href="/admin"
            onClick={() => setIsOpen(false)}
            className="block rounded-lg px-4 py-2 text-neutral-700 hover:bg-white/70"
          >
            Dashboard
          </Link>
          <Link
            href="/admin/users"
            onClick={() => setIsOpen(false)}
            className="block rounded-lg px-4 py-2 text-neutral-700 hover:bg-white/70"
          >
            Users
          </Link>
          <Link
            href="/admin/verifications"
            onClick={() => setIsOpen(false)}
            className={`flex items-center justify-between px-4 py-2 rounded-lg hover:bg-neutral-50 ${
              pathname === "/admin/verifications" ? "bg-white text-ink shadow-soft" : "text-neutral-700"
            }`}
          >
            <span>Verifications</span>
            {verificationBadge.hasBadge && (
              <span className="inline-flex min-w-6 justify-center rounded-full bg-primary-600 px-1.5 py-0.5 text-[11px] font-semibold leading-4 text-white">
                {verificationBadge.label}
              </span>
            )}
          </Link>
          <Link
            href="/admin/services"
            onClick={() => setIsOpen(false)}
            className="block rounded-lg px-4 py-2 text-neutral-700 hover:bg-white/70"
          >
            Services
          </Link>
          <Link
            href="/admin/orders"
            onClick={() => setIsOpen(false)}
            className={`block rounded-lg px-4 py-2 hover:bg-white/70 ${
              pathname === "/admin/orders" ? "bg-white text-ink shadow-soft" : "text-neutral-700"
            }`}
          >
            Orders
          </Link>
          <Link
            href="/admin/payouts"
            onClick={() => setIsOpen(false)}
            className={`block rounded-lg px-4 py-2 hover:bg-white/70 ${
              pathname === "/admin/payouts" ? "bg-white text-ink shadow-soft" : "text-neutral-700"
            }`}
          >
            Payouts
          </Link>
          <Link
            href="/admin/locations"
            onClick={() => setIsOpen(false)}
            className={`block rounded-lg px-4 py-2 hover:bg-white/70 ${
              pathname === "/admin/locations" ? "bg-white text-ink shadow-soft" : "text-neutral-700"
            }`}
          >
            Locations
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="w-full rounded-lg px-4 py-2 text-left text-rose-700 hover:bg-rose-50"
          >
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}
