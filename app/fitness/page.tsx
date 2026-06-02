"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Trash2, Activity, Dumbbell, Weight, Footprints, Moon } from "lucide-react";

interface FitnessEintrag {
  _id: string;
  typ: string;
  datum: string;
  wert: number;
  einheit: string;
  dauer?: number;
  notizen?: string;
}

const TYP_CONFIG: Record<string, { label: string; einheit: string; icon: React.ComponentType<{ className?: string }>; color: string; bg: string }> = {
  gewicht: { label: "Gewicht", einheit: "kg", icon: Weight, color: "text-blue-600", bg: "bg-blue-100 dark:bg-blue-950" },
  training: { label: "Training", einheit: "min", icon: Dumbbell, color: "text-orange-600", bg: "bg-orange-100 dark:bg-orange-950" },
  schritte: { label: "Schritte", einheit: "Schritte", icon: Footprints, color: "text-green-600", bg: "bg-green-100 dark:bg-green-950" },
  schlaf: { label: "Schlaf", einheit: "Std.", icon: Moon, color: "text-purple-600", bg: "bg-purple-100 dark:bg-purple-950" },
  sonstige: { label: "Sonstige", einheit: "Einheit", icon: Activity, color: "text-gray-600", bg: "bg-gray-100 dark:bg-gray-800" },
};

const emptyForm = { typ: "gewicht", datum: new Date().toISOString().split("T")[0], wert: "", einheit: "kg", dauer: "", notizen: "" };

function formatDate(str: string) {
  return new Date(str).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default function FitnessPage() {
  const [entries, setEntries] = useState<FitnessEintrag[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [selectedTyp, setSelectedTyp] = useState("gewicht");

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/fitness?typ=${selectedTyp}`);
    const data = await res.json();
    setEntries(Array.isArray(data) ? data : []);
    setLoading(false);
  }, [selectedTyp]);

  useEffect(() => { load(); }, [load]);

  const addEntry = async () => {
    if (!form.wert) return;
    setSaving(true);
    const res = await fetch("/api/fitness", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        wert: parseFloat(form.wert),
        dauer: form.dauer ? parseFloat(form.dauer) : undefined,
      }),
    });
    if (res.ok) { setForm({ ...emptyForm, typ: form.typ, einheit: form.einheit }); setShowForm(false); load(); }
    setSaving(false);
  };

  const deleteEntry = async (id: string) => {
    await fetch(`/api/fitness/${id}`, { method: "DELETE" });
    load();
  };

  const cfg = TYP_CONFIG[selectedTyp] ?? TYP_CONFIG.sonstige;
  const Icon = cfg.icon;

  // Simple trend: last vs second-to-last for weight
  const trend = entries.length >= 2 && selectedTyp === "gewicht"
    ? entries[0].wert - entries[1].wert
    : null;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Fitness & Gesundheit</h1>
          <p className="text-sm text-gray-500">Gewicht, Training, Schritte und Schlaf verfolgen</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors">
          <Plus className="h-4 w-4" />
          Eintrag
        </button>
      </div>

      {/* Type tabs */}
      <div className="flex gap-2 flex-wrap">
        {Object.entries(TYP_CONFIG).map(([typ, c]) => {
          const Ic = c.icon;
          return (
            <button key={typ} onClick={() => { setSelectedTyp(typ); setForm((f) => ({ ...f, typ, einheit: c.einheit })); }} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${selectedTyp === typ ? `${c.bg} ${c.color}` : "bg-gray-100 dark:bg-gray-800 text-gray-500"}`}>
              <Ic className="h-3.5 w-3.5" />
              {c.label}
            </button>
          );
        })}
      </div>

      {showForm && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 space-y-4">
          <h2 className="font-semibold text-gray-900 dark:text-white">Neuer Eintrag</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <select className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" value={form.typ} onChange={(e) => setForm({ ...form, typ: e.target.value, einheit: TYP_CONFIG[e.target.value]?.einheit ?? "" })}>
              {Object.entries(TYP_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
            <input type="date" className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" value={form.datum} onChange={(e) => setForm({ ...form, datum: e.target.value })} />
            <input type="number" min="0" step="0.1" className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" placeholder={`Wert (${form.einheit}) *`} value={form.wert} onChange={(e) => setForm({ ...form, wert: e.target.value })} />
            {form.typ === "training" && (
              <input type="number" min="0" className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" placeholder="Dauer (min)" value={form.dauer} onChange={(e) => setForm({ ...form, dauer: e.target.value })} />
            )}
            <input className="col-span-2 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" placeholder="Notiz (optional)" value={form.notizen} onChange={(e) => setForm({ ...form, notizen: e.target.value })} />
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowForm(false)} className="flex-1 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-600 dark:text-gray-400">Abbrechen</button>
            <button onClick={addEntry} disabled={saving || !form.wert} className="flex-1 py-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white rounded-xl text-sm font-medium">{saving ? "Speichere..." : "Hinzufügen"}</button>
          </div>
        </div>
      )}

      {/* Summary card */}
      {entries.length > 0 && (
        <div className={`rounded-2xl p-5 ${cfg.bg}`}>
          <div className="flex items-center gap-3">
            <Icon className={`h-8 w-8 ${cfg.color}`} />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">{cfg.label} — letzter Eintrag</p>
              <p className={`text-3xl font-bold ${cfg.color}`}>
                {entries[0].wert} <span className="text-lg font-normal">{entries[0].einheit}</span>
              </p>
              {trend !== null && (
                <p className={`text-sm mt-0.5 ${trend > 0 ? "text-red-500" : trend < 0 ? "text-green-500" : "text-gray-500"}`}>
                  {trend > 0 ? "+" : ""}{trend.toFixed(1)} kg seit letztem Eintrag
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-8"><div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : entries.length === 0 ? (
        <div className="text-center py-16"><Activity className="h-12 w-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-500">Noch keine Einträge für {cfg.label}.</p></div>
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
          <div className="divide-y divide-gray-50 dark:divide-gray-800">
            {entries.map((e) => (
              <div key={e._id} className="flex items-center gap-4 px-5 py-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.bg}`}>
                  <Icon className={`h-4 w-4 ${cfg.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {e.wert} {e.einheit}
                    {e.dauer ? ` · ${e.dauer} min` : ""}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatDate(e.datum)}
                    {e.notizen ? ` · ${e.notizen}` : ""}
                  </p>
                </div>
                <button onClick={() => deleteEntry(e._id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950 text-red-400 hover:text-red-600 transition-colors">
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
