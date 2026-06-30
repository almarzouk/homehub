"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { useLanguage } from "@/contexts/LanguageContext";
import { PiggyBank, Plus, Trash2, Pencil, X, Target } from "lucide-react";
import { formatCurrency, toCents, fromCents } from "@/lib/utils";

interface SparZiel {
  _id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  currentBalance?: number;
  deadline?: string;
  note?: string;
}

const EMPTY_FORM = { name: "", targetAmount: "", currentAmount: "0", deadline: "", note: "" };

export default function SparZielePage() {
  const { t } = useTranslation();
  const { lang } = useLanguage();
  const [ziele, setZiele] = useState<SparZiel[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{ open: boolean; editing: SparZiel | null }>({ open: false, editing: null });
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/finanzen/sparziele");
    const data = await res.json();
    setZiele(
      (Array.isArray(data) ? data : []).map((z: SparZiel) => ({
        ...z,
        currentAmount: z.currentAmount ?? z.currentBalance ?? 0,
      }))
    );
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => {
    setForm(EMPTY_FORM);
    setError("");
    setModal({ open: true, editing: null });
  };

  const openEdit = (z: SparZiel) => {
    setForm({
      name: z.name,
      targetAmount: fromCents(z.targetAmount).toFixed(2),
      currentAmount: fromCents(z.currentAmount).toFixed(2),
      deadline: z.deadline ? z.deadline.split("T")[0] : "",
      note: z.note ?? "",
    });
    setError("");
    setModal({ open: true, editing: z });
  };

  const closeModal = () => setModal({ open: false, editing: null });

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!form.name || !form.targetAmount) { setError(t("finanzen.requireNameAndAmount")); return; }
    setSaving(true);
    setError("");
    const payload = {
      name: form.name,
      targetAmount: toCents(parseFloat(form.targetAmount)),
      currentAmount: toCents(parseFloat(form.currentAmount || "0")),
      deadline: form.deadline || undefined,
      note: form.note || undefined,
    };
    const res = modal.editing
      ? await fetch(`/api/finanzen/sparziele/${modal.editing._id}`, {
          method: "PUT", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      : await fetch("/api/finanzen/sparziele", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
    const data = await res.json();
    if (!res.ok) { setError(data.error || t("common.error")); setSaving(false); return; }
    setSaving(false);
    closeModal();
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t("finanzen.deleteSavingsGoalConfirm"))) return;
    await fetch(`/api/finanzen/sparziele/${id}`, { method: "DELETE" });
    load();
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t("finanzen.savingsGoals")}</h1>
          <p className="text-sm text-gray-500">{ziele.length} {t("finanzen.savingsGoalDesc")}</p>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors">
          <Plus className="h-4 w-4" />{t("finanzen.newSavingsGoal")}
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : ziele.length === 0 ? (
        <div className="text-center py-20">
          <PiggyBank className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">{t("finanzen.noSavingsGoals")}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {ziele.map((z) => {
            const pct = z.targetAmount > 0 ? Math.min(100, Math.round((z.currentAmount / z.targetAmount) * 100)) : 0;
            const isComplete = pct >= 100;
            return (
              <div key={z._id} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isComplete ? "bg-emerald-100 dark:bg-emerald-950" : "bg-gray-100 dark:bg-gray-800"}`}>
                      <Target className={`h-4 w-4 ${isComplete ? "text-emerald-600" : "text-gray-400"}`} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">{z.name}</h3>
                      {z.deadline && (
                        <p className="text-xs text-gray-400">{t("finanzen.deadline")}: {new Date(z.deadline).toLocaleDateString(lang)}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(z)}
                      className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950 rounded-lg transition-colors">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleDelete(z._id)}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950 rounded-lg transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="mb-1">
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-gray-500">{formatCurrency(z.currentAmount, "EUR")} {t("finanzen.savedAmount")}</span>
                    <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(z.targetAmount, "EUR")}</span>
                  </div>
                  <div className="h-2.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${isComplete ? "bg-emerald-500" : "bg-blue-500"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-xs text-gray-400">{pct}% {t("common.of")} {t("finanzen.goalAmount")}</span>
                    {isComplete && <span className="text-xs text-emerald-600 font-semibold">✓ {t("haushalt.completed")}</span>}
                  </div>
                </div>

                {z.note && <p className="text-xs text-gray-500 mt-2 pt-2 border-t border-gray-100 dark:border-gray-800">{z.note}</p>}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {modal.open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={closeModal}>
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
              <h2 className="font-semibold text-gray-900 dark:text-white">
                {modal.editing ? t("finanzen.savingsGoals") : t("finanzen.newSavingsGoalTitle")}
              </h2>
              <button onClick={closeModal} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors">
                <X className="h-4 w-4 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {error && <p className="text-sm text-red-600 bg-red-50 dark:bg-red-950 rounded-xl px-3 py-2">{error}</p>}
              <div>
                <label className="block text-sm font-medium mb-1.5">{t("common.name")} *</label>
                <input type="text" required value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1.5">{t("finanzen.targetAmount")} *</label>
                  <input type="number" min="0" step="0.01" required value={form.targetAmount}
                    onChange={(e) => setForm((f) => ({ ...f, targetAmount: e.target.value }))} placeholder="5000.00"
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">{t("finanzen.alreadySaved")}</label>
                  <input type="number" min="0" step="0.01" value={form.currentAmount}
                    onChange={(e) => setForm((f) => ({ ...f, currentAmount: e.target.value }))} placeholder="0.00"
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">{t("finanzen.deadlineLabel")} ({t("common.optional")})</label>
                <input type="date" value={form.deadline}
                  onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">{t("common.note")} ({t("common.optional")})</label>
                <textarea rows={2} value={form.note}
                  onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={closeModal}
                  className="flex-1 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  {t("common.cancel")}
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-white rounded-xl text-sm font-medium transition-colors">
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
