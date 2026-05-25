"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, ToggleLeft, ToggleRight, Save,
  LayoutDashboard, ChefHat, Package, Wallet, Sparkles, Pill, Gift,
  FileText, Map, ArrowLeftRight, UserRound, Calendar } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface ModuleDef {
  key: string;
  label_de: string;
  beschreibung_de: string;
  Icon: LucideIcon;
  color: string;
  group: "tab" | "mehr";
}

const MODULES: ModuleDef[] = [
  { key: "uebersicht",     label_de: "Übersicht",       beschreibung_de: "Dashboard & Schnellzugriff",          Icon: LayoutDashboard, color: "#3B82F6", group: "tab"  },
  { key: "kueche",         label_de: "Küche",           beschreibung_de: "Rezepte & Kochgeräte",                Icon: ChefHat,         color: "#F97316", group: "tab"  },
  { key: "vorrat",         label_de: "Vorrat",          beschreibung_de: "Lagerbestand verwalten",              Icon: Package,         color: "#10B981", group: "tab"  },
  { key: "finanzen",       label_de: "Finanzen",        beschreibung_de: "Ausgaben, Investitionen & Sparpläne", Icon: Wallet,          color: "#8B5CF6", group: "tab"  },
  { key: "haushalt",       label_de: "Haushalt",        beschreibung_de: "Aufgaben, Reinigung, Wartung",        Icon: Sparkles,        color: "#06B6D4", group: "mehr" },
  { key: "medikamente",    label_de: "Medikamente",     beschreibung_de: "Vorrat, Dosierungen, Ablaufdaten",    Icon: Pill,            color: "#EF4444", group: "mehr" },
  { key: "wunschliste",    label_de: "Wunschliste",     beschreibung_de: "Kaufziele & Wünsche",                 Icon: Gift,            color: "#8B5CF6", group: "mehr" },
  { key: "dokumente",      label_de: "Dokumente",       beschreibung_de: "Verträge, Ausweise, Garantien",       Icon: FileText,        color: "#3B82F6", group: "mehr" },
  { key: "einkaufsrouten", label_de: "Einkaufsrouten", beschreibung_de: "Einkaufsliste nach Gängen sortieren",  Icon: Map,             color: "#10B981", group: "mehr" },
  { key: "bewegungen",     label_de: "Lagerbewegungen", beschreibung_de: "Eingang · Ausgang · Bestandsanpassung", Icon: ArrowLeftRight, color: "#3B82F6", group: "mehr" },
  { key: "familie",        label_de: "Familie",         beschreibung_de: "Mitglieder & Push-Nachrichten",       Icon: UserRound,       color: "#EC4899", group: "mehr" },
  { key: "termine",        label_de: "Termine",         beschreibung_de: "Arzt, Schule, Freizeit & mehr",       Icon: Calendar,        color: "#F59E0B", group: "mehr" },
];

const ALL_KEYS = MODULES.map((m) => m.key);

export default function ModuleSettingsPage() {
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
      setError("Ladefehler");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggle = (key: string) => {
    setEnabled((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        // Protect core modules from being disabled
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
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const tabs = MODULES.filter((m) => m.group === "tab");
  const mehr = MODULES.filter((m) => m.group === "mehr");

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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">App-Bereiche verwalten</h1>
          <p className="text-sm text-gray-500">Schalte Bereiche für deinen gesamten Haushalt ein oder aus</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3 text-sm text-red-700 dark:text-red-400">{error}</div>
      )}

      <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-xl px-4 py-3 text-sm text-blue-700 dark:text-blue-400">
        Deaktivierte Bereiche sind für <strong>alle Haushaltsmitglieder</strong> ausgeblendet — auch für Co-Admins. Die App aktualisiert sich automatisch innerhalb von 60 Sekunden.
      </div>

      {[{ title: "Haupt-Tabs", desc: "Diese Bereiche erscheinen direkt in der unteren Navigationsleiste", items: tabs },
        { title: "Mehr-Bereiche", desc: "Diese Bereiche erscheinen unter dem \"Mehr\"-Tab", items: mehr }].map(({ title, desc, items }) => (
        <div key={title} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
            <h2 className="font-semibold text-gray-900 dark:text-white">{title}</h2>
            <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
          </div>
          {items.map((m) => {
            const isEnabled = enabled.has(m.key);
            const isCore = m.key === "uebersicht";
            return (
              <div key={m.key} className="flex items-center gap-4 px-4 py-3.5 border-b border-gray-50 dark:border-gray-800 last:border-0">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: isEnabled ? `${m.color}20` : "#f3f4f6" }}>
                  <m.Icon className="h-5 w-5" style={{ color: isEnabled ? m.color : "#9ca3af" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium ${isEnabled ? "text-gray-900 dark:text-white" : "text-gray-400 dark:text-gray-600"}`}>
                      {m.label_de}
                    </span>
                    {isCore && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-400">Immer aktiv</span>
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
          <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Wird gespeichert…</>
        ) : saved ? (
          <><Save className="h-4 w-4" /> Änderungen gespeichert!</>
        ) : (
          <><Save className="h-4 w-4" /> Änderungen speichern</>
        )}
      </button>
    </div>
  );
}
