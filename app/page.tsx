"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ChefHat,
  Package,
  Wallet,
  AlertTriangle,
  TrendingDown,
  Star,
  ShoppingCart,
  Clock,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";

interface DashboardData {
  totalSalary: number;
  totalExpenses: number;
  totalInvested: number;
  remainingBalance: number;
  unnecessaryExpensesCount: number;
  currency: string;
  vorrat: { total: number; outOfStock: number; lowStock: number; expired: number; expiringSoon: number };
  kueche: { total: number; favoriten: number };
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const alerts =
    (data?.vorrat.outOfStock ?? 0) +
    (data?.vorrat.lowStock ?? 0) +
    (data?.vorrat.expired ?? 0) +
    (data?.vorrat.expiringSoon ?? 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t("dashboard.title")}</h1>
        <p className="text-gray-500 text-sm mt-1">{t("dashboard.welcome")}</p>
      </div>

      <section>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">{t("dashboard.modules")}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link href="/kueche" className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 hover:shadow-md transition-shadow flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-orange-500"><ChefHat className="h-6 w-6 text-white" /></div>
            <div>
              <p className="text-sm text-gray-500">{t("nav.sections.kueche")}</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{data?.kueche.total ?? 0} {t("dashboard.recipes")}</p>
            </div>
          </Link>
          <Link href="/vorrat" className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 hover:shadow-md transition-shadow flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-blue-500"><Package className="h-6 w-6 text-white" /></div>
            <div className="flex-1">
              <p className="text-sm text-gray-500">{t("nav.sections.vorrat")}</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{data?.vorrat.total ?? 0} {t("dashboard.products")}</p>
            </div>
            {alerts > 0 && <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{alerts}</span>}
          </Link>
          <Link href="/finanzen/dashboard" className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 hover:shadow-md transition-shadow flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-emerald-500"><Wallet className="h-6 w-6 text-white" /></div>
            <div>
              <p className="text-sm text-gray-500">{t("nav.sections.finanzen")}</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(data?.remainingBalance ?? 0, data?.currency ?? "EUR")}</p>
            </div>
          </Link>
        </div>
      </section>

      {data && alerts > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">{t("dashboard.stockWarnings")}</h2>
          <div className="grid grid-cols-2 gap-3">
            {data.vorrat.outOfStock > 0 && (
              <Link href="/vorrat/warnungen" className="bg-red-50 dark:bg-red-950 rounded-xl p-4 flex items-center gap-3 hover:bg-red-100 transition-colors">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                <div><p className="text-xs text-gray-500">{t("dashboard.outOfStock")}</p><p className="font-semibold text-gray-900 dark:text-white">{data.vorrat.outOfStock}</p></div>
              </Link>
            )}
            {data.vorrat.lowStock > 0 && (
              <Link href="/vorrat/warnungen" className="bg-yellow-50 dark:bg-yellow-950 rounded-xl p-4 flex items-center gap-3 hover:bg-yellow-100 transition-colors">
                <TrendingDown className="h-5 w-5 text-yellow-500" />
                <div><p className="text-xs text-gray-500">{t("dashboard.lowStock")}</p><p className="font-semibold text-gray-900 dark:text-white">{data.vorrat.lowStock}</p></div>
              </Link>
            )}
            {data.vorrat.expired > 0 && (
              <Link href="/vorrat/warnungen" className="bg-red-50 dark:bg-red-950 rounded-xl p-4 flex items-center gap-3">
                <Clock className="h-5 w-5 text-red-500" />
                <div><p className="text-xs text-gray-500">{t("dashboard.expired")}</p><p className="font-semibold text-gray-900 dark:text-white">{data.vorrat.expired}</p></div>
              </Link>
            )}
          </div>
        </section>
      )}

      {data && data.totalSalary > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">{t("dashboard.financeMonth")}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-emerald-50 dark:bg-emerald-950 rounded-xl p-4">
              <p className="text-xs text-gray-500">{t("dashboard.salary")}</p>
              <p className="font-semibold text-emerald-700 dark:text-emerald-400">{formatCurrency(data.totalSalary, data.currency)}</p>
            </div>
            <div className="bg-red-50 dark:bg-red-950 rounded-xl p-4">
              <p className="text-xs text-gray-500">{t("dashboard.expenses")}</p>
              <p className="font-semibold text-red-700 dark:text-red-400">{formatCurrency(data.totalExpenses, data.currency)}</p>
            </div>
            <div className="bg-blue-50 dark:bg-blue-950 rounded-xl p-4">
              <p className="text-xs text-gray-500">{t("dashboard.invested")}</p>
              <p className="font-semibold text-blue-700 dark:text-blue-400">{formatCurrency(data.totalInvested, data.currency)}</p>
            </div>
            <div className={`rounded-xl p-4 ${data.remainingBalance >= 0 ? "bg-emerald-50 dark:bg-emerald-950" : "bg-red-50 dark:bg-red-950"}`}>
              <p className="text-xs text-gray-500">{t("dashboard.remaining")}</p>
              <p className={`font-semibold ${data.remainingBalance >= 0 ? "text-emerald-700 dark:text-emerald-400" : "text-red-700 dark:text-red-400"}`}>{formatCurrency(data.remainingBalance, data.currency)}</p>
            </div>
          </div>
        </section>
      )}

      <section>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">{t("dashboard.quickAccess")}</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Link href="/kueche/neu" className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-4 text-center hover:shadow-md transition-shadow">
            <ChefHat className="h-6 w-6 text-orange-500 mx-auto mb-1.5" />
            <p className="text-xs font-medium text-gray-600 dark:text-gray-400">{t("dashboard.newRecipe")}</p>
          </Link>
          <Link href="/vorrat/produkte/neu" className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-4 text-center hover:shadow-md transition-shadow">
            <Package className="h-6 w-6 text-blue-500 mx-auto mb-1.5" />
            <p className="text-xs font-medium text-gray-600 dark:text-gray-400">{t("dashboard.addProduct")}</p>
          </Link>
          <Link href="/vorrat/einkaufsliste" className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-4 text-center hover:shadow-md transition-shadow">
            <ShoppingCart className="h-6 w-6 text-purple-500 mx-auto mb-1.5" />
            <p className="text-xs font-medium text-gray-600 dark:text-gray-400">{t("dashboard.shoppingList")}</p>
          </Link>
          <Link href="/finanzen/ausgaben" className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-4 text-center hover:shadow-md transition-shadow">
            <Star className="h-6 w-6 text-emerald-500 mx-auto mb-1.5" />
            <p className="text-xs font-medium text-gray-600 dark:text-gray-400">{t("dashboard.trackExpense")}</p>
          </Link>
        </div>
      </section>
    </div>
  );
}
