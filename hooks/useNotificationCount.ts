"use client";

import { useEffect, useState } from "react";

export function useNotificationCount() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const res = await fetch("/api/benachrichtigungen?limit=100");
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        setCount(Array.isArray(data) ? data.length : 0);
      } catch {
        // ignore
      }
    };

    load();
    const interval = setInterval(load, 30_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return count;
}
