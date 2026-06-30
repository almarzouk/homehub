"use client";

import { useSession, signOut } from "next-auth/react";
import { LogOut, Settings, Users, ChevronUp } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/utils";

export default function UserMenu() {
  const { data: session } = useSession();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open]);

  if (!session?.user) return null;

  const initials = session.user.name
    ? session.user.name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "??";

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all duration-150 w-full text-left group"
      >
        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 transition-transform group-hover:scale-105">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate" style={{ color: "var(--foreground)" }}>
            {session.user.name}
          </p>
          <p className="text-xs text-gray-400 truncate">{session.user.email}</p>
        </div>
        <ChevronUp
          className={cn(
            "h-4 w-4 text-gray-400 transition-transform duration-200 flex-shrink-0",
            open && "rotate-180"
          )}
        />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10 animate-overlay" onClick={() => setOpen(false)} />
          <div
            className="absolute bottom-full left-0 right-0 mb-1 rounded-xl shadow-xl z-20 py-1 border animate-scale-in"
            style={{
              background: "var(--card-bg)",
              borderColor: "var(--card-border)",
            }}
          >
            <div className="px-4 py-2.5 border-b" style={{ borderColor: "var(--card-border)" }}>
              <p className="text-xs text-gray-400">{t("auth.login")}</p>
              <p className="text-sm font-semibold truncate" style={{ color: "var(--foreground)" }}>
                {session.user.email}
              </p>
            </div>
            <Link
              href="/familie"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 w-full px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              style={{ color: "var(--foreground)" }}
            >
              <Users className="h-4 w-4 text-gray-400" />
              {t("nav.sections.familie")}
            </Link>
            <Link
              href="/einstellungen"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 w-full px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              style={{ color: "var(--foreground)" }}
            >
              <Settings className="h-4 w-4 text-gray-400" />
              {t("nav.items.einstellungen")}
            </Link>
            <div className="border-t mt-1 pt-1" style={{ borderColor: "var(--card-border)" }}>
              <button
                onClick={() => signOut({ callbackUrl: "/anmelden" })}
                className="flex items-center gap-2.5 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                {t("common.logout")}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
