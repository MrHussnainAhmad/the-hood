"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Briefcase, Package, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { usePollingCount } from "@/lib/hooks/usePollingCount";

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isProvider = session?.user.role === "PROVIDER";
  const providerOrdersCount = usePollingCount({
    endpoint: "/api/provider/orders/count",
    enabled: isProvider,
  });
  const navigation = [
    { name: "Home", href: "/", icon: Home },
    { name: "Services", href: "/services", icon: Briefcase },
    {
      name: "Orders",
      href: session?.user.role === "PROVIDER" ? "/provider/orders" : "/dashboard",
      icon: Package,
    },
    { name: "Profile", href: "/profile", icon: User },
  ];

  if (pathname.startsWith("/admin")) return null;

  return (
    <div className="safe-area-pb fixed bottom-0 left-0 right-0 z-50 border-t border-line/80 bg-paper/92 backdrop-blur-md md:hidden">
      <nav className="flex items-center justify-around px-2 py-2.5">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "focus-ring flex min-w-[72px] flex-col items-center gap-1 rounded-lg px-4 py-2 transition-all",
                isActive
                  ? "bg-white text-ink shadow-soft"
                  : "text-neutral-600 hover:bg-white/70 active:scale-95"
              )}
            >
              <div className="relative">
                <item.icon
                  className={cn(
                    "w-6 h-6 transition-transform",
                    isActive && "scale-110"
                  )}
                />
                {isProvider &&
                  item.name === "Orders" &&
                  providerOrdersCount.hasBadge && (
                    <span className="absolute -right-2 -top-2 inline-flex min-w-5 justify-center rounded-full bg-primary-600 px-1 py-[1px] text-[10px] font-semibold leading-3 text-white">
                      {providerOrdersCount.label}
                    </span>
                  )}
              </div>
              <span className="text-xs font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
