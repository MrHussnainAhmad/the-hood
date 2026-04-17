"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  BadgeCheck,
  Briefcase,
  Package,
  MapPin,
  Wallet,
  Home,
  LogOut,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { usePollingCount } from "@/lib/hooks/usePollingCount";
import { useAdminVerificationBadge } from "@/lib/hooks/useAdminVerificationBadge";

const navigation = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Users", href: "/admin/users", icon: Users },
  { name: "Verifications", href: "/admin/verifications", icon: BadgeCheck },
  { name: "Services", href: "/admin/services", icon: Briefcase },
  { name: "Orders", href: "/admin/orders", icon: Package },
  { name: "Payouts", href: "/admin/payouts", icon: Wallet },
  { name: "Locations", href: "/admin/locations", icon: MapPin },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const verificationCount = usePollingCount({
    endpoint: "/api/admin/verifications/count",
    pollMs: 8000,
  });
  const verificationBadge = useAdminVerificationBadge(verificationCount.count, pathname);

  return (
    <div className="hidden md:flex md:flex-none md:w-64">
      <div className="sticky top-0 flex h-screen w-64 min-w-64 max-w-64 flex-col border-r border-line bg-[rgba(255,255,255,0.7)] backdrop-blur-sm">
        {/* Logo */}
        <div className="flex h-16 items-center gap-2 border-b border-line px-6">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-ink text-paper">
            <Home className="h-5 w-5" />
          </div>
          <div>
            <span className="text-xl font-display text-ink">The Hood</span>
            <p className="text-xs uppercase tracking-[0.1em] text-neutral-500">Admin Panel</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-6">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex min-h-11 items-center gap-3 rounded-lg px-4 font-semibold transition-all",
                  isActive
                    ? "bg-white text-ink shadow-soft"
                    : "text-neutral-700 hover:bg-white/70"
                )}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.name}</span>
                {item.href === "/admin/verifications" &&
                  verificationBadge.hasBadge && (
                    <span className="ml-auto inline-flex min-w-6 justify-center rounded-full bg-primary-600 px-1.5 py-0.5 text-[11px] font-semibold leading-4 text-white">
                      {verificationBadge.label}
                    </span>
                  )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-line p-4">
          <Link
            href="/"
            className="mb-2 flex min-h-11 items-center gap-3 rounded-lg px-4 font-semibold text-neutral-700 transition-all hover:bg-white/70"
          >
            <Home className="w-5 h-5" />
            Back to Site
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex min-h-11 w-full items-center gap-3 rounded-lg px-4 font-semibold text-rose-700 transition-all hover:bg-rose-50"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
