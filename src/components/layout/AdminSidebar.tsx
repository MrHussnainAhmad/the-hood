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
  });

  return (
    <div className="hidden md:flex md:flex-none md:w-64">
      <div className="sticky top-0 flex h-screen w-64 min-w-64 max-w-64 flex-col bg-white border-r border-neutral-200">
        {/* Logo */}
        <div className="flex items-center gap-2 h-16 px-6 border-b border-neutral-200">
          <div className="w-10 h-10 bg-gradient-to-br from-accent-600 to-accent-700 rounded-lg flex items-center justify-center">
            <Home className="w-6 h-6 text-white" />
          </div>
          <div>
            <span className="text-xl font-display font-bold bg-gradient-to-r from-accent-600 to-accent-700 bg-clip-text text-transparent">
              Hood
            </span>
            <p className="text-xs text-neutral-500">Admin Panel</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all",
                  isActive
                    ? "bg-accent-50 text-accent-700"
                    : "text-neutral-700 hover:bg-neutral-50"
                )}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.name}</span>
                {item.href === "/admin/verifications" &&
                  verificationCount.hasBadge && (
                    <span className="ml-auto inline-flex min-w-6 justify-center rounded-full bg-accent-600 px-1.5 py-0.5 text-[11px] font-semibold leading-4 text-white">
                      {verificationCount.label}
                    </span>
                  )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-200">
          <Link
            href="/"
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-neutral-700 hover:bg-neutral-50 font-medium transition-all mb-2"
          >
            <Home className="w-5 h-5" />
            Back to Site
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-700 hover:bg-red-50 font-medium transition-all"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
