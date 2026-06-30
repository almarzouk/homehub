"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { useLanguage } from "@/contexts/LanguageContext";
import { CalendarClock, Plus, Trash2 } from "lucide-react";
import { getCurrentMonth, formatCurrency, toCents, fromCents } from "@/lib/utils";

interface PlanItem { name: string; betrag: number; kategorie: string; }

export default function MonatsplanPage() {
  const { t } = useTranslation();
  const { lang } = useLanguage();
  const [month, setMonth] = useState(getCurrentMonth());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  // Items store amounts in cents; display values are kept separately for editing
  const [items, setItems] = useState<PlanItem[]>([]);
  const [displayAmounts, setDisplayAmounts] = useState<string[]>([]);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/finanzen/monatsplan?month=${month}`)
      .then((r) => r.json())
      .then((d) => {
        const loaded: PlanItem[] = d?.items ?? [];
        setItems(loaded);
        setDisplayAmounts(loaded.map((i) => (i.betrag > 0 ? fromCents(i.betrag).toFixed(2) : "")));
        setLoading(false);
      });
  }, [month]);

  const addItem = () => {
    setItems((i) => [...i, { name: "", betrag: 0, kategorie: "" }]);
    setDisplayAmounts((a) => [...a, ""]);
  };

  const removeItem = (idx: number) => {
    setItems((arr) => arr.filter((_, i) => i !== idx));
    setDisplayAmounts((arr) => arr.filter((_, i) => i !== idx));
  };

  const updateField = (idx: number, field: "name" | "kategorie", val: string) => {
    setItems((arr) => arr.map((item, i) => i === idx ? { ...item, [field]: val } : item));
  };

  const updateAmount = (idx: number, val: string) => {
    setDisplayAmounts((arr) => arr.map((v, i) => i === idx ? val : v));
    const parsed = parseFloat(val.replace(",", "."));
    setItems((arr) => arr.map((item, i) =>
      i === idx ? { ...item, betrag: Number.isFinite(parsed) ? toCents(parsed) : 0 } : item
    ));
  };

  const save = async () => {
    setSaving(true);
    await fetch("/api/finanzen/monatsplan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ month, items }),
    });
    setSaving(false);
  };

  const total = items.reduce((s, i) => s + (i.betrag || 0), 0);
  const [y, mo] = month.split("-");
  const monthLabel = new Date(parseInt(y), parseInt(mo) - 1).toLocaleDateString(lang, { month: "long", year: "numeric" });

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950 flex items-center justify-center">
          <CalendarClock className="h-5 w-5 text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t("finanzen.monthlyPlan")}</h1>
          <p className="text-sm text-gray-500">{t("finanzen.budgetPlanning")}</p>
        </div>
      </div>

      {/* Month picker */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t("finanzen.month")}</label>
        <input type="month" value={month} onChange={(e) => setMonth(e.target.value)}
          className="px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-5">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-900 dark:text-white">{monthLabel}</h2>
              <button onClick={addItem} className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium">
                <Plus className="h-4 w-4" />{t("finanzen.addEntry")}
              </button>
            </div>

            {items.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">{t("finanzen.noEntries")}</p>
            ) : (
              <div className="space-y-2">
                {items.map((item, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <input type="text" value={item.name}
                      onChange={(e) => updateField(idx, "name", e.target.value)}
                      placeholder={t("common.description")}
                      className="flex-1 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    <input type="text" value={item.kategorie}
                      onChange={(e) => updateField(idx, "kategorie", e.target.value)}
                      placeholder={t("common.category")}
                      className="w-24 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    <input type="number" min="0" step="0.01"
                      value={displayAmounts[idx] ?? ""}
                      onChange={(e) => updateAmount(idx, e.target.value)}
                      placeholder="0.00"
                      className="w-24 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    <button onClick={() => removeItem(idx)} className="p-2 text-red-400 hover:text-red-600 transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {total > 0 && (
              <div className="border-t border-gray-100 dark:border-gray-800 pt-3 flex justify-between">
                <span className="font-semibold text-gray-900 dark:text-white">{t("finanzen.plannedTotal")}</span>
                <span className="font-bold text-blue-600">{formatCurrency(total, "EUR")}</span>
              </div>
            )}
          </div>

          <button onClick={save} disabled={saving}
            className="w-full py-2.5 bg-blue-500 hover:bg-blue-600 disabled:opacity-60 text-white rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2">
            {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <CalendarClock className="h-4 w-4" />}
            {saving ? t("finanzen.saving") : t("finanzen.savePlan")}
          </button>
        </div>
      )}
    </div>
  );
}
