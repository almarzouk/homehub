"use client";

import { useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { Wallet, Check, ChevronLeft, X } from "lucide-react";
import { formatCurrency, getCurrentMonth, toCents } from "@/lib/utils";
import Modal from "@/components/ui/Modal";

const PRESETS = [
  { name: "Miete", kategorie: "wohnen" },
  { name: "Strom & Gas", kategorie: "wohnen" },
  { name: "Internet", kategorie: "kommunikation" },
  { name: "Handy", kategorie: "kommunikation" },
  { name: "Netflix", kategorie: "streaming" },
  { name: "Spotify", kategorie: "streaming" },
  { name: "Krankenversicherung", kategorie: "versicherung" },
  { name: "KFZ-Versicherung", kategorie: "versicherung" },
  { name: "GEZ/Rundfunk", kategorie: "sonstiges" },
  { name: "Miete Parkplatz", kategorie: "wohnen" },
];

interface WizardFixkostenEntry {
  name: string;
  betrag: string;
  kategorie: string;
}

interface FinanzSetupWizardProps {
  open: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export default function FinanzSetupWizard({ open, onClose, onComplete }: FinanzSetupWizardProps) {
  const { t } = useTranslation();
  const [setupStep, setSetupStep] = useState(0);
  const [setupSalary, setSetupSalary] = useState("");
  const [setupItems, setSetupItems] = useState<WizardFixkostenEntry[]>([
    { name: "", betrag: "", kategorie: "sonstiges" },
  ]);
  const [setupSaving, setSetupSaving] = useState(false);

  const addSetupRow = () => setSetupItems((p) => [...p, { name: "", betrag: "", kategorie: "sonstiges" }]);
  const removeSetupRow = (i: number) => setSetupItems((p) => p.filter((_, idx) => idx !== i));
  const updateSetupRow = (i: number, field: keyof WizardFixkostenEntry, val: string) =>
    setSetupItems((p) => p.map((row, idx) => (idx === i ? { ...row, [field]: val } : row)));
  const applyPreset = (p: { name: string; kategorie: string }) => {
    const emptyIdx = setupItems.findIndex((i) => !i.name);
    if (emptyIdx >= 0) {
      updateSetupRow(emptyIdx, "name", p.name);
      updateSetupRow(emptyIdx, "kategorie", p.kategorie);
    } else {
      setSetupItems((prev) => [...prev, { name: p.name, betrag: "", kategorie: p.kategorie }]);
    }
  };

  const handleSetupFinish = async () => {
    setSetupSaving(true);
    if (setupSalary && parseFloat(setupSalary) > 0) {
      await fetch("/api/finanzen/gehalt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          betrag: toCents(parseFloat(setupSalary)),
          monat: getCurrentMonth(),
          waehrung: "EUR",
        }),
      });
    }
    const validItems = setupItems
      .filter((i) => i.name && parseFloat(i.betrag) > 0)
      .map((i) => ({
        name: i.name,
        betrag: toCents(parseFloat(i.betrag)),
        kategorie: i.kategorie,
        aktiv: true,
      }));
    if (validItems.length > 0) {
      await fetch("/api/finanzen/fixkosten", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validItems),
      });
    }
    setSetupSaving(false);
    onComplete();
  };

  const handleSkip = async () => {
    await fetch("/api/finanzen/status", { method: "POST" });
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={handleSkip}
      title={t("finanzen.setupTitle")}
      size="lg"
    >
      <div className="flex gap-1 mb-4 -mt-1">
        {[0, 1, 2, 3].map((s) => (
          <div
            key={s}
            className={`h-1 flex-1 rounded-full transition-all ${s <= setupStep ? "bg-emerald-500" : "bg-gray-100 dark:bg-gray-800"}`}
          />
        ))}
      </div>

      {setupStep === 0 && (
        <div className="text-center">
          <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-950 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Wallet className="h-8 w-8 text-emerald-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{t("finanzen.setupTitle")}</h2>
          <p className="text-gray-500 text-sm mb-6">{t("finanzen.setupWelcome")}</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleSkip}
              className="flex-1 py-2.5 text-sm text-gray-500 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              {t("finanzen.setupSkip")}
            </button>
            <button
              type="button"
              onClick={() => setSetupStep(1)}
              className="flex-1 py-2.5 text-sm bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-medium transition-colors"
            >
              {t("common.continue") || "Weiter"}
            </button>
          </div>
        </div>
      )}

      {setupStep === 1 && (
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{t("finanzen.setupSalaryStep")}</h2>
          <p className="text-sm text-gray-500 mb-4">{t("finanzen.setupSalaryHint")}</p>
          <div className="relative mb-6">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">€</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={setupSalary}
              onChange={(e) => setSetupSalary(e.target.value)}
              placeholder="0.00"
              className="w-full pl-8 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-lg font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setSetupStep(0)}
              className="p-2.5 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <ChevronLeft className="h-4 w-4 text-gray-500" />
            </button>
            <button
              type="button"
              onClick={() => setSetupStep(2)}
              className="flex-1 py-2.5 text-sm bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-medium transition-colors"
            >
              {t("common.continue") || "Weiter"}
            </button>
          </div>
        </div>
      )}

      {setupStep === 2 && (
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{t("finanzen.setupFixedStep")}</h2>
          <p className="text-sm text-gray-500 mb-3">{t("finanzen.setupFixedHint")}</p>
          <div className="flex flex-wrap gap-1.5 mb-4">
            {PRESETS.map((p) => (
              <button
                key={p.name}
                type="button"
                onClick={() => applyPreset(p)}
                className="text-xs px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 rounded-full hover:bg-emerald-100 transition-colors"
              >
                + {p.name}
              </button>
            ))}
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto mb-3">
            {setupItems.map((item, idx) => (
              <div key={idx} className="flex gap-2 items-center">
                <input
                  value={item.name}
                  onChange={(e) => updateSetupRow(idx, "name", e.target.value)}
                  placeholder={t("common.name")}
                  className="flex-1 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <div className="relative">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">€</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.betrag}
                    onChange={(e) => updateSetupRow(idx, "betrag", e.target.value)}
                    placeholder="0"
                    className="w-24 pl-5 pr-2 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                {setupItems.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeSetupRow(idx)}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950 rounded-lg transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addSetupRow}
            className="w-full py-2 text-sm text-emerald-600 border border-dashed border-emerald-200 dark:border-emerald-800 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-950 transition-colors mb-4"
          >
            + Weitere hinzufügen
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setSetupStep(1)}
              className="p-2.5 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <ChevronLeft className="h-4 w-4 text-gray-500" />
            </button>
            <button
              type="button"
              onClick={() => setSetupStep(3)}
              className="flex-1 py-2.5 text-sm bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-medium transition-colors"
            >
              {t("common.continue") || "Weiter"}
            </button>
          </div>
        </div>
      )}

      {setupStep === 3 && (
        <div className="text-center">
          <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-950 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Check className="h-8 w-8 text-emerald-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{t("finanzen.setupDoneTitle")}</h2>
          {setupSalary && (
            <div className="bg-emerald-50 dark:bg-emerald-950 rounded-xl p-3 mb-2 text-sm text-emerald-700 dark:text-emerald-400">
              {t("finanzen.salary")}: <strong>{formatCurrency(toCents(parseFloat(setupSalary)), "EUR")}</strong>
            </div>
          )}
          {setupItems.filter((i) => i.name && parseFloat(i.betrag) > 0).length > 0 && (
            <div className="bg-indigo-50 dark:bg-indigo-950 rounded-xl p-3 mb-4 text-sm text-indigo-700 dark:text-indigo-400">
              {setupItems.filter((i) => i.name && parseFloat(i.betrag) > 0).length} {t("finanzen.fixkosten")}:{" "}
              <strong>
                {formatCurrency(
                  setupItems
                    .filter((i) => i.name && parseFloat(i.betrag) > 0)
                    .reduce((s, i) => s + toCents(parseFloat(i.betrag)), 0),
                  "EUR"
                )}
              </strong>
            </div>
          )}
          <p className="text-gray-500 text-sm mb-6">{t("finanzen.setupDoneMsg")}</p>
          <button
            type="button"
            onClick={handleSetupFinish}
            disabled={setupSaving}
            className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-medium disabled:opacity-50 transition-colors"
          >
            {setupSaving ? t("finanzen.saving") : t("finanzen.setupFinish")}
          </button>
        </div>
      )}
    </Modal>
  );
}
