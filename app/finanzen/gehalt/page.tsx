"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { Wallet, Plus, Trash2 } from "lucide-react";

interface Allocation { kategorie: string; prozent: number; betrag: number; }
interface SalaryConfig { _id: string; month: string; amount: number; currency: string; allocations: Allocation[]; }

function getMonthKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function fmt(cents: number) {
  return (cents / 100).toLocaleString("de-DE", { style: "currency", currency: "EUR" });
}

export default function GehaltPage() {
  const [month, setMonth] = useState(getMonthKey());
  const [config, setConfig] = useState<SalaryConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [amount, setAmount] = useState("");
  const [allocations, setAllocations] = useState<Allocation[]>([]);

  const load = async (m: string) => {
    setLoading(true);
    const res = await fetch(`/api/finanzen/gehalt?month=${m}`);
    const data = await res.json();
    setConfig(data);
    if (data) {
      setAmount((data.amount / 100).toFixed(2));
      setAllocations(data.allocations ?? []);
    } else {
      setAmount("");
      setAllocations([]);
    }
    setLoading(false);
  };

  useEffect(() => { load(month); }, [month]);

  const addAllocation = () => setAllocations((a) => [...a, { kategorie: "", prozent: 0, betrag: 0 }]);
  const removeAllocation = (i: number) => setAllocations((a) => a.filter((_, idx) => idx !== i));
  const updateAlloc = (i: number, field: keyof Allocation, val: string) => {
    setAllocations((a) => a.map((item, idx) => idx === i ? { ...item, [field]: field === "kategorie" ? val : parseFloat(val) || 0 } : item));
  };

  const save = async () => {
    setSaving(true);
    setError("");
    const res = await fetch("/api/finanzen/gehalt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ month, amount: Math.round(parseFloat(amount) * 100) || 0, currency: "EUR", allocations }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error || "Speicherfehler"); }
    else { setConfig(data); }
    setSaving(false);
  };

  const [y, mo] = month.split("-");
  const monthLabel = new Date(parseInt(y), parseInt(mo) - 1).toLocaleDateString("de-DE", { month: "long", year: "numeric" });

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center">
          <Wallet className="h-5 w-5 text-emerald-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gehalt</h1>
          <p className="text-sm text-gray-500">Monatliche Einkommensverwaltung</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Monat</label>
          <input type="month" value={month} onChange={(e) => setMonth(e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="space-y-5">
          {error && <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">{error}</div>}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 space-y-4">
            <h2 className="font-semibold text-gray-900 dark:text-white">{monthLabel}</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Nettoeinkommen (€)</label>
              <input type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="3000.00"
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-900 dark:text-white">Aufteilung</h2>
              <button onClick={addAllocation} className="flex items-center gap-1 text-sm text-emerald-600 hover:text-emerald-700">
                <Plus className="h-4 w-4" />Hinzufügen
              </button>
            </div>
            {allocations.length === 0 && <p className="text-sm text-gray-400">Noch keine Aufteilung definiert.</p>}
            {allocations.map((a, i) => (
              <div key={i} className="flex gap-2 items-center">
                <input type="text" value={a.kategorie} onChange={(e) => updateAlloc(i, "kategorie", e.target.value)} placeholder="Kategorie"
                  className="flex-1 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                <input type="number" min="0" max="100" value={a.prozent || ""} onChange={(e) => updateAlloc(i, "prozent", e.target.value)} placeholder="%"
                  className="w-16 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                <button onClick={() => removeAllocation(i)} className="p-2 text-red-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
              </div>
            ))}
          </div>

          {config && amount && (
            <div className="bg-emerald-50 dark:bg-emerald-950 rounded-2xl border border-emerald-100 dark:border-emerald-900 p-5">
              <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400 mb-2">Gespeichertes Gehalt</p>
              <p className="text-3xl font-bold text-emerald-700 dark:text-emerald-400">{fmt(config.amount)}</p>
            </div>
          )}

          <button onClick={save} disabled={saving || !amount}
            className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-white rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2">
            {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Wallet className="h-4 w-4" />}
            {saving ? "Speichere…" : "Gehalt speichern"}
          </button>
        </div>
      )}
    </div>
  );
}
