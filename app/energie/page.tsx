"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { Plus, Trash2, Zap, Flame, Droplets, Thermometer } from "lucide-react";

interface Energie {
  _id: string;
  typ: string;
  monat: number;
  jahr: number;
  verbrauch: number;
  einheit: string;
  kosten?: number;
  zaehlerstand?: number;
}

const TYP_CONFIG: Record<string, { label: string; einheit: string; icon: React.ComponentType<{ className?: string }>; color: string; bg: string }> = {
  strom: { label: "Strom", einheit: "kWh", icon: Zap, color: "text-yellow-600", bg: "bg-yellow-100 dark:bg-yellow-950" },
  gas: { label: "Gas", einheit: "m³", icon: Flame, color: "text-orange-600", bg: "bg-orange-100 dark:bg-orange-950" },
  wasser: { label: "Wasser", einheit: "m³", icon: Droplets, color: "text-blue-600", bg: "bg-blue-100 dark:bg-blue-950" },
  heizung: { label: "Heizung", einheit: "kWh", icon: Thermometer, color: "text-red-600", bg: "bg-red-100 dark:bg-red-950" },
  sonstige: { label: "Sonstige", einheit: "Einheit", icon: Zap, color: "text-gray-600", bg: "bg-gray-100 dark:bg-gray-800" },
};

const MONATE = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];

const emptyForm = { typ: "strom", monat: new Date().getMonth() + 1, jahr: new Date().getFullYear(), verbrauch: "", einheit: "kWh", kosten: "", zaehlerstand: "" };

