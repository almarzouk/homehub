"use client";

import { useEffect, useState } from "react";
import { Plus, TrendingUp, TrendingDown } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface Investment {
  _id: string;
  title: string;
  amount: number;
  currentValue: number;
  type: string;
  startDate: string;
  note?: string;
  ticker?: string;
}

export default function InvestitionenPage() {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", amount: "", currentValue: "", type: "stocks", startDate: new Date().toISOString().split("T")[0], note: "", ticker: "" });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const res = await fetch("/api/finanzen/investitionen");
    const data = await res.json();
    setInvestments(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/finanzen/investitionen", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        amount: Math.round(parseFloat(form.amount) * 100),
        currentValue: form.currentValue ? Math.round(parseFloat(form.currentValue) * 100) : undefined,
        ticker: form.ticker || undefined,
      }),
    });
    setSaving(false);
    setShowForm(false);
    setForm({ title: "", amount: "", currentValue: "", type: "stocks", startDate: new Date().toISOString().split("T")[0], note: "", ticker: "" });
    load();
  };

  const totalInvested = investments.reduce((s, i) => s + i.amount, 0);
  const totalCurrentValue = investments.reduce((s, i) => s + i.currentValue, 0);
  const profit = totalCurrentValue - totalInvested;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Investitionen</h1>
          <p className="text-sm text-gray-500">{investments.length} Positionen</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors">
          <Plus className="h-4 w-4" />
          Neue Investition
        </button>
      </div>

      {/* Summary */}
      {investments.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-blue-50 dark:bg-blue-950 rounded-xl p-4">
            <p className="text-xs text-gray-500">Investiert</p>
            <p className="font-semibold text-blue-700 dark:text-blue-400">{formatCurrency(totalInvested, "EUR")}</p>
          </div>
          <div className="bg-emerald-50 dark:bg-emerald-950 rounded-xl p-4">
            <p className="text-xs text-gray-500">Aktueller Wert</p>
            <p className="font-semibold text-emerald-700 dark:text-emerald-400">{formatCurrency(totalCurrentValue, "EUR")}</p>
          </div>
          <div className={`rounded-xl p-4 ${profit >= 0 ? "bg-emerald-50 dark:bg-emerald-950" : "bg-red-50 dark:bg-red-950"}`}>
            <p className="text-xs text-gray-500">Gewinn/Verlust</p>
            <p className={`font-semibold flex items-center gap-1 ${profit >= 0 ? "text-emerald-700 dark:text-emerald-400" : "text-red-700 dark:text-red-400"}`}>
              {profit >= 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
              {formatCurrency(profit, "EUR")}
            </p>
          </div>
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 space-y-4">
          <h2 className="font-semibold text-gray-800 dark:text-white">Neue Investition</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Bezeichnung</label>
              <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Ticker (optional)</label>
              <input value={form.ticker} onChange={(e) => setForm({ ...form, ticker: e.target.value })} placeholder="z.B. ASML.AS" className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Eingezahlter Betrag (€)</label>
              <input required type="number" step="0.01" min="0" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Aktueller Wert (€)</label>
              <input type="number" step="0.01" min="0" value={form.currentValue} onChange={(e) => setForm({ ...form, currentValue: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Typ</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="stocks">Aktien</option>
                <option value="etf">ETF</option>
                <option value="crypto">Krypto</option>
                <option value="real-estate">Immobilien</option>
                <option value="savings">Sparen</option>
                <option value="other">Sonstiges</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Startdatum</label>
              <input type="date" required value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl">Abbrechen</button>
            <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-xl disabled:opacity-50">{saving ? "Speichern…" : "Speichern"}</button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : investments.length === 0 ? (
        <div className="text-center py-20">
          <TrendingUp className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Noch keine Investitionen.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {investments.map((inv) => {
            const gain = inv.currentValue - inv.amount;
            const pct = inv.amount > 0 ? ((gain / inv.amount) * 100).toFixed(1) : "0";
            return (
              <div key={inv._id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 px-4 py-4 flex items-center gap-4">
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-white">{inv.title}</p>
                  <p className="text-xs text-gray-400 capitalize">{inv.type}{inv.ticker ? ` · ${inv.ticker}` : ""} · {new Date(inv.startDate).toLocaleDateString("de-DE")}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">{formatCurrency(inv.currentValue, "EUR")}</p>
                  <p className={`text-xs font-medium flex items-center justify-end gap-0.5 ${gain >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                    {gain >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {pct}%
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
