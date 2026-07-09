"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { useLanguage } from "@/contexts/LanguageContext";
import Link from "next/link";
import {
  Wallet, TrendingDown, Receipt, PiggyBank,
  CalendarClock, FileBarChart, ChevronRight, Lock,
  Settings, Plus, ArrowUpRight, Sparkles,
} from "lucide-react";
import { formatCurrency, getCurrentMonth, toCents } from "@/lib/utils";
import SavingsBoxCard, { type SavingsBox } from "@/components/finanzen/SavingsBoxCard";
import { useHouseholdConfig } from "@/hooks/useHouseholdConfig";
import type { FinanzSectionKey } from "@/lib/finanzen-sections";
import FinanzSetupWizard from "@/components/finanzen/FinanzSetupWizard";
import { BALANCE_DEDUCTION_REGISTRY, computeDeductedTotal, type BalanceDeductionKey } from "@/lib/finance-balance";

interface FinanzDashboard {
  totalSalary: number;
  totalExpenses: number;
  totalFixkosten: number;
  totalInvested: number;
  totalSavingsDeposits: number;
  remainingBalance: number;
  balanceDeductions: BalanceDeductionKey[];
  currency: string;
  recentExpenses: { _id: string; title: string; amount: number; category: string; date: string; type: string }[];
  unreadAlerts: { _id: string; title: string; message: string; type: string }[];
  savingsGoals: SavingsBox[];
}

const TYPE_COLORS: Record<string, string> = {
  necessary: "text-red-500",
  unnecessary: "text-orange-500",
  investment: "text-blue-500",
};

const SECTION_LINKS: {
  key: FinanzSectionKey;
  href: string;
  labelKey: string;
  icon: React.ElementType;
  gradient: string;
}[] = [
  { key: "ausgaben", href: "/finanzen/ausgaben", labelKey: "finanzen.expenses", icon: Receipt, gradient: "from-rose-500 to-red-600" },
  { key: "fixkosten", href: "/finanzen/fixkosten", labelKey: "finanzen.fixkosten", icon: Lock, gradient: "from-indigo-500 to-violet-600" },
  { key: "sparziele", href: "/finanzen/sparziele", labelKey: "finanzen.savingsBoxes", icon: PiggyBank, gradient: "from-emerald-500 to-teal-600" },
  { key: "monatsplan", href: "/finanzen/monatsplan", labelKey: "finanzen.monthlyPlan", icon: CalendarClock, gradient: "from-sky-500 to-blue-600" },
  { key: "berichte", href: "/finanzen/berichte", labelKey: "finanzen.reports", icon: FileBarChart, gradient: "from-purple-500 to-fuchsia-600" },
];

