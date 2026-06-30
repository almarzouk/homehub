"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { useLanguage } from "@/contexts/LanguageContext";
import Link from "next/link";
import {
  Wallet, TrendingUp, TrendingDown, AlertTriangle, Receipt, PiggyBank,
  CalendarClock, FileBarChart, ChevronRight, Lock, X, Check, ChevronLeft,
  Settings,
} from "lucide-react";
import { formatCurrency, getCurrentMonth, toCents, fromCents } from "@/lib/utils";

interface FinanzDashboard {
  totalSalary: number;
  totalExpenses: number;
  totalInvested: number;
  remainingBalance: number;
  currency: string;
  recentExpenses: { _id: string; title: string; amount: number; category: string; date: string; type: string }[];
  unreadAlerts: { _id: string; title: string; message: string; type: string }[];
}

const TYPE_COLORS: Record<string, string> = {
  necessary: "text-emerald-600",
  unnecessary: "text-orange-600",
  investment: "text-blue-600",
};

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

export default function FinanzenDashboardPage() {
  const { t } = useTranslation();
  const { lang } = useLanguage();
  const [data, setData] = useState<FinanzDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [fixkostenTotal, setFixkostenTotal] = useState(0);

  // Setup wizard
  const [showSetup, setShowSetup] = useState(false);
  const [setupStep, setSetupStep] = useState(0); // 0=welcome, 1=salary, 2=fixkosten, 3=done
  const [setupSalary, setSetupSalary] = useState("");
  const [setupItems, setSetupItems] = useState<WizardFixkostenEntry[]>([
    { name: "", betrag: "", kategorie: "sonstiges" },
  ]);
  const [setupSaving, setSetupSaving] = useState(false);

  useEffect(() => {
    const done = localStorage.getItem("finanzen_setup_done");
    if (!done) setShowSetup(true);
  }, []);

  useEffect(() => {
    fetch(`/api/dashboard?month=${getCurrentMonth()}`)
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  const loadFixkosten = useCallback(async () => {
    const res = await fetch("/api/finanzen/fixkosten");
    const items = await res.json();
    if (Array.isArray(items)) {
      const total = items.filter((i: { aktiv: boolean; betrag: number }) => i.aktiv)
        .reduce((s: number, i: { betrag: number }) => s + i.betrag, 0);
      setFixkostenTotal(total);
    }
  }, []);

  useEffect(() => { loadFixkosten(); }, [loadFixkosten]);

  const dismissSetup = () => {
    localStorage.setItem("finanzen_setup_done", "1");
    setShowSetup(false);
  };

  const handleSetupFinish = async () => {
    setSetupSaving(true);
    // Save salary if provided
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
    // Save fixkosten (bulk)
    const validItems = setupItems.filter((i) => i.name && parseFloat(i.betrag) > 0).map((i) => ({
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
    localStorage.setItem("finanzen_setup_done", "1");
    setShowSetup(false);
    // Reload data
    loadFixkosten();
    fetch(`/api/dashboard?month=${getCurrentMonth()}`).then((r) => r.json()).then(setData);
  };

  const addSetupRow = () => setSetupItems((p) => [...p, { name: "", betrag: "", kategorie: "sonstiges" }]);
  const removeSetupRow = (i: number) => setSetupItems((p) => p.filter((_, idx) => idx !== i));
  const updateSetupRow = (i: number, field: keyof WizardFixkostenEntry, val: string) =>
    setSetupItems((p) => p.map((row, idx) => idx === i ? { ...row, [field]: val } : row));
  const applyPreset = (p: { name: string; kategorie: string }) => {
    const emptyIdx = setupItems.findIndex((i) => !i.name);
    if (emptyIdx >= 0) {
      updateSetupRow(emptyIdx, "name", p.name);
      updateSetupRow(emptyIdx, "kategorie", p.kategorie);
    } else {
      setSetupItems((prev) => [...prev, { name: p.name, betrag: "", kategorie: p.kategorie }]);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const cur = data?.currency ?? "EUR";
  const remaining = data?.remainingBalance ?? 0;
  const isNegative = remaining < 0;
  const freeAfterFixed = (data?.totalSalary ?? 0) - fixkostenTotal;

  return (
    <div className="space-y-6">
      {/* Setup Wizard Modal */}
      {showSetup && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            {/* Step indicator */}
            <div className="flex gap-1 p-4 pb-0">
              {[0, 1, 2, 3].map((s) => (
                <div key={s} className={`h-1 flex-1 rounded-full transition-all ${s <= setupStep ? "bg-emerald-500" : "bg-gray-100 dark:bg-gray-800"}`} />
              ))}
            </div>

            {/* Step 0: Welcome */}
            {setupStep === 0 && (
              <div className="p-6 text-center">
                <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-950 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Wallet className="h-8 w-8 text-emerald-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{t("finanzen.setupTitle")}</h2>
                <p className="text-gray-500 text-sm mb-6">{t("finanzen.setupWelcome")}</p>
                <div className="flex gap-2">
                  <button onClick={dismissSetup}
                    className="flex-1 py-2.5 text-sm text-gray-500 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    {t("finanzen.setupSkip")}
                  </button>
                  <button onClick={() => setSetupStep(1)}
                    className="flex-1 py-2.5 text-sm bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-medium transition-colors">
                    {t("common.continue") || "Weiter"}
                  </button>
                </div>
              </div>
            )}

            {/* Step 1: Salary */}
            {setupStep === 1 && (
              <div className="p-6">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{t("finanzen.setupSalaryStep")}</h2>
                <p className="text-sm text-gray-500 mb-4">{t("finanzen.setupSalaryHint")}</p>
                <div className="relative mb-6">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">€</span>
                  <input type="number" min="0" step="0.01" value={setupSalary}
                    onChange={(e) => setSetupSalary(e.target.value)} placeholder="0.00"
                    className="w-full pl-8 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-lg font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setSetupStep(0)}
                    className="p-2.5 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <ChevronLeft className="h-4 w-4 text-gray-500" />
                  </button>
                  <button onClick={() => setSetupStep(2)}
                    className="flex-1 py-2.5 text-sm bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-medium transition-colors">
                    {t("common.continue") || "Weiter"}
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Fixed expenses */}
            {setupStep === 2 && (
              <div className="p-6">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{t("finanzen.setupFixedStep")}</h2>
                <p className="text-sm text-gray-500 mb-3">{t("finanzen.setupFixedHint")}</p>
                {/* Presets */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {PRESETS.map((p) => (
                    <button key={p.name} type="button" onClick={() => applyPreset(p)}
                      className="text-xs px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 rounded-full hover:bg-emerald-100 transition-colors">
                      + {p.name}
                    </button>
                  ))}
                </div>
                {/* Items */}
                <div className="space-y-2 max-h-48 overflow-y-auto mb-3">
                  {setupItems.map((item, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <input value={item.name} onChange={(e) => updateSetupRow(idx, "name", e.target.value)}
                        placeholder={t("common.name")}
                        className="flex-1 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                      <div className="relative">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">€</span>
                        <input type="number" min="0" step="0.01" value={item.betrag}
                          onChange={(e) => updateSetupRow(idx, "betrag", e.target.value)} placeholder="0"
                          className="w-24 pl-5 pr-2 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                      </div>
                      {setupItems.length > 1 && (
                        <button type="button" onClick={() => removeSetupRow(idx)}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950 rounded-lg transition-colors">
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button type="button" onClick={addSetupRow}
                  className="w-full py-2 text-sm text-emerald-600 border border-dashed border-emerald-200 dark:border-emerald-800 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-950 transition-colors mb-4">
                  + Weitere hinzufügen
                </button>
                <div className="flex gap-2">
                  <button onClick={() => setSetupStep(1)}
                    className="p-2.5 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <ChevronLeft className="h-4 w-4 text-gray-500" />
                  </button>
                  <button onClick={() => setSetupStep(3)}
                    className="flex-1 py-2.5 text-sm bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-medium transition-colors">
                    {t("common.continue") || "Weiter"}
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Done */}
            {setupStep === 3 && (
              <div className="p-6 text-center">
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
                    <strong>{formatCurrency(
                      setupItems.filter((i) => i.name && parseFloat(i.betrag) > 0)
                        .reduce((s, i) => s + toCents(parseFloat(i.betrag)), 0), "EUR"
                    )}</strong>
                  </div>
                )}
                <p className="text-gray-500 text-sm mb-6">{t("finanzen.setupDoneMsg")}</p>
                <button onClick={handleSetupFinish} disabled={setupSaving}
                  className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-medium disabled:opacity-50 transition-colors">
                  {setupSaving ? t("finanzen.saving") : t("finanzen.setupFinish")}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Title + Setup trigger */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t("finanzen.title")}</h1>
          <p className="text-sm text-gray-500">{new Date().toLocaleDateString(lang, { month: "long", year: "numeric" })}</p>
        </div>
        <button onClick={() => { setSetupStep(0); setShowSetup(true); }}
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
          <Settings className="h-3.5 w-3.5" />
          {t("finanzen.setupReset")}
        </button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            label: t("finanzen.salary"), value: data?.totalSalary ?? 0,
            icon: Wallet, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/60",
          },
          {
            label: t("finanzen.expenses"), value: data?.totalExpenses ?? 0,
            icon: TrendingDown, color: "text-red-600", bg: "bg-red-50 dark:bg-red-950/60",
          },
          {
            label: t("finanzen.fixkosten"), value: fixkostenTotal,
            icon: Lock, color: "text-indigo-600", bg: "bg-indigo-50 dark:bg-indigo-950/60",
          },
          {
            label: t("finanzen.freeAfterFixed"), value: freeAfterFixed,
            icon: PiggyBank,
            color: freeAfterFixed < 0 ? "text-red-600" : "text-emerald-600",
            bg: freeAfterFixed < 0 ? "bg-red-50 dark:bg-red-950/60" : "bg-emerald-50 dark:bg-emerald-950/60",
          },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className={`${bg} rounded-2xl p-5 flex flex-col gap-2`}>
            <Icon className={`h-5 w-5 ${color}`} />
            <div>
              <p className="text-xs text-gray-500">{label}</p>
              <p className={`text-lg font-bold ${color}`}>{formatCurrency(value, cur)}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Progress bar: expenses + fixkosten vs salary */}
      {(data?.totalSalary ?? 0) > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 space-y-3">
          {/* Expenses bar */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-500">{t("finanzen.expenses")}</span>
              <span className="font-medium text-gray-700 dark:text-gray-300">
                {data?.totalSalary ? Math.round(((data.totalExpenses) / data.totalSalary) * 100) : 0}%
              </span>
            </div>
            <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
              <div className="h-full bg-red-400 rounded-full transition-all"
                style={{ width: `${Math.min(100, data?.totalSalary ? Math.round((data.totalExpenses / data.totalSalary) * 100) : 0)}%` }} />
            </div>
          </div>
          {/* Fixkosten bar */}
          {fixkostenTotal > 0 && (
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-500">{t("finanzen.fixkosten")}</span>
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  {data?.totalSalary ? Math.round((fixkostenTotal / data.totalSalary) * 100) : 0}%
                </span>
              </div>
              <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-400 rounded-full transition-all"
                  style={{ width: `${Math.min(100, data?.totalSalary ? Math.round((fixkostenTotal / data.totalSalary) * 100) : 0)}%` }} />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Quick nav */}
      <div>
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">{t("finanzen.sections")}</h2>
        <div className="grid grid-cols-2 gap-2">
          {[
            { href: "/finanzen/ausgaben", label: t("finanzen.expenses"), icon: Receipt, color: "text-red-500" },
            { href: "/finanzen/fixkosten", label: t("finanzen.fixkosten"), icon: Lock, color: "text-indigo-500" },
            { href: "/finanzen/sparziele", label: t("finanzen.savingsGoals"), icon: PiggyBank, color: "text-emerald-500" },
            { href: "/finanzen/monatsplan", label: t("finanzen.monthlyPlan"), icon: CalendarClock, color: "text-blue-500" },
            { href: "/finanzen/berichte", label: t("finanzen.reports"), icon: FileBarChart, color: "text-purple-500" },
            {
              href: "/finanzen/benachrichtigungen", label: t("finanzen.alerts"),
              icon: AlertTriangle, color: "text-orange-500",
              badge: data?.unreadAlerts.length,
            },
          ].map(({ href, label, icon: Icon, color, badge }) => (
            <Link key={href} href={href}
              className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl px-4 py-3 flex items-center gap-3 hover:shadow-sm hover:border-gray-200 dark:hover:border-gray-700 transition-all group">
              <Icon className={`h-5 w-5 ${color} flex-shrink-0`} />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex-1 truncate">{label}</span>
              {badge !== undefined && badge > 0 && (
                <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full flex-shrink-0">{badge}</span>
              )}
              <ChevronRight className="h-4 w-4 text-gray-300 dark:text-gray-600 flex-shrink-0 group-hover:text-gray-400 transition-colors" />
            </Link>
          ))}
        </div>
      </div>

      {/* Recent expenses */}
      {data && data.recentExpenses.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{t("finanzen.recentExpenses")}</h2>
            <Link href="/finanzen/ausgaben" className="text-xs text-blue-600 hover:underline">{t("common.viewAll")}</Link>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 divide-y divide-gray-50 dark:divide-gray-800">
            {data.recentExpenses.map((e) => (
              <div key={e._id} className="flex items-center justify-between px-4 py-3 gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{e.title}</p>
                  <p className="text-xs text-gray-400">{e.category} · {new Date(e.date).toLocaleDateString(lang)}</p>
                </div>
                <span className={`text-sm font-semibold flex-shrink-0 ${TYPE_COLORS[e.type] ?? "text-gray-700 dark:text-gray-300"}`}>
                  {formatCurrency(e.amount, cur)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Alerts */}
      {data && data.unreadAlerts.length > 0 && (
        <div>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">{t("finanzen.unreadAlerts")}</h2>
          <div className="space-y-2">
            {data.unreadAlerts.slice(0, 3).map((a) => (
              <div key={a._id} className={`rounded-xl px-4 py-3 border text-sm ${
                a.type === "danger"
                  ? "bg-red-50 border-red-200 text-red-700 dark:bg-red-950 dark:border-red-800 dark:text-red-400"
                  : a.type === "warning"
                  ? "bg-yellow-50 border-yellow-200 text-yellow-700 dark:bg-yellow-950 dark:border-yellow-800 dark:text-yellow-400"
                  : "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-400"
              }`}>
                <p className="font-medium">{a.title}</p>
                <p className="text-xs opacity-80 mt-0.5">{a.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