export default function EnergiePage() {
  const { t } = useTranslation();
  const [items, setItems] = useState<Energie[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...emptyForm, monat: new Date().getMonth() + 1, jahr: new Date().getFullYear() });
  const [saving, setSaving] = useState(false);
  const [selectedTyp, setSelectedTyp] = useState("strom");
  const [selectedJahr, setSelectedJahr] = useState(new Date().getFullYear());

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/energie?typ=${selectedTyp}&jahr=${selectedJahr}`);
    const data = await res.json();
    setItems(Array.isArray(data) ? data : []);
    setLoading(false);
  }, [selectedTyp, selectedJahr]);

  useEffect(() => { load(); }, [load]);

  const addItem = async () => {
    if (!form.verbrauch) return;
    setSaving(true);
    const res = await fetch("/api/energie", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        verbrauch: parseFloat(form.verbrauch),
        kosten: form.kosten ? parseFloat(form.kosten) : undefined,
        zaehlerstand: form.zaehlerstand ? parseFloat(form.zaehlerstand) : undefined,
      }),
    });
    if (res.ok) { setShowForm(false); load(); }
    setSaving(false);
  };

  const deleteItem = async (id: string) => {
    await fetch(`/api/energie/${id}`, { method: "DELETE" });
    load();
  };

  // Build chart data for 12 months
  const chartData = MONATE.map((label, i) => {
    const monat = i + 1;
    const item = items.find((e) => e.monat === monat);
    return { label, verbrauch: item?.verbrauch ?? 0, kosten: item?.kosten ?? 0, hasData: !!item };
  });
  const maxVerbrauch = Math.max(...chartData.map((d) => d.verbrauch), 1);

  const config = TYP_CONFIG[selectedTyp] ?? TYP_CONFIG.sonstige;
  const Icon = config.icon;

  const jahre = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t("energie.title")}</h1>
          <p className="text-sm text-gray-500">Strom, Gas, Wasser und Heizung im Überblick</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors">
          <Plus className="h-4 w-4" />
          Eintrag
        </button>
      </div>

      {/* Type + Year filter */}
      <div className="flex gap-4 flex-wrap items-center">
        <div className="flex gap-2">
          {Object.entries(TYP_CONFIG).map(([typ, cfg]) => {
            const Ic = cfg.icon;
            return (
              <button key={typ} onClick={() => { setSelectedTyp(typ); setForm((f) => ({ ...f, typ, einheit: cfg.einheit })); }} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${selectedTyp === typ ? `${cfg.bg} ${cfg.color}` : "bg-gray-100 dark:bg-gray-800 text-gray-500"}`}>
                <Ic className="h-3.5 w-3.5" />
                {cfg.label}
              </button>
            );
          })}
        </div>
        <select className="px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm" value={selectedJahr} onChange={(e) => setSelectedJahr(parseInt(e.target.value))}>
          {jahre.map((j) => <option key={j} value={j}>{j}</option>)}
        </select>
      </div>

      {showForm && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 space-y-4">
          <h2 className="font-semibold text-gray-900 dark:text-white">Neuer Eintrag</h2>
          <div className="grid grid-cols-2 gap-3">
            <select className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" value={form.typ} onChange={(e) => setForm({ ...form, typ: e.target.value, einheit: TYP_CONFIG[e.target.value]?.einheit ?? "Einheit" })}>
              {Object.entries(TYP_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
            <select className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" value={form.monat} onChange={(e) => setForm({ ...form, monat: parseInt(e.target.value) })}>
              {MONATE.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
            </select>
            <select className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" value={form.jahr} onChange={(e) => setForm({ ...form, jahr: parseInt(e.target.value) })}>
              {jahre.map((j) => <option key={j} value={j}>{j}</option>)}
            </select>
            <input type="number" min="0" step="0.01" className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder={`Verbrauch (${form.einheit}) *`} value={form.verbrauch} onChange={(e) => setForm({ ...form, verbrauch: e.target.value })} />
            <input type="number" min="0" step="0.01" className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="Kosten (€)" value={form.kosten} onChange={(e) => setForm({ ...form, kosten: e.target.value })} />
            <input type="number" min="0" step="0.01" className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="Zählerstand" value={form.zaehlerstand} onChange={(e) => setForm({ ...form, zaehlerstand: e.target.value })} />
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowForm(false)} className="flex-1 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-600 dark:text-gray-400">Abbrechen</button>
            <button onClick={addItem} disabled={saving || !form.verbrauch} className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white rounded-xl text-sm font-medium">{saving ? "Speichere..." : "Speichern"}</button>
          </div>
        </div>
      )}

      {/* Bar chart */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${config.bg}`}>
            <Icon className={`h-4 w-4 ${config.color}`} />
          </div>
          <div>
            <p className="font-semibold text-gray-900 dark:text-white text-sm">{config.label} {selectedJahr}</p>
            <p className="text-xs text-gray-500">Monatlicher Verbrauch in {items[0]?.einheit ?? config.einheit}</p>
          </div>
        </div>
        {loading ? (
          <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : (
          <div className="flex items-end gap-1 h-36">
            {chartData.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full relative flex items-end" style={{ height: "100px" }}>
                  <div
                    className={`w-full rounded-t transition-all duration-500 ${d.hasData ? config.bg.replace("100", "200").replace("950", "900") : "bg-gray-100 dark:bg-gray-800"}`}
                    style={{ height: `${Math.max(4, (d.verbrauch / maxVerbrauch) * 100)}px` }}
                    title={d.hasData ? `${d.verbrauch} ${items[0]?.einheit ?? ""}${d.kosten ? ` · ${d.kosten.toFixed(2)} €` : ""}` : "Keine Daten"}
                  />
                </div>
                <span className="text-xs text-gray-500">{d.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Table */}
      {!loading && items.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-800">
            <p className="font-semibold text-sm text-gray-900 dark:text-white">Einträge</p>
          </div>
          <div className="divide-y divide-gray-50 dark:divide-gray-800">
            {items.map((item) => (
              <div key={item._id} className="flex items-center gap-4 px-5 py-3">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{MONATE[item.monat - 1]} {item.jahr}</p>
                  <p className="text-xs text-gray-500">{item.verbrauch} {item.einheit}{item.zaehlerstand ? ` · Zähler: ${item.zaehlerstand}` : ""}</p>
                </div>
                {item.kosten !== undefined && <span className="text-sm font-semibold text-gray-900 dark:text-white">{item.kosten.toFixed(2)} €</span>}
                <button onClick={() => deleteItem(item._id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950 text-red-400 hover:text-red-600 transition-colors">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
