"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { useLanguage } from "@/contexts/LanguageContext";
import { FileBarChart, TrendingUp, TrendingDown, DollarSign } from "lucide-react";

interface Expense { _id: string; amount: number; category: string; type: string; date: string; description?: string; }

function getMonthKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function fmt(cents: number) {
  return (cents / 100).toLocaleString("de-DE", { style: "currency", currency: "EUR" });
}

export default function BerichtePage() {
  const { t } = useTranslation();
  const { lang } = useLanguage();
  const [month, setMonth] = useState(getMonthKey());
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

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950 flex items-center justify-center">
          <FileBarChart className="h-5 w-5 text-purple-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t("finanzen.reports")}</h1>
          <p className="text-sm text-gray-500">{t("finanzen.expenseAnalysis")}</p>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t("finanzen.month")}</label>
        <input type="month" value={month} onChange={(e) => setMonth(e.target.value)}
          className="px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
              <div className="flex items-center gap-2 mb-2 text-gray-500"><DollarSign className="h-4 w-4" /><span className="text-xs">{monthLabel}</span></div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{fmt(total)}</p>
              <p className="text-xs text-gray-400">{expenses.length} {t("finanzen.entries")}</p>
            </div>
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
              <div className="flex items-center gap-2 mb-2 text-gray-500"><TrendingDown className="h-4 w-4" /><span className="text-xs">{t("finanzen.expenseTypes")}</span></div>
              {Object.entries(byType).map(([t, a]) => (
                <div key={t} className="flex justify-between text-sm">
                  <span className="text-gray-500 capitalize">{t}</span>
                  <span className="font-medium">{fmt(a)}</span>
                </div>
              ))}
            </div>
          </div>

          {sortedCats.length > 0 && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-800 font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-purple-500" />
                {t("finanzen.byCategory")}
              </div>
              <div className="divide-y divide-gray-50 dark:divide-gray-800">
                {sortedCats.map(([cat, amount]) => {
                  const pct = total > 0 ? Math.round((amount / total) * 100) : 0;
                  return (
                    <div key={cat} className="px-5 py-3">
                      <div className="flex justify-between text-sm mb-1.5">
                        <span className="font-medium text-gray-900 dark:text-white capitalize">{cat}</span>
                        <span className="text-gray-600 dark:text-gray-400">{fmt(amount)} ({pct}%)</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                        <div className="h-full bg-purple-500 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {expenses.length === 0 && (
            <div className="text-center py-12 text-gray-500">{t("finanzen.noExpenses")} {monthLabel}.</div>
          )}
        </div>
      )}
    </div>
  );
}
