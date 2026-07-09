"use client";

import { useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { toCents } from "@/lib/utils";
import { QUICK_DEPOSIT_AMOUNTS } from "@/lib/finanzen-sections";
import Modal from "@/components/ui/Modal";
import { Plus } from "lucide-react";

interface AddMoneyModalProps {
  boxName: string;
  emoji?: string;
  onClose: () => void;
  onDeposit: (amountCents: number, note?: string) => Promise<void>;
}

export default function AddMoneyModal({ boxName, emoji, onClose, onDeposit }: AddMoneyModalProps) {
  const { t } = useTranslation();
  const [customAmount, setCustomAmount] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleDeposit = async (euros: number) => {
    if (euros <= 0) return;
    setSaving(true);
    setError("");
    try {
      await onDeposit(toCents(euros), note || undefined);
      onClose();
    } catch {
      setError(t("common.error"));
    } finally {
      setSaving(false);
    }
  };

  const handleCustom = async () => {
    const val = parseFloat(customAmount);
    if (!val || val <= 0) {
      setError(t("finanzen.invalidAmount"));
      return;
    }
    await handleDeposit(val);
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={
        <span className="flex items-center gap-3">
          {emoji && (
            <span className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center text-xl flex-shrink-0">
              {emoji}
            </span>
          )}
          <span className="min-w-0">
            <span className="block text-base">{t("finanzen.addMoney")}</span>
            <span className="block text-xs font-normal text-gray-500 truncate">{boxName}</span>
          </span>
        </span>
      }
      size="sm"
    >
      <div className="space-y-5 pb-2">
        {error && (
          <p className="text-sm text-red-600 bg-red-50 dark:bg-red-950 rounded-xl px-3 py-2">{error}</p>
        )}

        <div>
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2.5">
            {t("finanzen.quickAmounts") || "Schnellbetrag"}
          </p>
          <div className="grid grid-cols-3 gap-2">
            {QUICK_DEPOSIT_AMOUNTS.map((amount) => (
              <button
                key={amount}
                type="button"
                disabled={saving}
                onClick={() => handleDeposit(amount)}
                className="py-3.5 rounded-xl border-2 border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 font-bold text-sm hover:bg-emerald-100 dark:hover:bg-emerald-900 active:scale-95 transition-all disabled:opacity-50"
              >
                +€{amount}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
            {t("finanzen.customAmount")}
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">€</span>
              <input
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                placeholder="0.00"
                className="w-full pl-8 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-base focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <button
              type="button"
              disabled={saving || !customAmount}
              onClick={handleCustom}
              className="px-5 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-xl font-medium transition-colors flex items-center gap-1"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
            {t("common.note")} ({t("common.optional")})
          </label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={t("finanzen.depositNotePlaceholder")}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-base focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>
    </Modal>
  );
}
