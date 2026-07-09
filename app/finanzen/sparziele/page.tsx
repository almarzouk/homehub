"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { PiggyBank, Plus } from "lucide-react";
import Modal from "@/components/ui/Modal";
import { toCents, fromCents } from "@/lib/utils";
import SavingsBoxCard, { type SavingsBox } from "@/components/finanzen/SavingsBoxCard";
import { SAVINGS_BOX_TEMPLATES } from "@/lib/finanzen-sections";

const EMPTY_FORM = {
  name: "",
  targetAmount: "",
  emoji: "🎯",
  color: "emerald",
  deadline: "",
  note: "",
};

export default function SparZielePage() {
  const { t } = useTranslation();
  const [boxes, setBoxes] = useState<SavingsBox[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{ open: boolean; editing: SavingsBox | null }>({ open: false, editing: null });
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/finanzen/sparziele");
    const data = await res.json();
    setBoxes(
      (Array.isArray(data) ? data : []).map((z: SavingsBox) => ({
        ...z,
        currentAmount: z.currentAmount ?? 0,
        deposits: z.deposits ?? [],
      }))
    );
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDeposit = async (id: string, amountCents: number, note?: string) => {
    const res = await fetch(`/api/finanzen/sparziele/${id}/einzahlung`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: amountCents, note }),
    });
    if (!res.ok) throw new Error("Deposit failed");
    await load();
  };

  const openAdd = () => {
    setForm(EMPTY_FORM);
    setError("");
    setModal({ open: true, editing: null });
  };

  const openEdit = (box: SavingsBox) => {
    setForm({
      name: box.name,
      targetAmount: fromCents(box.targetAmount).toFixed(2),
      emoji: box.emoji ?? "🎯",
      color: box.color ?? "emerald",
      deadline: box.deadline ? box.deadline.split("T")[0] : "",
      note: box.note ?? "",
    });
    setError("");
    setModal({ open: true, editing: box });
  };

  const applyTemplate = (tpl: (typeof SAVINGS_BOX_TEMPLATES)[number]) => {
    setForm({
      name: tpl.name,
      targetAmount: fromCents(tpl.targetAmount).toFixed(0),
      emoji: tpl.emoji,
      color: tpl.color,
      deadline: "",
      note: "",
    });
  };

  const closeModal = () => setModal({ open: false, editing: null });

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!form.name || !form.targetAmount) {
      setError(t("finanzen.requireNameAndAmount"));
      return;
    }
    setSaving(true);
    setError("");
    const payload = {
      name: form.name,
      targetAmount: toCents(parseFloat(form.targetAmount)),
      emoji: form.emoji,
      color: form.color,
      deadline: form.deadline || undefined,
      note: form.note || undefined,
    };
    const res = modal.editing
      ? await fetch(`/api/finanzen/sparziele/${modal.editing._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...payload,
            currentAmount: modal.editing.currentAmount,
          }),
        })
      : await fetch("/api/finanzen/sparziele", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...payload, currentAmount: 0 }),
        });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || t("common.error"));
      setSaving(false);
      return;
    }
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
    <div className="max-w-3xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t("finanzen.savingsBoxes")}</h1>
          <p className="text-sm text-gray-500">{t("finanzen.savingsBoxesDesc")}</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
        >
          <Plus className="h-4 w-4" />
          {t("finanzen.newSavingsBox")}
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : boxes.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
          <PiggyBank className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 mb-4">{t("finanzen.noSavingsGoals")}</p>
          <div className="flex flex-wrap justify-center gap-2 px-4">
            {SAVINGS_BOX_TEMPLATES.map((tpl) => (
              <button
                key={tpl.name}
                onClick={() => { applyTemplate(tpl); setModal({ open: true, editing: null }); }}
                className="text-sm px-3 py-1.5 rounded-full border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950 transition-colors"
              >
                {tpl.emoji} {tpl.name}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {boxes.map((box) => (
            <SavingsBoxCard
              key={box._id}
              box={box}
              onDeposit={handleDeposit}
              onEdit={openEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <Modal
        open={modal.open}
        onClose={closeModal}
        title={modal.editing ? t("finanzen.editSavingsBox") : t("finanzen.newSavingsBox")}
        footer={
          <div className="flex gap-2">
            <button
              type="button"
              onClick={closeModal}
              className="flex-1 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              {t("common.cancel")}
            </button>
            <button
              type="submit"
              form="sparziele-form"
              disabled={saving}
              className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-white rounded-xl text-sm font-medium transition-colors"
            >
              {saving ? t("finanzen.saving") : t("common.save")}
            </button>
          </div>
        }
      >
            {!modal.editing && (
              <div className="mb-4">
                <p className="text-xs text-gray-400 mb-2">{t("finanzen.quickTemplates")}</p>
                <div className="flex flex-wrap gap-1.5">
                  {SAVINGS_BOX_TEMPLATES.map((tpl) => (
                    <button
                      key={tpl.name}
                      type="button"
                      onClick={() => applyTemplate(tpl)}
                      className="text-xs px-2.5 py-1 bg-gray-100 dark:bg-gray-800 rounded-full hover:bg-emerald-50 dark:hover:bg-emerald-950 transition-colors"
                    >
                      {tpl.emoji} {tpl.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <form id="sparziele-form" onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <p className="text-sm text-red-600 bg-red-50 dark:bg-red-950 rounded-xl px-3 py-2">{error}</p>
              )}
              <div className="flex gap-3">
                <div className="w-16">
                  <label className="block text-sm font-medium mb-1.5">{t("finanzen.emoji")}</label>
                  <input
                    type="text"
                    value={form.emoji}
                    onChange={(e) => setForm((f) => ({ ...f, emoji: e.target.value }))}
                    className="w-full px-2 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-center text-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-1.5">{t("common.name")} *</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">{t("finanzen.targetAmount")} *</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={form.targetAmount}
                  onChange={(e) => setForm((f) => ({ ...f, targetAmount: e.target.value }))}
                  placeholder="5000.00"
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <p className="text-xs text-gray-400 mt-1">{t("finanzen.targetAmountHint")}</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">{t("finanzen.deadlineLabel")} ({t("common.optional")})</label>
                <input
                  type="date"
                  value={form.deadline}
                  onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">{t("common.note")} ({t("common.optional")})</label>
                <textarea
                  rows={2}
                  value={form.note}
                  onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </form>
      </Modal>
    </div>
  );
}
