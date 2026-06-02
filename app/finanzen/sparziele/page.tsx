"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { PiggyBank, Plus, Trash2, Target } from "lucide-react";

interface SparZiel {
  _id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string;
  note?: string;
}

function fmt(cents: number) {
  return (cents / 100).toLocaleString("de-DE", { style: "currency", currency: "EUR" });
}

export default function SparZielePage() {
  const [ziele, setZiele] = useState<SparZiel[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", targetAmount: "", currentAmount: "0", deadline: "", note: "" });

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/finanzen/sparziele");
    const data = await res.json();
    setZiele(Array.isArray(data) ? data : []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!form.name || !form.targetAmount) { setError("Name und Zielbetrag sind Pflicht."); return; }
    setSaving(true);
    setError("");
    const res = await fetch("/api/finanzen/sparziele", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        targetAmount: Math.round(parseFloat(form.targetAmount) * 100),
        currentAmount: Math.round(parseFloat(form.currentAmount || "0") * 100),
        deadline: form.deadline || undefined,
        note: form.note || undefined,
      }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error || "Fehler"); setSaving(false); return; }
    setForm({ name: "", targetAmount: "", currentAmount: "0", deadline: "", note: "" });
    setShowForm(false);
    setSaving(false);
    load();
  };

  const del = async (id: string) => {
    if (!confirm("Sparziel wirklich löschen?")) return;
    await fetch(`/api/finanzen/sparziele/${id}`, { method: "DELETE" });
    load();
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Sparziele</h1>
          <p className="text-sm text-gray-500">{ziele.length} Ziele definiert</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors">
          <Plus className="h-4 w-4" />Neues Ziel
        </button>
      </div>

      {showForm && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 space-y-4">
          <h2 className="font-semibold text-gray-900 dark:text-white">Neues Sparziel</h2>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div>
            <label className="block text-sm font-medium mb-1.5">Name *</label>
            <input type="text" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="z. B. Urlaub"
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1.5">Zielbetrag (€) *</label>
              <input type="number" min="0" step="0.01" value={form.targetAmount} onChange={(e) => setForm((f) => ({ ...f, targetAmount: e.target.value }))} placeholder="5000.00"
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Bereits gespart (€)</label>
              <input type="number" min="0" step="0.01" value={form.currentAmount} onChange={(e) => setForm((f) => ({ ...f, currentAmount: e.target.value }))} placeholder="0.00"
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Zieldatum</label>
            <input type="date" value={form.deadline} onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Notiz</label>
            <textarea rows={2} value={form.note} onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
          <div className="flex gap-2">
            <button onClick={() => { setShowForm(false); setError(""); }} className="flex-1 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800">Abbrechen</button>
            <button onClick={save} disabled={saving} className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-white rounded-xl text-sm font-medium">
              {saving ? "Speichere…" : "Speichern"}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : ziele.length === 0 ? (
        <div className="text-center py-20">
          <PiggyBank className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Noch keine Sparziele. Lege dein erstes Ziel an!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {ziele.map((z) => {
            const pct = z.targetAmount > 0 ? Math.min(100, Math.round((z.currentAmount / z.targetAmount) * 100)) : 0;
            return (
              <div key={z._id} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-emerald-500" />
                      <h3 className="font-semibold text-gray-900 dark:text-white">{z.name}</h3>
                    </div>
                    {z.deadline && <p className="text-xs text-gray-400 mt-0.5">Zieldatum: {new Date(z.deadline).toLocaleDateString("de-DE")}</p>}
                  </div>
                  <button onClick={() => del(z._id)} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950 text-red-400 hover:text-red-600 rounded-lg transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="mb-2">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-500">{fmt(z.currentAmount)} gespart</span>
                    <span className="font-medium text-gray-900 dark:text-white">{fmt(z.targetAmount)} Ziel</span>
                  </div>
                  <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <p className="text-xs text-gray-400 mt-1 text-right">{pct}%</p>
                </div>
                {z.note && <p className="text-xs text-gray-500">{z.note}</p>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
