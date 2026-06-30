"use client";

import Link from "next/link";
import { useTranslation } from "@/hooks/useTranslation";

export default function PublicNav({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--background)" }}>
      {/* Header */}
      <header
        className="sticky top-0 z-50 backdrop-blur-md border-b"
        style={{
          background: "color-mix(in srgb, var(--sidebar-bg) 85%, transparent)",
          borderColor: "var(--sidebar-border)",
        }}
      >
        <div className="mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-200 dark:shadow-blue-900/40">
              <span className="text-white font-bold text-lg leading-none">H</span>
            </div>
            <span className="text-lg font-bold" style={{ color: "var(--foreground)" }}>HomeHub</span>
          </Link>

          <nav className="flex items-center gap-2">
            <Link
              href="/anmelden"
              className="text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors px-3 py-2 rounded-xl"
              style={{ color: "var(--muted)" }}
            >
              {t("auth.login")}
            </Link>
            <Link
              href="/registrieren"
              className="text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 px-4 py-2 rounded-xl transition-all shadow-sm hover:shadow-md btn-press"
            >
              {t("auth.register")}
            </Link>
          </nav>
        </div>
      </header>

      {/* Page content */}
      <main className="flex-1 flex items-center justify-center p-4">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t py-6 px-4 text-center" style={{ borderColor: "var(--sidebar-border)" }}>
        <div className="flex items-center justify-center gap-2 mb-1">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
            <span className="text-white font-bold text-xs">H</span>
          </div>
          <span className="font-semibold" style={{ color: "var(--muted)" }}>HomeHub</span>
        </div>
        <p className="text-sm text-gray-400">{t("landing.footerTag")}</p>
      </footer>
    </div>
  );
}
