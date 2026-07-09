"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatCurrency } from "@/lib/utils";
import AddMoneyModal from "./AddMoneyModal";

export interface SavingsBox {
  _id: string;
  name: string;
  emoji?: string;
  color?: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string;
  note?: string;
  deposits?: { amount: number; note?: string; date: string }[];
}

const COLOR_MAP: Record<string, string> = {
  sky: "from-sky-400 to-blue-500",
  violet: "from-violet-400 to-purple-500",
  emerald: "from-emerald-400 to-green-500",
  amber: "from-amber-400 to-orange-500",
  rose: "from-rose-400 to-pink-500",
  blue: "from-blue-400 to-indigo-500",
};

interface SavingsBoxCardProps {
  box: SavingsBox;
  onDeposit: (id: string, amountCents: number, note?: string) => Promise<void>;
  onEdit?: (box: SavingsBox) => void;
  onDelete?: (id: string) => void;
  compact?: boolean;
}

export default function SavingsBoxCard({
  box,
  onDeposit,
  onEdit,
  onDelete,
  compact = false,
}: SavingsBoxCardProps) {
  const { t } = useTranslation();
  const { lang } = useLanguage();
  const [showAdd, setShowAdd] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const pct = box.targetAmount > 0
    ? Math.min(100, Math.round((box.currentAmount / box.targetAmount) * 100))
    : 0;
  const isComplete = pct >= 100;
  const remaining = Math.max(0, box.targetAmount - box.currentAmount);
  const gradient = COLOR_MAP[box.color ?? ""] ?? "from-emerald-400 to-teal-500";

  const handleDeposit = async (amountCents: number, note?: string) => {
    await onDeposit(box._id, amountCents, note);
  };

  return (
    <>
      <div className={`bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden ${compact ? "" : "shadow-sm"}`}>
        {/* Header with gradient accent */}
        <div className={`h-1.5 bg-gradient-to-r ${gradient}`} />

        <div className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-2xl flex-shrink-0">{box.emoji ?? "🎯"}</span>
              <div className="min-w-0">
                <h3 className="font-semibold text-gray-900 dark:text-white truncate">{box.name}</h3>
                {box.deadline && (
                  <p className="text-xs text-gray-400">
                    {t("finanzen.deadline")}: {new Date(box.deadline).toLocaleDateString(lang)}
                  </p>
                )}
              </div>
            </div>
            {!compact && (onEdit || onDelete) && (
              <div className="flex gap-1 flex-shrink-0">
                {onEdit && (
                  <button
                    onClick={() => onEdit(box)}
                    className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950 rounded-lg transition-colors"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={() => onDelete(box._id)}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950 rounded-lg transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Amount display */}
          <div className="mb-3">
            <div className="flex items-baseline justify-between mb-1">
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(box.currentAmount, "EUR")}
              </span>
              <span className="text-sm text-gray-400">
                / {formatCurrency(box.targetAmount, "EUR")}
              </span>
            </div>
            <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 bg-gradient-to-r ${gradient}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="flex justify-between mt-1.5 text-xs">
              <span className={isComplete ? "text-emerald-600 font-semibold" : "text-gray-400"}>
                {isComplete ? `✓ ${t("haushalt.completed")}` : `${pct}%`}
              </span>
              {!isComplete && (
                <span className="text-gray-400">
                  {t("finanzen.stillNeeded")}: {formatCurrency(remaining, "EUR")}
                </span>
              )}
            </div>
          </div>

          {/* Quick add button */}
          <button
            onClick={() => setShowAdd(true)}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-medium transition-colors"
          >
            <Plus className="h-4 w-4" />
            {t("finanzen.addMoney")}
          </button>

          {/* Deposit history toggle */}
          {box.deposits && box.deposits.length > 0 && !compact && (
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="w-full flex items-center justify-center gap-1 mt-2 py-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              {showHistory ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              {box.deposits.length} {t("finanzen.deposits")}
            </button>
          )}

          {showHistory && box.deposits && (
            <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-800 space-y-1.5 max-h-32 overflow-y-auto">
              {[...box.deposits].reverse().slice(0, 10).map((d, i) => (
                <div key={i} className="flex justify-between text-xs">
                  <span className="text-gray-500 truncate">
                    {new Date(d.date).toLocaleDateString(lang)}
                    {d.note && ` · ${d.note}`}
                  </span>
                  <span className="text-emerald-600 font-medium flex-shrink-0 ms-2">
                    +{formatCurrency(d.amount, "EUR")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showAdd && (
        <AddMoneyModal
          boxName={box.name}
          emoji={box.emoji}
          onClose={() => setShowAdd(false)}
          onDeposit={handleDeposit}
        />
      )}
    </>
  );
}
