"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import Link from "next/link";
import { Wallet, TrendingUp, TrendingDown, AlertTriangle, Receipt, PiggyBank } from "lucide-react";
import { formatCurrency, getCurrentMonth } from "@/lib/utils";

interface FinanzDashboard {
  totalSalary: number;
  totalExpenses: number;
  totalInvested: number;
  remainingBalance: number;
  unnecessaryExpensesCount: number;
  unnecessaryExpensesTotal: number;
  currency: string;
  monthlyTrend: { month: string; total: number }[];
  recentExpenses: { _id: string; title: string; amount: number; category: string; date: string; type: string }[];
  unreadAlerts: { _id: string; title: string; message: string; type: string }[];
}

export default function FinanzenDashboardPage() {
  const { t } = useTranslation();
  const [data, setData] = useState<FinanzDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/dashboard?month=${getCurrentMonth()}`)
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" /></div>;
  }

  const cur = data?.currency ?? "EUR";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Finanzen</h1>
        <p className="text-sm text-gray-500">{new Date().toLocaleDateString("de-DE", { month: "long", year: "numeric" })}</p>
      </div>

      {/* Main stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: t("finanzen.salary"), value: data?.totalSalary ?? 0, icon: Wallet, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950" },
          { label: t("finanzen.expenses"), value: data?.totalExpenses ?? 0, icon: TrendingDown, color: "text-red-600", bg: "bg-red-50 dark:bg-red-950" },
          { label: "Investiert", value: data?.totalInvested ?? 0, icon: TrendingUp, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950" },
          { label: t("finanzen.remaining"), value: data?.remainingBalance ?? 0, icon: PiggyBank, color: (data?.remainingBalance ?? 0) >= 0 ? "text-emerald-600" : "text-red-600", bg: (data?.remainingBalance ?? 0) >= 0 ? "bg-emerald-50 dark:bg-emerald-950" : "bg-red-50 dark:bg-red-950" },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className={`${bg} rounded-2xl p-5`}>
            <Icon className={`h-5 w-5 ${color} mb-2`} />
            <p className="text-xs text-gray-500">{label}</p>
            <p className={`text-lg font-bold ${color}`}>{formatCurrency(value, cur)}</p>
          </div>
        ))}
      </div>

      {/* Quick Nav */}
      <section>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Bereiche</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { href: "/finanzen/ausgaben", label: "Ausgaben", icon: Receipt, color: "text-red-500" },
            { href: "/finanzen/investitionen", label: t("finanzen.investments"), icon: TrendingUp, color: "text-blue-500" },
            { href: "/finanzen/benachrichtigungen", label: "Benachrichtigungen", icon: AlertTriangle, color: "text-orange-500", badge: data?.unreadAlerts.length },
          ].map(({ href, label, icon: Icon, color, badge }) => (
            <Link key={href} href={href} className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-4 flex items-center gap-3 hover:shadow-sm transition-shadow">
              <Icon className={`h-5 w-5 ${color}`} />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex-1">{label}</span>
              {badge !== undefined && badge > 0 && <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">{badge}</span>}
            </Link>
          ))}
        </div>
      </section>

      {/* Recent Expenses */}
      {data && data.recentExpenses.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Letzte Ausgaben</h2>
            <Link href="/finanzen/ausgaben" className="text-xs text-blue-600 hover:underline">Alle anzeigen</Link>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 divide-y divide-gray-50 dark:divide-gray-800">
            {data.recentExpenses.map((e) => (
              <div key={e._id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{e.title}</p>
                  <p className="text-xs text-gray-400">{e.category} · {new Date(e.date).toLocaleDateString("de-DE")}</p>
                </div>
                <span className={`text-sm font-semibold ${e.type === "unnecessary" ? "text-orange-600" : "text-gray-700 dark:text-gray-300"}`}>
                  {formatCurrency(e.amount, cur)}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Alerts */}
      {data && data.unreadAlerts.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Ungelesene Benachrichtigungen</h2>
          <div className="space-y-2">
            {data.unreadAlerts.slice(0, 3).map((a) => (
              <div key={a._id} className={`rounded-xl px-4 py-3 border text-sm ${a.type === "danger" ? "bg-red-50 border-red-200 text-red-700 dark:bg-red-950 dark:border-red-800 dark:text-red-400" : a.type === "warning" ? "bg-yellow-50 border-yellow-200 text-yellow-700 dark:bg-yellow-950 dark:border-yellow-800 dark:text-yellow-400" : "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-400"}`}>
                <p className="font-medium">{a.title}</p>
                <p className="text-xs opacity-80 mt-0.5">{a.message}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
