"use client";

import { useEffect, useMemo, useState } from "react";

type UsePollingCountOptions = {
  endpoint: string;
  enabled?: boolean;
  pollMs?: number;
};

export function usePollingCount({
  endpoint,
  enabled = true,
  pollMs = 30000,
}: UsePollingCountOptions) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!enabled) return;

    let isMounted = true;

    const fetchCount = async () => {
      try {
        const response = await fetch(endpoint, { cache: "no-store" });
        if (!response.ok) return;

        const contentType = response.headers.get("content-type") ?? "";
        if (!contentType.includes("application/json")) return;

        const payload = (await response.json()) as { count?: unknown };
        if (
          isMounted &&
          typeof payload.count === "number" &&
          Number.isFinite(payload.count) &&
          payload.count >= 0
        ) {
          setCount(Math.floor(payload.count));
        }
      } catch {
        // Ignore transient polling errors to keep nav stable.
      }
    };

    fetchCount();
    const intervalId = window.setInterval(fetchCount, pollMs);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, [enabled, endpoint, pollMs]);

  const safeCount = enabled ? count : 0;
  const label = useMemo(
    () => (safeCount > 99 ? "99+" : String(safeCount)),
    [safeCount]
  );

  return {
    count: safeCount,
    label,
    hasBadge: safeCount > 0,
  };
}
