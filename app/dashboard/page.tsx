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
import { formatCurrency, cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";
import { PageHeader } from "@/components/ui/PageHeader";
import { LoadingState, SkeletonCard, SkeletonStat } from "@/components/ui/LoadingState";

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
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation();

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => {
        if (!r.ok) throw new Error("Fehler beim Laden");
        return r.json();
      })
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-8">
        <PageHeader title={t("dashboard.title")} subtitle={t("dashboard.welcome")} />
        <LoadingState variant="skeleton" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8">
        <PageHeader title={t("dashboard.title")} subtitle={t("dashboard.welcome")} />
        <div className="rounded-2xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 p-6 text-center">
          <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
        </div>
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
      <PageHeader title={t("dashboard.title")} subtitle={t("dashboard.welcome")} />

      {/* Module Cards */}
      <section>
        <h2 className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3">{t("dashboard.modules")}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 stagger-children">
          <Link
            href="/kueche"
            className="block rounded-2xl border p-5 card-hover"
            style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br from-orange-400 to-red-500 shadow-sm">
                <ChefHat className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm" style={{ color: "var(--muted)" }}>{t("nav.sections.kueche")}</p>
                <p className="text-xl font-bold" style={{ color: "var(--foreground)" }}>
                  {data?.kueche.total ?? 0} {t("dashboard.recipes")}
                </p>
              </div>
            </div>
          </Link>

          <Link
            href="/vorrat"
            className="block rounded-2xl border p-5 card-hover"
            style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br from-blue-400 to-indigo-500 shadow-sm">
                <Package className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm" style={{ color: "var(--muted)" }}>{t("nav.sections.vorrat")}</p>
                <p className="text-xl font-bold" style={{ color: "var(--foreground)" }}>
                  {data?.vorrat.total ?? 0} {t("dashboard.products")}
                </p>
              </div>
              {alerts > 0 && (
                <span className="flex-shrink-0 bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-sm animate-pulse-dot">
                  {alerts}
                </span>
              )}
            </div>
          </Link>

          <Link
            href="/finanzen/dashboard"
            className="block rounded-2xl border p-5 card-hover"
            style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br from-emerald-400 to-teal-500 shadow-sm">
                <Wallet className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm" style={{ color: "var(--muted)" }}>{t("nav.sections.finanzen")}</p>
                <p className="text-xl font-bold" style={{ color: "var(--foreground)" }}>
                  {formatCurrency(data?.remainingBalance ?? 0, data?.currency ?? "EUR")}
                </p>
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* Stock Warnings */}
      {data && alerts > 0 && (
        <section>
          <h2 className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3">{t("dashboard.stockWarnings")}</h2>
          <div className="grid grid-cols-2 gap-3 stagger-children">
            {data.vorrat.outOfStock > 0 && (
              <Link
                href="/vorrat/warnungen"
                className="rounded-xl p-4 flex items-center gap-3 transition-colors duration-150 hover:opacity-90"
                style={{ background: "var(--danger-subtle)" }}
              >
                <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0" />
                <div>
                  <p className="text-xs" style={{ color: "var(--muted)" }}>{t("dashboard.outOfStock")}</p>
                  <p className="font-semibold" style={{ color: "var(--foreground)" }}>{data.vorrat.outOfStock}</p>
                </div>
              </Link>
            )}
            {data.vorrat.lowStock > 0 && (
              <Link
                href="/vorrat/warnungen"
                className="rounded-xl p-4 flex items-center gap-3 transition-colors duration-150 hover:opacity-90"
                style={{ background: "var(--warning-subtle)" }}
              >
                <TrendingDown className="h-5 w-5 text-amber-500 flex-shrink-0" />
                <div>
                  <p className="text-xs" style={{ color: "var(--muted)" }}>{t("dashboard.lowStock")}</p>
                  <p className="font-semibold" style={{ color: "var(--foreground)" }}>{data.vorrat.lowStock}</p>
                </div>
              </Link>
            )}
            {data.vorrat.expired > 0 && (
              <Link
                href="/vorrat/warnungen"
                className="rounded-xl p-4 flex items-center gap-3 transition-colors duration-150 hover:opacity-90"
                style={{ background: "var(--danger-subtle)" }}
              >
                <Clock className="h-5 w-5 text-red-500 flex-shrink-0" />
                <div>
                  <p className="text-xs" style={{ color: "var(--muted)" }}>{t("dashboard.expired")}</p>
                  <p className="font-semibold" style={{ color: "var(--foreground)" }}>{data.vorrat.expired}</p>
                </div>
              </Link>
            )}
          </div>
        </section>
      )}

      {/* Finance Month */}
      {data && data.totalSalary > 0 && (
        <section>
          <h2 className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3">{t("dashboard.financeMonth")}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 stagger-children">
            <div className="rounded-xl p-4" style={{ background: "var(--success-subtle)" }}>
              <p className="text-xs" style={{ color: "var(--muted)" }}>{t("dashboard.salary")}</p>
              <p className="font-semibold text-emerald-600 dark:text-emerald-400">{formatCurrency(data.totalSalary, data.currency)}</p>
            </div>
            <div className="rounded-xl p-4" style={{ background: "var(--danger-subtle)" }}>
              <p className="text-xs" style={{ color: "var(--muted)" }}>{t("dashboard.expenses")}</p>
              <p className="font-semibold text-red-600 dark:text-red-400">{formatCurrency(data.totalExpenses, data.currency)}</p>
            </div>
            <div className="rounded-xl p-4" style={{ background: "var(--accent-subtle)" }}>
              <p className="text-xs" style={{ color: "var(--muted)" }}>{t("dashboard.invested")}</p>
              <p className="font-semibold text-blue-600 dark:text-blue-400">{formatCurrency(data.totalInvested, data.currency)}</p>
            </div>
            <div className="rounded-xl p-4" style={{ background: data.remainingBalance >= 0 ? "var(--success-subtle)" : "var(--danger-subtle)" }}>
              <p className="text-xs" style={{ color: "var(--muted)" }}>{t("dashboard.remaining")}</p>
              <p className={cn("font-semibold", data.remainingBalance >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400")}>
                {formatCurrency(data.remainingBalance, data.currency)}
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Quick Access */}
      <section>
        <h2 className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3">{t("dashboard.quickAccess")}</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 stagger-children">
          {[
            { href: "/kueche/neu", icon: ChefHat, color: "text-orange-500", label: t("dashboard.newRecipe") },
            { href: "/vorrat/neu", icon: Package, color: "text-blue-500", label: t("dashboard.addProduct") },
            { href: "/einkaufsliste", icon: ShoppingCart, color: "text-purple-500", label: t("dashboard.shoppingList") },
            { href: "/finanzen/ausgaben", icon: Star, color: "text-emerald-500", label: t("dashboard.trackExpense") },
          ].map(({ href, icon: Icon, color, label }) => (
            <Link
              key={href}
              href={href}
              className="block rounded-xl border p-4 text-center card-hover"
              style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}
            >
              <Icon className={cn("h-6 w-6 mx-auto mb-2", color)} />
              <p className="text-xs font-medium" style={{ color: "var(--muted)" }}>{label}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
