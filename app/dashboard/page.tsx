"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ChefHat, Package, Wallet, AlertTriangle, TrendingDown,
  Star, ShoppingCart, Clock, Plus, ArrowRight, Zap,
} from "lucide-react";
import { formatCurrency, cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";
import { useLanguage } from "@/contexts/LanguageContext";

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

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800", className)} />;
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex items-center gap-3">
        <Skeleton className="w-12 h-12 rounded-2xl" />
        <div className="space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-3.5 w-24" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        {[0, 1, 2].map((i) => <Skeleton key={i} className="h-28 sm:h-32" />)}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-20" />)}
      </div>
    </div>
  );
}

// ─── Module Card ──────────────────────────────────────────────────────────────

function ModuleCard({
  href, gradient, icon: Icon, label, value, subvalue, badge,
}: {
  href: string;
  gradient: string;
  icon: React.ElementType;
  label: string;
  value: string | number;
  subvalue?: string;
  badge?: number;
}) {
  return (
    <Link
      href={href}
      className="relative flex flex-col items-center text-center p-3 sm:p-5 rounded-2xl border card-hover overflow-hidden"
      style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}
    >
      {badge !== undefined && badge > 0 && (
        <span className="absolute top-2 right-2 min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-red-500 text-white text-[9px] font-bold rounded-full animate-pulse-dot z-10">
          {badge > 99 ? "99+" : badge}
        </span>
      )}
      <div className={cn("w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shadow-sm mb-2 sm:mb-3 flex-shrink-0", gradient)}>
        <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
      </div>
      <p
        className="text-base sm:text-xl font-bold leading-tight w-full truncate"
        style={{ color: "var(--foreground)" }}
      >
        {value}
      </p>
      {subvalue && (
        <p className="text-[10px] sm:text-xs mt-0.5 truncate w-full" style={{ color: "var(--muted)" }}>
          {subvalue}
        </p>
      )}
      <p className="text-[10px] sm:text-xs font-medium mt-1 truncate w-full" style={{ color: "var(--muted)" }}>
        {label}
      </p>
    </Link>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation();
  const { lang } = useLanguage();

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

  const today = new Date().toLocaleDateString(lang, { weekday: "long", day: "numeric", month: "long" });

  if (loading) return <DashboardSkeleton />;

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 p-6 text-center mt-4">
        <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
        <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
      </div>
    );
  }

  const alerts =
    (data?.vorrat.outOfStock ?? 0) +
    (data?.vorrat.lowStock ?? 0) +
    (data?.vorrat.expired ?? 0) +
    (data?.vorrat.expiringSoon ?? 0);

  const balance = data?.remainingBalance ?? 0;
  const isNegative = balance < 0;

  // Format balance compactly for small cards
  const formatCompact = (val: number, currency: string) => {
    const abs = Math.abs(val);
    const sign = val < 0 ? "-" : "";
    if (abs >= 10000) return `${sign}${(abs / 1000).toFixed(1)}k ${currency === "EUR" ? "€" : currency}`;
    return formatCurrency(val, currency);
  };

  return (
    <div className="space-y-6 sm:space-y-8">

      {/* ── Greeting ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold" style={{ color: "var(--foreground)" }}>
            {t("dashboard.title")}
          </h1>
          <p className="text-xs sm:text-sm mt-0.5 capitalize" style={{ color: "var(--muted)" }}>
            {today}
          </p>
        </div>
        {alerts > 0 && (
          <Link
            href="/vorrat/warnungen"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 transition-colors hover:bg-red-100 dark:hover:bg-red-950"
          >
            <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
            <span>{alerts} {t("dashboard.stockWarnings")}</span>
          </Link>
        )}
      </div>

      {/* ── Module Cards — always 3 cols ─────────────────────────────── */}
      <section>
        <SectionLabel label={t("dashboard.modules")} />
        <div className="grid grid-cols-3 gap-2 sm:gap-4 stagger-children">
          <ModuleCard
            href="/kueche"
            gradient="bg-gradient-to-br from-orange-400 to-red-500"
            icon={ChefHat}
            label={t("nav.sections.kueche")}
            value={data?.kueche.total ?? 0}
            subvalue={t("dashboard.recipes")}
          />
          <ModuleCard
            href="/vorrat"
            gradient="bg-gradient-to-br from-blue-400 to-indigo-500"
            icon={Package}
            label={t("nav.sections.vorrat")}
            value={data?.vorrat.total ?? 0}
            subvalue={t("dashboard.products")}
            badge={alerts}
          />
          <ModuleCard
            href="/finanzen/dashboard"
            gradient="bg-gradient-to-br from-emerald-400 to-teal-500"
            icon={Wallet}
            label={t("nav.sections.finanzen")}
            value={formatCompact(balance, data?.currency ?? "EUR")}
            subvalue={isNegative ? t("dashboard.remaining") : t("dashboard.remaining")}
          />
        </div>
      </section>

      {/* ── Finance Stats ─────────────────────────────────────────────── */}
      {data && data.totalSalary > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <SectionLabel label={t("dashboard.financeMonth")} className="mb-0" />
            <Link href="/finanzen/dashboard" className="flex items-center gap-1 text-[11px] font-medium text-blue-600 dark:text-blue-400 hover:underline">
              {t("common.viewAll")} <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 stagger-children">
            {[
              {
                label: t("dashboard.salary"),
                value: formatCurrency(data.totalSalary, data.currency),
                bg: "var(--success-subtle)",
                color: "text-emerald-600 dark:text-emerald-400",
              },
              {
                label: t("dashboard.expenses"),
                value: formatCurrency(data.totalExpenses, data.currency),
                bg: "var(--danger-subtle)",
                color: "text-red-600 dark:text-red-400",
              },
              {
                label: t("dashboard.invested"),
                value: formatCurrency(data.totalInvested, data.currency),
                bg: "var(--accent-subtle)",
                color: "text-blue-600 dark:text-blue-400",
              },
              {
                label: t("dashboard.remaining"),
                value: formatCurrency(data.remainingBalance, data.currency),
                bg: data.remainingBalance >= 0 ? "var(--success-subtle)" : "var(--danger-subtle)",
                color: data.remainingBalance >= 0
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-red-600 dark:text-red-400",
              },
            ].map(({ label, value, bg, color }) => (
              <div
                key={label}
                className="rounded-xl p-3 sm:p-4 flex flex-col gap-1"
                style={{ background: bg }}
              >
                <p className="text-[10px] sm:text-xs font-medium" style={{ color: "var(--muted)" }}>
                  {label}
                </p>
                <p className={cn("font-bold text-sm sm:text-base truncate", color)}>
                  {value}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Stock Warnings ────────────────────────────────────────────── */}
      {data && alerts > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <SectionLabel label={t("dashboard.stockWarnings")} className="mb-0" />
            <Link href="/vorrat/warnungen" className="flex items-center gap-1 text-[11px] font-medium text-blue-600 dark:text-blue-400 hover:underline">
              {t("common.viewAll")} <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:gap-3 stagger-children">
            {data.vorrat.outOfStock > 0 && (
              <WarningCard
                href="/vorrat/warnungen"
                icon={AlertTriangle}
                iconColor="text-red-500"
                bg="var(--danger-subtle)"
                label={t("dashboard.outOfStock")}
                count={data.vorrat.outOfStock}
              />
            )}
            {data.vorrat.lowStock > 0 && (
              <WarningCard
                href="/vorrat/warnungen"
                icon={TrendingDown}
                iconColor="text-amber-500"
                bg="var(--warning-subtle)"
                label={t("dashboard.lowStock")}
                count={data.vorrat.lowStock}
              />
            )}
            {data.vorrat.expired > 0 && (
              <WarningCard
                href="/vorrat/warnungen"
                icon={Clock}
                iconColor="text-red-500"
                bg="var(--danger-subtle)"
                label={t("dashboard.expired")}
                count={data.vorrat.expired}
              />
            )}
            {data.vorrat.expiringSoon > 0 && (
              <WarningCard
                href="/vorrat/warnungen"
                icon={Clock}
                iconColor="text-amber-500"
                bg="var(--warning-subtle)"
                label={t("dashboard.expiringSoon") || "Läuft bald ab"}
                count={data.vorrat.expiringSoon}
              />
            )}
          </div>
        </section>
      )}

      {/* ── Quick Actions — horizontal scroll on mobile ───────────────── */}
      <section>
        <SectionLabel label={t("dashboard.quickAccess")} />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 stagger-children">
          {[
            {
              href: "/kueche/neu",
              icon: ChefHat,
              gradient: "bg-gradient-to-br from-orange-400 to-red-500",
              label: t("dashboard.newRecipe"),
            },
            {
              href: "/vorrat/neu",
              icon: Package,
              gradient: "bg-gradient-to-br from-blue-400 to-indigo-500",
              label: t("dashboard.addProduct"),
            },
            {
              href: "/einkaufsliste",
              icon: ShoppingCart,
              gradient: "bg-gradient-to-br from-purple-400 to-violet-500",
              label: t("dashboard.shoppingList"),
            },
            {
              href: "/finanzen/ausgaben",
              icon: Star,
              gradient: "bg-gradient-to-br from-emerald-400 to-teal-500",
              label: t("dashboard.trackExpense"),
            },
          ].map(({ href, icon: Icon, gradient, label }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 sm:flex-col sm:items-center sm:text-center p-3 sm:p-4 rounded-2xl border card-hover"
              style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}
            >
              <div className={cn("w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shadow-sm flex-shrink-0 sm:mb-1", gradient)}>
                <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
              <p className="text-xs sm:text-[11px] font-medium leading-tight" style={{ color: "var(--foreground)" }}>
                {label}
              </p>
            </Link>
          ))}
        </div>
      </section>

    </div>
  );
}

// ─── Small helper components ──────────────────────────────────────────────────

function SectionLabel({ label, className }: { label: string; className?: string }) {
  return (
    <h2
      className={cn(
        "text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3",
        className
      )}
    >
      {label}
    </h2>
  );
}

function WarningCard({
  href, icon: Icon, iconColor, bg, label, count,
}: {
  href: string;
  icon: React.ElementType;
  iconColor: string;
  bg: string;
  label: string;
  count: number;
}) {
  return (
    <Link
      href={href}
      className="rounded-xl p-3 sm:p-4 flex items-center gap-3 transition-colors hover:opacity-90 card-hover"
      style={{ background: bg }}
    >
      <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/60 dark:bg-black/20 flex-shrink-0">
        <Icon className={cn("h-4 w-4", iconColor)} />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] sm:text-xs truncate" style={{ color: "var(--muted)" }}>{label}</p>
        <p className="text-base sm:text-lg font-bold" style={{ color: "var(--foreground)" }}>{count}</p>
      </div>
    </Link>
  );
}