export default function FinanzenDashboardPage() {
  const { t } = useTranslation();
  const { lang } = useLanguage();
  const { isFinanzSectionEnabled } = useHouseholdConfig();
  const [data, setData] = useState<FinanzDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSetup, setShowSetup] = useState(false);
  const [setupChecked, setSetupChecked] = useState(false);

  useEffect(() => {
    fetch("/api/finanzen/status")
      .then((r) => r.json())
      .then((status) => {
        if (status.needsSetup) setShowSetup(true);
        setSetupChecked(true);
      })
      .catch(() => setSetupChecked(true));
  }, []);

  const dismissSetup = async () => {
    await fetch("/api/finanzen/status", { method: "POST" });
    localStorage.setItem("finanzen_setup_done", "1");
    setShowSetup(false);
  };

  const completeSetup = () => {
    localStorage.setItem("finanzen_setup_done", "1");
    setShowSetup(false);
    loadDashboard();
  };

  const loadDashboard = useCallback(async () => {
    const res = await fetch(`/api/dashboard?month=${getCurrentMonth()}`);
    setData(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);

  const handleDeposit = async (id: string, amountCents: number, note?: string) => {
    const res = await fetch(`/api/finanzen/sparziele/${id}/einzahlung`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: amountCents, note }),
    });
    if (!res.ok) throw new Error("Deposit failed");
    await loadDashboard();
  };

  const visibleSections = SECTION_LINKS.filter((s) => isFinanzSectionEnabled(s.key));
  const savingsBoxes = data?.savingsGoals ?? [];
  const showSavings = isFinanzSectionEnabled("sparziele");

  if (loading || !setupChecked) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const cur = data?.currency ?? "EUR";
  const salary = data?.totalSalary ?? 0;
  const expenses = data?.totalExpenses ?? 0;
  const fixkostenTotal = data?.totalFixkosten ?? 0;
  const remaining = data?.remainingBalance ?? 0;
  const deductions = data?.balanceDeductions ?? ["ausgaben", "fixkosten"];
  const deductedTotal = computeDeductedTotal(
    {
      ausgaben: expenses,
      fixkosten: fixkostenTotal,
      investments: data?.totalInvested ?? 0,
      sparziele: data?.totalSavingsDeposits ?? 0,
    },
    deductions
  );
  const spentPct = salary > 0 ? Math.min(100, Math.round((deductedTotal / salary) * 100)) : 0;
  const deductionLabel = deductions
    .map((key) => t(BALANCE_DEDUCTION_REGISTRY.find((d) => d.key === key)?.labelKey ?? "finanzen.expenses"))
    .join(" + ");

  return (
    <div className="space-y-5 pb-4">
      <FinanzSetupWizard
        open={showSetup}
        onClose={dismissSetup}
        onComplete={completeSetup}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-0.5">
            {new Date().toLocaleDateString(lang, { month: "long", year: "numeric" })}
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
            {t("finanzen.title")}
          </h1>
        </div>
        <Link
          href="/einstellungen/finanzen"
          className="p-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          title={t("finanzen.sectionSettings")}
        >
          <Settings className="h-4 w-4" />
        </Link>
      </div>

      {/* Hero balance card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 p-5 sm:p-6 text-white shadow-xl shadow-emerald-900/20">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
        <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-white/5 rounded-full blur-xl" />

        <div className="relative">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="h-4 w-4 text-emerald-200" />
            <span className="text-sm text-emerald-100 font-medium">{t("finanzen.remaining")}</span>
          </div>
          <p className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
            {formatCurrency(remaining, cur)}
          </p>

          {salary > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-emerald-100">
                <span>{deductionLabel}</span>
                <span>{spentPct}%</span>
              </div>
              <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-red-400 rounded-full transition-all duration-700"
                  style={{ width: `${spentPct}%` }}
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-3 gap-3 mt-5 pt-4 border-t border-white/20">
            {[
              { label: t("finanzen.salary"), value: salary, valueClass: "text-white" },
              { label: t("finanzen.expenses"), value: expenses, valueClass: "text-red-300" },
              { label: t("finanzen.fixkosten"), value: fixkostenTotal, valueClass: "text-indigo-200" },
            ].map(({ label, value, valueClass }) => (
              <div key={label}>
                <p className={`text-[10px] uppercase tracking-wide ${label === t("finanzen.expenses") ? "text-red-200" : "text-emerald-200"}`}>
                  {label}
                </p>
                <p className={`text-sm font-semibold mt-0.5 ${valueClass}`}>{formatCurrency(value, cur)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Savings boxes — horizontal scroll on mobile */}
      {showSavings && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">{t("finanzen.savingsBoxes")}</h2>
            <Link
              href="/finanzen/sparziele"
              className="flex items-center gap-1 text-xs font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              {t("finanzen.newSavingsBox")}
            </Link>
          </div>

          {savingsBoxes.length === 0 ? (
            <Link
              href="/finanzen/sparziele"
              className="flex items-center gap-4 p-4 rounded-2xl border-2 border-dashed border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/30 hover:bg-emerald-50 dark:hover:bg-emerald-950 transition-colors"
            >
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center flex-shrink-0">
                <PiggyBank className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <p className="font-medium text-emerald-800 dark:text-emerald-300">{t("finanzen.createFirstBox")}</p>
                <p className="text-xs text-emerald-600/80 mt-0.5">{t("finanzen.savingsBoxesDesc")}</p>
              </div>
              <ArrowUpRight className="h-4 w-4 text-emerald-500 ms-auto flex-shrink-0" />
            </Link>
          ) : (
            <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1 snap-x snap-mandatory scrollbar-none">
              {savingsBoxes.map((box) => (
                <div key={box._id} className="min-w-[280px] sm:min-w-0 sm:flex-1 snap-start">
                  <SavingsBoxCard box={box} onDeposit={handleDeposit} compact />
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Quick actions */}
      {visibleSections.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">{t("finanzen.sections")}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {visibleSections.map(({ href, labelKey, icon: Icon, gradient }) => (
              <Link
                key={href}
                href={href}
                className="group flex items-center gap-3 p-3.5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700 hover:shadow-md transition-all"
              >
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                  <Icon className="h-4 w-4 text-white" />
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex-1 truncate">{t(labelKey)}</span>
                <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-gray-400 transition-colors flex-shrink-0" />
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Recent expenses */}
      {data && data.recentExpenses.length > 0 && isFinanzSectionEnabled("ausgaben") && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">{t("finanzen.recentExpenses")}</h2>
            <Link href="/finanzen/ausgaben" className="text-xs font-medium text-red-500 hover:underline">
              {t("common.viewAll")}
            </Link>
          </div>
          <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 overflow-hidden divide-y divide-gray-50 dark:divide-gray-800/80">
            {data.recentExpenses.map((e) => (
              <div key={e._id} className="flex items-center gap-3 px-4 py-3.5">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  e.type === "unnecessary" ? "bg-orange-500" : e.type === "investment" ? "bg-blue-500" : "bg-red-500"
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{e.title}</p>
                  <p className="text-xs text-gray-400">{new Date(e.date).toLocaleDateString(lang)}</p>
                </div>
                <span className={`text-sm font-semibold flex-shrink-0 ${TYPE_COLORS[e.type] ?? "text-gray-600"}`}>
                  −{formatCurrency(e.amount, cur)}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
