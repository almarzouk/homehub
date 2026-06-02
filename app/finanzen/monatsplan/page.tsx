"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { CalendarClock, Plus, Trash2 } from "lucide-react";

interface PlanItem { name: string; betrag: number; kategorie: string; }
interface MonatsplanDoc { _id?: string; month: string; items: PlanItem[]; }

function getMonthKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function fmt(cents: number) {
  return (cents / 100).toLocaleString("de-DE", { style: "currency", currency: "EUR" });
}

export default function MonatsplanPage() {
  const [month, setMonth] = useState(getMonthKey());
  const [plan, setPlan] = useState<MonatsplanDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [items, setItems] = useState<PlanItem[]>([]);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/finanzen/monatsplan?month=${month}`)
      .then((r) => r.json())
      .then((d) => {
        setPlan(d);
        setItems(d?.items ?? []);
        setLoading(false);
      });
  }, [month]);

  const addItem = () => setItems((i) => [...i, { name: "", betrag: 0, kategorie: "" }]);
  const removeItem = (i: number) => setItems((arr) => arr.filter((_, idx) => idx !== i));
  const updateItem = (i: number, field: keyof PlanItem, val: string) => {
    setItems((arr) => arr.map((item, idx) => idx === i ? { ...item, [field]: field === "betrag" ? (Math.round(parseFloat(val || "0") * 100)) : val } : item));
  };

  const save = async () => {
    setSaving(true);
    await fetch("/api/finanzen/monatsplan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ month, items }),
    });
    setSaving(false);
  };

  const total = items.reduce((s, i) => s + (i.betrag || 0), 0);

  const [y, mo] = month.split("-");
  const monthLabel = new Date(parseInt(y), parseInt(mo) - 1).toLocaleDateString("de-DE", { month: "long", year: "numeric" });

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950 flex items-center justify-center">
          <CalendarClock className="h-5 w-5 text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Monatsplan</h1>
          <p className="text-sm text-gray-500">Budgetplanung</p>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Monat</label>
        <input type="month" value={month} onChange={(e) => setMonth(e.target.value)}
          className="px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="space-y-5">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-900 dark:text-white">{monthLabel}</h2>
              <button onClick={addItem} className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700">
                <Plus className="h-4 w-4" />Hinzufügen
              </button>
            </div>

            {items.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">Keine Einträge. Klicke auf &quot;Hinzufügen&quot;.</p>
            ) : (
              <div className="space-y-2">
                {items.map((item, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <input type="text" value={item.name} onChange={(e) => updateItem(i, "name", e.target.value)} placeholder="Beschreibung"
                      className="flex-1 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    <input type="text" value={item.kategorie} onChange={(e) => updateItem(i, "kategorie", e.target.value)} placeholder="Kategorie"
                      className="w-24 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    <input type="number" min="0" step="0.01" value={item.betrag / 100 || ""} onChange={(e) => updateItem(i, "betrag", e.target.value)} placeholder="0.00"
                      className="w-24 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    <button onClick={() => removeItem(i)} className="p-2 text-red-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                  </div>
                ))}
              </div>
            )}

            {total > 0 && (
              <div className="border-t border-gray-100 dark:border-gray-800 pt-3 flex justify-between">
                <span className="font-semibold text-gray-900 dark:text-white">Gesamt geplant</span>
                <span className="font-bold text-blue-600">{fmt(total)}</span>
              </div>
            )}
          </div>

          <button onClick={save} disabled={saving}
            className="w-full py-2.5 bg-blue-500 hover:bg-blue-600 disabled:opacity-60 text-white rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2">
            {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <CalendarClock className="h-4 w-4" />}
            {saving ? "Speichere…" : "Plan speichern"}
          </button>
        </div>
      )}
    </div>
  );
}
