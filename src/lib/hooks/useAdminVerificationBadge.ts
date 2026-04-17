"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "admin_verifications_seen_count";

export function useAdminVerificationBadge(rawCount: number, pathname: string) {
  const [seenCount, setSeenCount] = useState(0);

  const markSeen = useCallback((count: number = rawCount) => {
    const next = Math.max(0, Math.floor(count));
    setSeenCount(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, String(next));
    }
  }, [rawCount]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const timer = window.setTimeout(() => {
      const stored = Number(window.localStorage.getItem(STORAGE_KEY) ?? "0");
      if (Number.isFinite(stored) && stored >= 0) {
        setSeenCount(Math.floor(stored));
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (pathname.startsWith("/admin/verifications")) {
      const timer = window.setTimeout(() => {
        markSeen(rawCount);
      }, 0);
      return () => window.clearTimeout(timer);
    }
  }, [pathname, rawCount, markSeen]);

  useEffect(() => {
    const handler = (event: Event) => {
      const custom = event as CustomEvent<{ count?: number }>;
      if (typeof custom.detail?.count === "number") {
        markSeen(custom.detail.count);
      } else {
        markSeen(rawCount);
      }
    };
    window.addEventListener("admin:verifications-seen", handler as EventListener);
    return () => {
      window.removeEventListener("admin:verifications-seen", handler as EventListener);
    };
  }, [markSeen, rawCount]);

  const displayCount = Math.max(0, rawCount - seenCount);
  const label = useMemo(
    () => (displayCount > 99 ? "99+" : String(displayCount)),
    [displayCount]
  );

  return {
    count: displayCount,
    label,
    hasBadge: displayCount > 0,
    markSeen,
  };
}
