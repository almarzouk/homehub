"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import Link from "next/link";
import {
  ArrowLeft, ToggleLeft, ToggleRight, Save, Wallet,
  LayoutDashboard, ChefHat, Package, Sparkles, Pill, Gift,
  FileText, Map, ArrowLeftRight, UserRound, Calendar, Car, PawPrint,
  Zap, MessageCircle, Dumbbell, Truck, Settings, Layers,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { MODULE_REGISTRY } from "@/lib/modules";
import { invalidateHouseholdConfig } from "@/hooks/useHouseholdConfig";

const ICON_MAP: Record<string, LucideIcon> = {
  uebersicht: LayoutDashboard,
  kueche: ChefHat,
  vorrat: Package,
  finanzen: Wallet,
  haushalt: Sparkles,
  medikamente: Pill,
  wunschliste: Gift,
  dokumente: FileText,
  einkaufsrouten: Map,
  bewegungen: ArrowLeftRight,
  familie: UserRound,
  termine: Calendar,
  kalender: Calendar,
  reinigung: Sparkles,
  fahrzeuge: Car,
  haustiere: PawPrint,
  energie: Zap,
  chat: MessageCircle,
  fitness: Dumbbell,
  lieferungen: Truck,
  einstellungen: Settings,
};

const ALL_KEYS = MODULE_REGISTRY.map((m) => m.key);

export default function ModuleSettingsPage() {
  const { t } = useTranslation();
  const [enabled, setEnabled] = useState<Set<string>>(new Set(ALL_KEYS));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/mein-haushalt/berechtigungen").then((r) => r.json());
      const mods: string[] = res.enabledModules ?? [];
      setEnabled(mods.length > 0 ? new Set(mods) : new Set(ALL_KEYS));
    } catch {
      setError(t("common.error"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => { load(); }, [load]);

  const toggle = (key: string) => {
    setEnabled((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        if (key === "uebersicht") return prev;
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
    setSaved(false);
  };

  const save = async () => {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/mein-haushalt/berechtigungen", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "modules", enabledModules: Array.from(enabled) }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      invalidateHouseholdConfig();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const tabs = MODULE_REGISTRY.filter((m) => m.group === "tab");
  const mehr = MODULE_REGISTRY.filter((m) => m.group === "mehr");

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/einstellungen" className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
          <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t("einstellungen.moduleSettings")}</h1>
          <p className="text-sm text-gray-500">{t("einstellungen.moduleSettingsDesc")}</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3 text-sm text-red-700 dark:text-red-400">{error}</div>
      )}

      <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-xl px-4 py-3 text-sm text-blue-700 dark:text-blue-400">
        {t("einstellungen.moduleSettingsHint")}
      </div>

      {/* Finance sub-sections link */}
      {enabled.has("finanzen") && (
        <Link href="/einstellungen/finanzen"
          className="flex items-center gap-4 p-4 bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 rounded-2xl hover:bg-emerald-100 dark:hover:bg-emerald-900 transition-colors">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center">
            <Wallet className="h-5 w-5 text-emerald-600" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-emerald-800 dark:text-emerald-300">{t("finanzen.sectionSettings")}</p>
            <p className="text-xs text-emerald-600 dark:text-emerald-400">{t("finanzen.sectionSettingsDesc")}</p>
          </div>
          <Layers className="h-5 w-5 text-emerald-500" />
        </Link>
      )}

      {[{ title: t("einstellungen.mainTabs"), desc: t("einstellungen.mainTabsDesc"), items: tabs },
        { title: t("einstellungen.moreSections"), desc: t("einstellungen.moreSectionsDesc"), items: mehr }].map(({ title, desc, items }) => (
        <div key={title} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
            <h2 className="font-semibold text-gray-900 dark:text-white">{title}</h2>
            <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
          </div>
          {items.map((m) => {
            const Icon = ICON_MAP[m.key] ?? Layers;
            const isEnabled = enabled.has(m.key);
            const isCore = m.key === "uebersicht";
            return (
              <div key={m.key} className="flex items-center gap-4 px-4 py-3.5 border-b border-gray-50 dark:border-gray-800 last:border-0">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: isEnabled ? `${m.color}20` : "#f3f4f6" }}>
                  <Icon className="h-5 w-5" style={{ color: isEnabled ? m.color : "#9ca3af" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium ${isEnabled ? "text-gray-900 dark:text-white" : "text-gray-400 dark:text-gray-600"}`}>
                      {m.label_de}
                    </span>
                    {isCore && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-400">{t("finanzen.alwaysActive")}</span>
                    )}
                  </div>
                  <p className={`text-xs ${isEnabled ? "text-gray-400" : "text-gray-300 dark:text-gray-700"}`}>{m.beschreibung_de}</p>
                </div>
                <button
                  onClick={() => toggle(m.key)}
                  disabled={isCore}
                  className="transition-colors disabled:opacity-40"
                >
                  {isEnabled ? (
                    <ToggleRight className="h-7 w-7" style={{ color: m.color }} />
                  ) : (
                    <ToggleLeft className="h-7 w-7 text-gray-300 dark:text-gray-700" />
                  )}
                </button>
              </div>
            );
          })}
        </div>
      ))}

      <button
        onClick={save}
        disabled={saving}
        className="w-full py-3 bg-blue-500 hover:bg-blue-600 disabled:opacity-60 text-white rounded-2xl font-semibold transition-colors flex items-center justify-center gap-2"
      >
        {saving ? (
          <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> {t("finanzen.saving")}</>
        ) : saved ? (
          <><Save className="h-4 w-4" /> {t("common.success")}</>
        ) : (
          <><Save className="h-4 w-4" /> {t("common.save")}</>
        )}
      </button>
    </div>
  );
}
