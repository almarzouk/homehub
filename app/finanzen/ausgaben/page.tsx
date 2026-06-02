"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { Plus, Trash2, Receipt } from "lucide-react";
import { formatCurrency, getCurrentMonth } from "@/lib/utils";

interface Expense {
  _id: string;
  title: string;
  amount: number;
  category: string;
  type: "necessary" | "unnecessary" | "investment";
  date: string;
  note?: string;
  isWarning: boolean;
}

const CATEGORIES = ["Lebensmittel", "Transport", "Wohnen", "Gesundheit", "Bildung", "Unterhaltung", "Kleidung", "Sonstiges"];

export default function AusgabenPage() {
  const { t } = useTranslation();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [month, setMonth] = useState(getCurrentMonth());
  const [form, setForm] = useState({ title: "", amount: "", category: CATEGORIES[0], type: "necessary" as Expense["type"], date: new Date().toISOString().split("T")[0], note: "" });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/finanzen/ausgaben?month=${month}`);
    const data = await res.json();
    setExpenses(Array.isArray(data) ? data : []);
    setLoading(false);
  }, [month]);

  useEffect(() => { load(); }, [load]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const amountCents = Math.round(parseFloat(form.amount) * 100);
    await fetch("/api/finanzen/ausgaben", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, amount: amountCents }),
    });
    setSaving(false);
    setShowForm(false);
    setForm({ title: "", amount: "", category: CATEGORIES[0], type: "necessary", date: new Date().toISOString().split("T")[0], note: "" });
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Ausgabe wirklich löschen?")) return;
    await fetch(`/api/finanzen/ausgaben/${id}`, { method: "DELETE" });
    load();
  };

  const total = expenses.reduce((s, e) => s + e.amount, 0);
  const currency = "EUR";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t("finanzen.expenses")}</h1>
          <p className="text-sm text-gray-500">{expenses.length} Einträge · {formatCurrency(total, currency)}</p>
        </div>
        <div className="flex gap-2 items-center">
          <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="text-sm border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors">
            <Plus className="h-4 w-4" />
            Neue Ausgabe
          </button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 space-y-4">
          <h2 className="font-semibold text-gray-800 dark:text-white">Neue Ausgabe</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Bezeichnung</label>
              <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Betrag (€)</label>
              <input required type="number" step="0.01" min="0" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Kategorie</label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Typ</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as Expense["type"] })} className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                <option value="necessary">Notwendig</option>
                <option value="unnecessary">Unnötig</option>
                <option value="investment">Investition</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Datum</label>
              <input type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Notiz</label>
              <input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors">Abbrechen</button>
            <button type="submit" disabled={saving} className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm rounded-xl disabled:opacity-50 transition-colors">
              {saving ? "Speichern…" : "Speichern"}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : expenses.length === 0 ? (
        <div className="text-center py-20">
          <Receipt className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">{t("finanzen.noExpenses")} in diesem Monat.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 divide-y divide-gray-50 dark:divide-gray-800">
          {expenses.map((e) => (
            <div key={e._id} className="flex items-center gap-4 px-4 py-3 group">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 dark:text-white truncate">{e.title}</p>
                <p className="text-xs text-gray-400">{e.category} · {e.type === "unnecessary" ? "Unnötig" : e.type === "investment" ? "Investition" : "Notwendig"} · {new Date(e.date).toLocaleDateString("de-DE")}</p>
              </div>
              <span className={`text-sm font-semibold flex-shrink-0 ${e.isWarning ? "text-orange-600" : "text-gray-700 dark:text-gray-300"}`}>
                {formatCurrency(e.amount, currency)}
              </span>
              <button onClick={() => handleDelete(e._id)} className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
