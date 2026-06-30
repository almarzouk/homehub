"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { useLanguage } from "@/contexts/LanguageContext";
import { FileBarChart, TrendingDown, DollarSign } from "lucide-react";
import { getCurrentMonth, formatCurrency } from "@/lib/utils";

interface Expense { _id: string; amount: number; category: string; type: string; date: string; }

export default function BerichtePage() {
  const { t } = useTranslation();
  const { lang } = useLanguage();
  const [month, setMonth] = useState(getCurrentMonth());
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/finanzen/ausgaben?month=${month}&limit=500`)
      .then((r) => r.json())
      .then((d) => { setExpenses(Array.isArray(d) ? d : d.expenses ?? []); setLoading(false); });
  }, [month]);

  const total = expenses.reduce((s, e) => s + e.amount, 0);

  const byCategory: Record<string, number> = {};
  expenses.forEach((e) => { byCategory[e.category] = (byCategory[e.category] ?? 0) + e.amount; });
  const sortedCats = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);

  const byType: Record<string, number> = {};
  expenses.forEach((e) => { byType[e.type] = (byType[e.type] ?? 0) + e.amount; });

  const [y, mo] = month.split("-");
  const monthLabel = new Date(parseInt(y), parseInt(mo) - 1).toLocaleDateString(lang, { month: "long", year: "numeric" });

  const catLabel = (cat: string) => {
    const key = `finanzen.categories.${cat}` as Parameters<typeof t>[0];
    return t(key) || cat;
  };

  const typeLabel = (type: string) => {
    if (type === "necessary") return t("finanzen.necessary");
    if (type === "unnecessary") return t("finanzen.unnecessary");
    if (type === "investment") return t("finanzen.investment");
    return type;
  };

  const CAT_COLORS = [
    "bg-blue-500", "bg-emerald-500", "bg-orange-500", "bg-purple-500",
    "bg-pink-500", "bg-yellow-500", "bg-teal-500", "bg-red-500",
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950 flex items-center justify-center">
          <FileBarChart className="h-5 w-5 text-purple-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t("finanzen.reports")}</h1>
          <p className="text-sm text-gray-500">{t("finanzen.expenseAnalysis")}</p>
        </div>
      </div>

      {/* Month picker */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t("finanzen.month")}</label>
        <input type="month" value={month} onChange={(e) => setMonth(e.target.value)}
          className="px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : expenses.length === 0 ? (
        <div className="text-center py-12 text-gray-500">{t("finanzen.noExpenses")} {monthLabel}.</div>
      ) : (
        <div className="space-y-5">
          {/* Summary row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
              <div className="flex items-center gap-2 mb-2 text-gray-500">
                <DollarSign className="h-4 w-4" />
                <span className="text-xs">{monthLabel}</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(total, "EUR")}</p>
              <p className="text-xs text-gray-400 mt-0.5">{expenses.length} {t("finanzen.entries")}</p>
            </div>
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
              <div className="flex items-center gap-2 mb-2 text-gray-500">
                <TrendingDown className="h-4 w-4" />
                <span className="text-xs">{t("finanzen.expenseTypes")}</span>
              </div>
              <div className="space-y-1">
                {Object.entries(byType).map(([type, amount]) => (
                  <div key={type} className="flex justify-between text-sm">
                    <span className="text-gray-500">{typeLabel(type)}</span>
                    <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(amount, "EUR")}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* By category */}
          {sortedCats.length > 0 && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
              <div className="px-5 py-3.5 border-b border-gray-100 dark:border-gray-800 font-semibold text-gray-900 dark:text-white text-sm">
                {t("finanzen.byCategory")}
              </div>
              <div className="divide-y divide-gray-50 dark:divide-gray-800">
                {sortedCats.map(([cat, amount], idx) => {
                  const pct = total > 0 ? Math.round((amount / total) * 100) : 0;
                  const barColor = CAT_COLORS[idx % CAT_COLORS.length];
                  return (
                    <div key={cat} className="px-5 py-3.5">
                      <div className="flex justify-between text-sm mb-1.5">
                        <span className="font-medium text-gray-900 dark:text-white">{catLabel(cat)}</span>
                        <span className="text-gray-500">{formatCurrency(amount, "EUR")} <span className="text-gray-400">({pct}%)</span></span>
                      </div>
                      <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
