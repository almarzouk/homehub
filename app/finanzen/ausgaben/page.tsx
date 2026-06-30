"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { useLanguage } from "@/contexts/LanguageContext";
import { Plus, Trash2, Pencil, Receipt, X } from "lucide-react";
import { formatCurrency, getCurrentMonth, toCents, fromCents } from "@/lib/utils";

interface Expense {
  _id: string;
  title: string;
  amount: number;
  category: string;
  type: "necessary" | "unnecessary" | "investment";
  date: string;
  note?: string;
  isWarning: boolean;
}

const CATEGORY_KEYS = ["lebensmittel", "transport", "wohnen", "gesundheit", "bildung", "unterhaltung", "kleidung", "sonstiges"] as const;
type CategoryKey = typeof CATEGORY_KEYS[number];
type ExpenseType = "necessary" | "unnecessary" | "investment";

const EMPTY_FORM = {
  title: "", amount: "", category: CATEGORY_KEYS[0] as CategoryKey,
  type: "necessary" as ExpenseType,
  date: new Date().toISOString().split("T")[0], note: "",
};

const TYPE_COLORS: Record<string, string> = {
  necessary: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400",
  unnecessary: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400",
  investment: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
};

export default function AusgabenPage() {
  const { t } = useTranslation();
  const { lang } = useLanguage();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(getCurrentMonth());
  const [typeFilter, setTypeFilter] = useState<ExpenseType | "all">("all");
  const [catFilter, setCatFilter] = useState<CategoryKey | "all">("all");
  const [modal, setModal] = useState<{ open: boolean; editing: Expense | null }>({ open: false, editing: null });
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ month });
    if (typeFilter !== "all") params.set("type", typeFilter);
    if (catFilter !== "all") params.set("category", catFilter);
    const res = await fetch(`/api/finanzen/ausgaben?${params}`);
    const data = await res.json();
    setExpenses(Array.isArray(data) ? data : []);
    setLoading(false);
  }, [month, typeFilter, catFilter]);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => {
    setForm(EMPTY_FORM);
    setModal({ open: true, editing: null });
  };

  const openEdit = (e: Expense) => {
    setForm({
      title: e.title,
      amount: fromCents(e.amount).toFixed(2),
      category: (CATEGORY_KEYS.includes(e.category as CategoryKey) ? e.category : CATEGORY_KEYS[0]) as CategoryKey,
      type: e.type,
      date: e.date.split("T")[0],
      note: e.note ?? "",
    });
    setModal({ open: true, editing: e });
  };

  const closeModal = () => setModal({ open: false, editing: null });

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setSaving(true);
    const payload = { ...form, amount: toCents(parseFloat(form.amount)) };
    if (modal.editing) {
      await fetch(`/api/finanzen/ausgaben/${modal.editing._id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } else {
      await fetch("/api/finanzen/ausgaben", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }
    setSaving(false);
    closeModal();
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t("finanzen.deleteExpenseConfirm"))) return;
    await fetch(`/api/finanzen/ausgaben/${id}`, { method: "DELETE" });
    load();
  };

  const total = expenses.reduce((s, e) => s + e.amount, 0);
  const byType = expenses.reduce<Record<string, number>>((acc, e) => {
    acc[e.type] = (acc[e.type] ?? 0) + e.amount;
    return acc;
  }, {});

  const locale = lang === "ar" ? "ar-SA" : lang === "es" ? "es-ES" : lang === "bg" ? "bg-BG" : lang === "en" ? "en-GB" : lang === "pt" ? "pt-BR" : "de-DE";

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t("finanzen.expenses")}</h1>
          <p className="text-sm text-gray-500">{expenses.length} {t("finanzen.entries")} · {formatCurrency(total, "EUR")}</p>
        </div>
        <div className="flex gap-2 items-center">
          <input type="month" value={month} onChange={(e) => setMonth(e.target.value)}
            className="text-sm border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          <button onClick={openAdd}
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors">
            <Plus className="h-4 w-4" />{t("finanzen.newExpense")}
          </button>
        </div>
      </div>

      {/* Type summary chips */}
      {expenses.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {(["necessary", "unnecessary", "investment"] as ExpenseType[]).map((tp) =>
            byType[tp] ? (
              <span key={tp} className={`text-xs px-3 py-1.5 rounded-full font-medium ${TYPE_COLORS[tp]}`}>
                {t(`finanzen.${tp}`)}: {formatCurrency(byType[tp], "EUR")}
              </span>
            ) : null
          )}
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {(["all", "necessary", "unnecessary", "investment"] as const).map((f) => (
          <button key={f} onClick={() => setTypeFilter(f)}
            className={`text-xs px-3 py-1.5 rounded-full transition-colors ${typeFilter === f ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-semibold" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"}`}>
            {f === "all" ? t("common.all") : t(`finanzen.${f}`)}
          </button>
        ))}
        <div className="w-px bg-gray-200 dark:bg-gray-700 mx-1" />
        <select value={catFilter} onChange={(e) => setCatFilter(e.target.value as CategoryKey | "all")}
          className="text-xs px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-none focus:outline-none focus:ring-2 focus:ring-emerald-500">
          <option value="all">{t("common.category")}: {t("common.all")}</option>
          {CATEGORY_KEYS.map((k) => (
            <option key={k} value={k}>{t(`finanzen.categories.${k}`)}</option>
          ))}
        </select>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : expenses.length === 0 ? (
        <div className="text-center py-20">
          <Receipt className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">{t("finanzen.noExpenses")} — {t("finanzen.inThisMonth")}.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 divide-y divide-gray-50 dark:divide-gray-800">
          {expenses.map((e) => (
            <div key={e._id} className="flex items-center gap-3 px-4 py-3 group">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 dark:text-white truncate">{e.title}</p>
                <p className="text-xs text-gray-400">
                  {t(`finanzen.categories.${e.category}` as Parameters<typeof t>[0]) || e.category}
                  {" · "}{t(`finanzen.${e.type}` as Parameters<typeof t>[0])}
                  {" · "}{new Date(e.date).toLocaleDateString(locale)}
                </p>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${TYPE_COLORS[e.type]}`}>
                {formatCurrency(e.amount, "EUR")}
              </span>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                <button onClick={() => openEdit(e)}
                  className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950 rounded-lg transition-colors">
                  <Pencil className="h-4 w-4" />
                </button>
                <button onClick={() => handleDelete(e._id)}
                  className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950 rounded-lg transition-colors">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modal.open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={closeModal}>
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-lg shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
              <h2 className="font-semibold text-gray-900 dark:text-white">
                {modal.editing ? t("finanzen.label") : t("finanzen.newExpense")}
              </h2>
              <button onClick={closeModal} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors">
                <X className="h-4 w-4 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">{t("finanzen.label")}</label>
                  <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">{t("common.amount")} (€)</label>
                  <input required type="number" step="0.01" min="0" value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">{t("common.date")}</label>
                  <input type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">{t("common.category")}</label>
                  <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as CategoryKey })}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                    {CATEGORY_KEYS.map((k) => (
                      <option key={k} value={k}>{t(`finanzen.categories.${k}`)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">{t("common.type")}</label>
                  <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as ExpenseType })}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                    <option value="necessary">{t("finanzen.necessary")}</option>
                    <option value="unnecessary">{t("finanzen.unnecessary")}</option>
                    <option value="investment">{t("finanzen.investment")}</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">{t("common.note")}</label>
                  <input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={closeModal}
                  className="flex-1 py-2.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors border border-gray-200 dark:border-gray-700">
                  {t("common.cancel")}
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm rounded-xl disabled:opacity-50 transition-colors font-medium">
                  {saving ? t("finanzen.saving") : t("common.save")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
