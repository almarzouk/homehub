"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { Plus, Trash2, ShoppingCart, CheckCheck, Gift, ExternalLink } from "lucide-react";

interface Wunsch {
  _id: string;
  name: string;
  beschreibung?: string;
  preis: number;
  prioritaet: "hoch" | "mittel" | "niedrig";
  kategorie: string;
  link?: string;
  bild?: string;
  gekauft: boolean;
  gekauftAm?: string;
}

const PRIORITAET_COLOR: Record<string, string> = {
  hoch: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
  mittel: "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400",
  niedrig: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400",
};

const emptyForm = {
  name: "",
  beschreibung: "",
  preis: "",
  prioritaet: "mittel" as Wunsch["prioritaet"],
  kategorie: "",
  link: "",
};

export default function WunschlistePage() {
  const { t } = useTranslation();
  const [wuensche, setWuensche] = useState<Wunsch[]>([]);
  const [gesamtBudget, setGesamtBudget] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [nurOffen, setNurOffen] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (nurOffen) params.set("offen", "true");
    const res = await fetch(`/api/wunschliste?${params}`);
    const data = await res.json();
    setWuensche(data.wuensche ?? []);
    setGesamtBudget(data.gesamtBudget ?? 0);
    setLoading(false);
  }, [nurOffen]);

  useEffect(() => { load(); }, [load]);

  const toggleGekauft = async (w: Wunsch) => {
    await fetch(`/api/wunschliste/${w._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...w, preis: w.preis, gekauft: !w.gekauft }),
    });
    load();
  };

  const del = async (id: string) => {
    if (!confirm("Wunsch löschen?")) return;
    await fetch(`/api/wunschliste/${id}`, { method: "DELETE" });
    load();
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.preis) return;
    setSaving(true);
    const preisEuro = parseFloat(form.preis as string);
    await fetch("/api/wunschliste", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        preis: Math.round(preisEuro * 100),
        link: form.link || undefined,
      }),
    });
    setSaving(false);
    setShowForm(false);
    setForm(emptyForm);
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Wunschliste</h1>
          <p className="text-sm text-gray-500">{wuensche.length} Wünsche</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors">
          <Plus className="h-4 w-4" /> Wunsch
        </button>
      </div>

      {/* Budget card */}
      <div className="bg-gradient-to-br from-purple-500 to-purple-700 rounded-2xl p-5 text-white">
        <p className="text-sm font-medium opacity-80">Gesamt-Budget (offen)</p>
        <p className="text-3xl font-bold mt-1">
          {(gesamtBudget / 100).toFixed(2).replace(".", ",")} €
        </p>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {[{ v: true, l: "Offen" }, { v: false, l: "Alle" }].map(({ v, l }) => (
          <button key={l} onClick={() => setNurOffen(v)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              nurOffen === v
                ? "bg-purple-500 text-white border-purple-500"
                : "bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700"
            }`}>{l}</button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : wuensche.length === 0 ? (
        <div className="text-center py-20">
          <Gift className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Keine Wünsche</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {wuensche.map((w) => (
            <div key={w._id}
              className={`bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 space-y-3 ${w.gekauft ? "opacity-60" : ""}`}>
              <div className="flex items-start gap-3">
                {w.bild ? (
                  <img src={w.bild} alt={w.name} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-950/30 flex items-center justify-center flex-shrink-0">
                    <Gift className="h-6 w-6 text-purple-400" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className={`font-semibold text-sm ${w.gekauft ? "line-through text-gray-400" : "text-gray-900 dark:text-white"}`}>{w.name}</p>
                  <p className="text-lg font-bold text-purple-600 dark:text-purple-400">
                    {(w.preis / 100).toFixed(2).replace(".", ",")} €
                  </p>
                </div>
                <button onClick={() => del(w._id)} className="text-gray-300 hover:text-red-500 transition-colors flex-shrink-0">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              {w.beschreibung && <p className="text-xs text-gray-500 truncate">{w.beschreibung}</p>}

              <div className="flex flex-wrap gap-1.5">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${PRIORITAET_COLOR[w.prioritaet]}`}>
                  {w.prioritaet}
                </span>
                {w.kategorie && (
                  <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                    {w.kategorie}
                  </span>
                )}
              </div>

              <div className="flex gap-2">
                <button onClick={() => toggleGekauft(w)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium transition-colors ${
                    w.gekauft
                      ? "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                      : "bg-purple-50 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400 hover:bg-purple-100"
                  }`}>
                  {w.gekauft ? <CheckCheck className="h-3.5 w-3.5" /> : <ShoppingCart className="h-3.5 w-3.5" />}
                  {w.gekauft ? t("wunschliste.purchased") : "Als gekauft markieren"}
                </button>
                {w.link && (
                  <a href={w.link} target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-center p-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 transition-colors">
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Neuer Wunsch</h2>
            <form onSubmit={save} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Name *</label>
                <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="z.B. Neues Laptop" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Preis (€) *</label>
                  <input required type="number" step="0.01" min="0" value={form.preis}
                    onChange={(e) => setForm({ ...form, preis: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="0.00" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Priorität</label>
                  <select value={form.prioritaet} onChange={(e) => setForm({ ...form, prioritaet: e.target.value as Wunsch["prioritaet"] })}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500">
                    <option value="hoch">Hoch</option>
                    <option value="mittel">Mittel</option>
                    <option value="niedrig">Niedrig</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Kategorie</label>
                <input value={form.kategorie} onChange={(e) => setForm({ ...form, kategorie: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="z.B. Elektronik" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Beschreibung</label>
                <textarea value={form.beschreibung} onChange={(e) => setForm({ ...form, beschreibung: e.target.value })}
                  rows={2} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Link</label>
                <input type="url" value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="https://…" />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => { setShowForm(false); setForm(emptyForm); }}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  Abbrechen
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-purple-500 hover:bg-purple-600 text-white text-sm font-medium transition-colors disabled:opacity-50">
                  {saving ? "Speichern…" : "Speichern"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
