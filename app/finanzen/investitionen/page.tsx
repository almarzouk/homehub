"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { useLanguage } from "@/contexts/LanguageContext";
import { Plus, TrendingUp, TrendingDown, Trash2, Pencil, X } from "lucide-react";
import { formatCurrency, toCents, fromCents } from "@/lib/utils";

interface Investment {
  _id: string;
  title: string;
  amount: number;
  currentValue: number;
  type: string;
  startDate: string;
  note?: string;
  ticker?: string;
}

const EMPTY_FORM = {
  title: "", amount: "", currentValue: "", type: "stocks",
  startDate: new Date().toISOString().split("T")[0], note: "", ticker: "",
};

const TYPE_KEYS = ["stocks", "etf", "crypto", "real-estate", "savings", "other"] as const;

export default function InvestitionenPage() {
  const { t } = useTranslation();
  const { lang } = useLanguage();
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{ open: boolean; editing: Investment | null }>({ open: false, editing: null });
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/finanzen/investitionen");
    const data = await res.json();
    setInvestments(Array.isArray(data) ? data : []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => {
    setForm(EMPTY_FORM);
    setModal({ open: true, editing: null });
  };

  const openEdit = (inv: Investment) => {
    setForm({
      title: inv.title,
      amount: fromCents(inv.amount).toFixed(2),
      currentValue: fromCents(inv.currentValue).toFixed(2),
      type: inv.type,
      startDate: inv.startDate.split("T")[0],
      note: inv.note ?? "",
      ticker: inv.ticker ?? "",
    });
    setModal({ open: true, editing: inv });
  };

  const closeModal = () => setModal({ open: false, editing: null });

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setSaving(true);
    const payload = {
      ...form,
      amount: toCents(parseFloat(form.amount)),
      currentValue: form.currentValue ? toCents(parseFloat(form.currentValue)) : undefined,
      ticker: form.ticker || undefined,
      note: form.note || undefined,
    };
    if (modal.editing) {
      await fetch(`/api/finanzen/investitionen/${modal.editing._id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } else {
      await fetch("/api/finanzen/investitionen", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }
    setSaving(false);
    closeModal();
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t("common.deleteConfirm"))) return;
    await fetch(`/api/finanzen/investitionen/${id}`, { method: "DELETE" });
    load();
  };

  const totalInvested = investments.reduce((s, i) => s + i.amount, 0);
  const totalCurrent = investments.reduce((s, i) => s + i.currentValue, 0);
  const profit = totalCurrent - totalInvested;

  const typeLabel = (type: string) => {
    const key = type === "real-estate" ? "realEstate" : type;
    return t(`finanzen.investmentTypes.${key}` as Parameters<typeof t>[0]) || type;
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t("finanzen.investments")}</h1>
          <p className="text-sm text-gray-500">{investments.length} {t("finanzen.positions")}</p>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors">
          <Plus className="h-4 w-4" />{t("finanzen.newInvestment")}
        </button>
      </div>

      {/* Summary cards */}
      {investments.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-blue-50 dark:bg-blue-950 rounded-2xl p-4">
            <p className="text-xs text-gray-500 mb-1">{t("finanzen.invested")}</p>
            <p className="font-bold text-blue-700 dark:text-blue-400">{formatCurrency(totalInvested, "EUR")}</p>
          </div>
          <div className="bg-emerald-50 dark:bg-emerald-950 rounded-2xl p-4">
            <p className="text-xs text-gray-500 mb-1">{t("finanzen.currentValue")}</p>
            <p className="font-bold text-emerald-700 dark:text-emerald-400">{formatCurrency(totalCurrent, "EUR")}</p>
          </div>
          <div className={`rounded-2xl p-4 ${profit >= 0 ? "bg-emerald-50 dark:bg-emerald-950" : "bg-red-50 dark:bg-red-950"}`}>
            <p className="text-xs text-gray-500 mb-1">{t("finanzen.profitLoss")}</p>
            <p className={`font-bold flex items-center gap-1 ${profit >= 0 ? "text-emerald-700 dark:text-emerald-400" : "text-red-700 dark:text-red-400"}`}>
              {profit >= 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
              {formatCurrency(profit, "EUR")}
            </p>
          </div>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : investments.length === 0 ? (
        <div className="text-center py-20">
          <TrendingUp className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">{t("finanzen.noInvestments")}</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 divide-y divide-gray-50 dark:divide-gray-800">
          {investments.map((inv) => {
            const gain = inv.currentValue - inv.amount;
            const pct = inv.amount > 0 ? ((gain / inv.amount) * 100).toFixed(1) : "0";
            return (
              <div key={inv._id} className="flex items-center gap-3 px-4 py-4 group">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 dark:text-white">{inv.title}</p>
                  <p className="text-xs text-gray-400">
                    {typeLabel(inv.type)}
                    {inv.ticker ? ` · ${inv.ticker}` : ""}
                    {" · "}{new Date(inv.startDate).toLocaleDateString(lang)}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">{formatCurrency(inv.currentValue, "EUR")}</p>
                  <p className={`text-xs font-medium flex items-center justify-end gap-0.5 ${gain >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                    {gain >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {gain >= 0 ? "+" : ""}{pct}%
                  </p>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                  <button onClick={() => openEdit(inv)}
                    className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950 rounded-lg transition-colors">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button onClick={() => handleDelete(inv._id)}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950 rounded-lg transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {modal.open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={closeModal}>
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-lg shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
              <h2 className="font-semibold text-gray-900 dark:text-white">
                {modal.editing ? t("finanzen.investments") : t("finanzen.newInvestment")}
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
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">{t("finanzen.ticker")}</label>
                  <input value={form.ticker} onChange={(e) => setForm({ ...form, ticker: e.target.value })} placeholder="z.B. ASML.AS"
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">{t("common.type")}</label>
                  <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {TYPE_KEYS.map((k) => (
                      <option key={k} value={k}>{typeLabel(k)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">{t("finanzen.investedAmount")} (€)</label>
                  <input required type="number" step="0.01" min="0" value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">{t("finanzen.currentValue")} (€)</label>
                  <input type="number" step="0.01" min="0" value={form.currentValue}
                    onChange={(e) => setForm({ ...form, currentValue: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">{t("finanzen.startDate")}</label>
                  <input type="date" required value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">{t("common.note")} ({t("common.optional")})</label>
                  <input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={closeModal}
                  className="flex-1 py-2.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors border border-gray-200 dark:border-gray-700">
                  {t("common.cancel")}
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 py-2.5 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-xl disabled:opacity-50 transition-colors font-medium">
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
