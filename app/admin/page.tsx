"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Users,
  ShieldCheck,
  ShieldOff,
  UserCheck,
  RefreshCw,
  AlertTriangle,
  Building2,
  TrendingUp,
  Clock,
  ChevronRight,
  CheckCircle2,
  XCircle,
  ArrowRight,
} from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { useLanguage } from "@/contexts/LanguageContext";

interface PendingUser {
  _id: string;
  name: string;
  email: string;
  createdAt: string;
  householdId: string | null;
}

interface Stats {
  totalUsers: number;
  blockedUsers: number;
  adminUsers: number;
  newUsersToday: number;
  totalHouseholds: number;
  pendingApprovals: number;
}

export default function AdminPage() {
  const { t } = useTranslation();
  const { lang } = useLanguage();
  const [stats, setStats] = useState<Stats | null>(null);
  const [pending, setPending] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    try {
      const [statsRes, usersRes] = await Promise.all([
        fetch("/api/admin/stats", { signal: controller.signal }),
        fetch("/api/admin/users", { signal: controller.signal }),
      ]);
      clearTimeout(timeout);
      if (statsRes.ok) setStats(await statsRes.json());
      else if (statsRes.status === 403) { setError(t("admin.accessDenied")); return; }
      if (usersRes.ok) {
        const all = await usersRes.json();
        if (Array.isArray(all)) {
          setPending(all.filter((u: PendingUser & { isApproved: boolean }) => u.isApproved === false));
        }
      }
    } catch (e) {
      clearTimeout(timeout);
      const msg = e instanceof Error && e.name === "AbortError"
        ? "Request timed out — check server / database connection"
        : t("common.error");
      setError(msg);
    } finally { setLoading(false); }
  }, [t]);

  useEffect(() => { load(); }, [load]);

  const doAction = async (userId: string, action: string) => {
    setActionLoading(userId + action);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action }),
      });
      if (res.ok) await load();
    } finally { setActionLoading(null); }
  };

  const statCards = stats
    ? [
        { label: t("admin.totalUsers"), value: stats.totalUsers, icon: Users, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20", href: "/admin/users" },
        { label: t("admin.totalHouseholds"), value: stats.totalHouseholds ?? 0, icon: Building2, color: "text-green-400", bg: "bg-green-500/10 border-green-500/20", href: "/admin/households" },
        { label: t("admin.blocked"), value: stats.blockedUsers, icon: ShieldOff, color: "text-red-400", bg: "bg-red-500/10 border-red-500/20", href: "/admin/users" },
        { label: t("admin.pendingApprovals"), value: stats.pendingApprovals ?? 0, icon: Clock, color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/20", href: "#pending" },
        { label: "New Today", value: stats.newUsersToday, icon: TrendingUp, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20", href: "/admin/users" },
        { label: "Admins", value: stats.adminUsers, icon: ShieldCheck, color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/20", href: "/admin/users" },
      ]
    : [];

  return (
    <div className="space-y-8 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-red-400" />
            {t("admin.overview")}
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">{t("admin.title")}</p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-800 border border-gray-700 text-sm font-medium text-gray-300 hover:bg-gray-700 transition-colors"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          {t("common.refresh")}
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-950/50 border border-red-800 rounded-xl text-red-400 text-sm">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />{error}
        </div>
      )}

      {/* Stats Grid */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {statCards.map((s) => (
              <Link
                key={s.label}
                href={s.href}
                className={`rounded-2xl border p-4 flex flex-col gap-2 hover:scale-105 transition-transform cursor-pointer ${s.bg}`}
              >
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-xl bg-gray-800 flex items-center justify-center">
                    <s.icon className={`h-4 w-4 ${s.color}`} />
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 text-gray-600" />
                </div>
                <p className="text-2xl font-bold text-white">{s.value}</p>
                <p className="text-xs text-gray-400 leading-tight">{s.label}</p>
              </Link>
            ))}
          </div>

          {/* Pending Approvals */}
          <div id="pending" className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-gray-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-orange-400" />
                </div>
                <div>
                  <h2 className="font-semibold text-white">{t("admin.pendingApprovals")}</h2>
                  <p className="text-xs text-gray-400">
                    {pending.length} {pending.length === 1 ? "account" : "accounts"} waiting
                  </p>
                </div>
              </div>
              {pending.length > 0 && (
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-orange-500 text-white text-xs font-bold">
                  {pending.length}
                </span>
              )}
            </div>

            {pending.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 text-center">
                <div className="w-14 h-14 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center mb-4">
                  <UserCheck className="h-7 w-7 text-green-400" />
                </div>
                <p className="text-white font-medium">{t("admin.approved")}</p>
                <p className="text-sm text-gray-500 mt-1">No accounts awaiting approval</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-800">
                {pending.map((user) => (
                  <div key={user._id} className="flex items-center gap-4 p-4 hover:bg-gray-800/40 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white">{user.name}</p>
                      <p className="text-xs text-gray-400 truncate">{user.email}</p>
                      <p className="text-xs text-gray-600 mt-0.5">
                        {t("admin.joined")}: {new Date(user.createdAt).toLocaleDateString(lang)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => doAction(user._id, "approve")}
                        disabled={!!actionLoading}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-xs font-semibold transition-colors"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        {t("admin.approve")}
                      </button>
                      <button
                        onClick={() => doAction(user._id, "reject")}
                        disabled={!!actionLoading}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-900/60 hover:bg-red-900/90 disabled:opacity-50 text-red-400 text-xs font-semibold transition-colors border border-red-800/60"
                      >
                        <XCircle className="h-4 w-4" />
                        {t("admin.reject")}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Links */}
          <div className="grid sm:grid-cols-2 gap-4">
            <Link
              href="/admin/users"
              className="group flex items-center justify-between p-5 rounded-2xl bg-gray-900 border border-gray-800 hover:border-blue-700/60 hover:bg-gray-800/60 transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                  <Users className="h-6 w-6 text-blue-400" />
                </div>
                <div>
                  <p className="font-semibold text-white">{t("admin.users")}</p>
                  <p className="text-sm text-gray-400">
                    {stats?.totalUsers ?? 0} total · {stats?.blockedUsers ?? 0} blocked
                  </p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-gray-600 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
            </Link>

            <Link
              href="/admin/households"
              className="group flex items-center justify-between p-5 rounded-2xl bg-gray-900 border border-gray-800 hover:border-green-700/60 hover:bg-gray-800/60 transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-green-400" />
                </div>
                <div>
                  <p className="font-semibold text-white">{t("admin.households")}</p>
                  <p className="text-sm text-gray-400">{stats?.totalHouseholds ?? 0} total</p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-gray-600 group-hover:text-green-400 group-hover:translate-x-1 transition-all" />
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
