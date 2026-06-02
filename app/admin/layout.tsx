"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  ShieldCheck,
  Users,
  Home,
  BarChart3,
  LogOut,
  Building2,
  Settings,
  ChevronRight,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { useTranslation } from "@/hooks/useTranslation";

const ADMIN_NAV = [
  { href: "/admin", label: "overview", icon: BarChart3, exact: true },
  { href: "/admin/users", label: "users", icon: Users, exact: false },
  { href: "/admin/households", label: "households", icon: Building2, exact: false },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useTranslation();

  const user = session?.user as { role?: string; name?: string; email?: string } | undefined;

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/anmelden");
    if (status === "authenticated" && user?.role !== "admin") router.replace("/");
  }, [status, user, router]);

  if (status === "loading" || !user || user.role !== "admin") {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-950 text-white">
      {/* ── Admin Sidebar ── */}
      <aside className="w-64 shrink-0 bg-gray-900 border-r border-gray-800 flex flex-col hidden md:flex">
        {/* Logo */}
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center shadow-lg shadow-red-900/40">
              <ShieldCheck className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-white text-sm">HomeHub</p>
              <p className="text-xs text-red-400 font-semibold uppercase tracking-wider">{t("admin.title")}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {ADMIN_NAV.map((item) => {
            const Icon = item.icon;
            const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href) && !( item.href === "/admin" && pathname !== "/admin");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                  isActive
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-900/40"
                    : "text-gray-400 hover:text-white hover:bg-gray-800"
                }`}
              >
                <Icon className={`h-4 w-4 flex-shrink-0 ${isActive ? "text-white" : "text-gray-500 group-hover:text-white"}`} />
                {t(`admin.${item.label}`)}
                {isActive && <ChevronRight className="h-3 w-3 ml-auto" />}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-800 space-y-1">
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-800 transition-all"
          >
            <Home className="h-4 w-4 text-gray-500" />
            {t("nav.items.home")}
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: "/anmelden" })}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:text-red-400 hover:bg-red-950/40 transition-all"
          >
            <LogOut className="h-4 w-4" />
            {t("common.logout")}
          </button>
        </div>
      </aside>

      {/* ── Mobile Top Bar ── */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 h-14 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-red-400" />
          <span className="font-bold text-sm text-white">Admin Panel</span>
        </div>
        <div className="flex items-center gap-1">
          {ADMIN_NAV.map((item) => {
            const Icon = item.icon;
            const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href) && !(item.href === "/admin" && pathname !== "/admin");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`p-2 rounded-lg transition-colors ${isActive ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white"}`}
              >
                <Icon className="h-4 w-4" />
              </Link>
            );
          })}
          <Link href="/" className="p-2 rounded-lg text-gray-400 hover:text-white">
            <Home className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="hidden md:flex items-center justify-between h-16 px-8 bg-gray-900/50 border-b border-gray-800">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <ShieldCheck className="h-4 w-4 text-red-400" />
            <span>{t("admin.title")}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gray-800 text-sm">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-white text-xs font-bold">
                {user.name?.charAt(0).toUpperCase()}
              </div>
              <span className="text-gray-300 text-xs font-medium">{user.name}</span>
              <span className="px-1.5 py-0.5 rounded-md bg-yellow-900/60 text-yellow-400 text-xs font-semibold">Admin</span>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8 pt-18 md:pt-6">
          {children}
        </main>
      </div>
    </div>
  );
}
