"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Trash2, PawPrint, Calendar, Syringe, ChevronDown, ChevronRight } from "lucide-react";

interface Impfung {
  _id: string;
  name: string;
  datum: string;
  naechsteFaelligkeit?: string;
  tierarzt?: string;
}

interface Haustier {
  _id: string;
  name: string;
  tierart: string;
  rasse?: string;
  geschlecht?: string;
  geburtsdatum?: string;
  tierarzt?: string;
  naechsterTierarztTermin?: string;
  impfungen: Impfung[];
  notizen?: string;
}

const GESCHLECHT_LABEL: Record<string, string> = { maennlich: "Männlich", weiblich: "Weiblich", unbekannt: "Unbekannt" };

const emptyForm = { name: "", tierart: "", rasse: "", geschlecht: "", geburtsdatum: "", tierarzt: "", naechsterTierarztTermin: "", notizen: "" };
const emptyImpfung = { name: "", datum: "", naechsteFaelligkeit: "", tierarzt: "" };

function formatDate(str?: string) {
  if (!str) return null;
  return new Date(str).toLocaleDateString("de-DE");
}

function calcAlter(geburtsdatum?: string) {
  if (!geburtsdatum) return null;
  const diff = Date.now() - new Date(geburtsdatum).getTime();
  const jahre = Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
  return jahre > 0 ? `${jahre} Jahre` : `${Math.floor(diff / (30 * 24 * 60 * 60 * 1000))} Monate`;
}

export default function HaustierePage() {
  const [tiere, setTiere] = useState<Haustier[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [impfForm, setImpfForm] = useState<Record<string, typeof emptyImpfung>>({});
  const [showImpfForm, setShowImpfForm] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/haustiere");
    const data = await res.json();
    setTiere(Array.isArray(data) ? data : []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const addTier = async () => {
    if (!form.name || !form.tierart) return;
    setSaving(true);
    const res = await fetch("/api/haustiere", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        geburtsdatum: form.geburtsdatum || undefined,
        naechsterTierarztTermin: form.naechsterTierarztTermin || undefined,
        geschlecht: form.geschlecht || undefined,
      }),
    });
    if (res.ok) { setForm(emptyForm); setShowForm(false); load(); }
    setSaving(false);
  };

  const deleteTier = async (id: string, name: string) => {
    if (!confirm(`"${name}" wirklich löschen?`)) return;
    await fetch(`/api/haustiere/${id}`, { method: "DELETE" });
    load();
  };

  const addImpfung = async (id: string) => {
    const imp = impfForm[id] ?? emptyImpfung;
    if (!imp.name || !imp.datum) return;
    const res = await fetch(`/api/haustiere/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        addImpfung: {
          name: imp.name,
          datum: imp.datum,
          naechsteFaelligkeit: imp.naechsteFaelligkeit || undefined,
          tierarzt: imp.tierarzt || undefined,
        },
      }),
    });
    if (res.ok) {
      setImpfForm((prev) => ({ ...prev, [id]: emptyImpfung }));
      setShowImpfForm(null);
      load();
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Haustiere</h1>
          <p className="text-sm text-gray-500">Gesundheit und Impfungen im Überblick</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-rose-500 hover:bg-rose-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors">
          <Plus className="h-4 w-4" />
          Haustier
        </button>
      </div>

      {showForm && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 space-y-4">
          <h2 className="font-semibold text-gray-900 dark:text-white">Neues Haustier</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500" placeholder="Name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <input className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500" placeholder="Tierart *" value={form.tierart} onChange={(e) => setForm({ ...form, tierart: e.target.value })} />
            <input className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500" placeholder="Rasse (optional)" value={form.rasse} onChange={(e) => setForm({ ...form, rasse: e.target.value })} />
            <select className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500" value={form.geschlecht} onChange={(e) => setForm({ ...form, geschlecht: e.target.value })}>
              <option value="">Geschlecht wählen</option>
              {Object.entries(GESCHLECHT_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <div><label className="text-xs text-gray-500 mb-1 block">Geburtsdatum</label><input type="date" className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500" value={form.geburtsdatum} onChange={(e) => setForm({ ...form, geburtsdatum: e.target.value })} /></div>
            <div><label className="text-xs text-gray-500 mb-1 block">Nächster Tierarzt</label><input type="date" className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500" value={form.naechsterTierarztTermin} onChange={(e) => setForm({ ...form, naechsterTierarztTermin: e.target.value })} /></div>
            <input className="col-span-2 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500" placeholder="Tierarzt (Name / Praxis)" value={form.tierarzt} onChange={(e) => setForm({ ...form, tierarzt: e.target.value })} />
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowForm(false)} className="flex-1 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-600 dark:text-gray-400">Abbrechen</button>
            <button onClick={addTier} disabled={saving || !form.name || !form.tierart} className="flex-1 py-2 bg-rose-500 hover:bg-rose-600 disabled:opacity-60 text-white rounded-xl text-sm font-medium">{saving ? "Speichere..." : "Hinzufügen"}</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16"><div className="w-8 h-8 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : tiere.length === 0 ? (
        <div className="text-center py-20"><PawPrint className="h-12 w-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-500">Noch keine Haustiere eingetragen.</p></div>
      ) : (
        <div className="space-y-4">
          {tiere.map((tier) => {
            const isOpen = expanded === tier._id;
            const alter = calcAlter(tier.geburtsdatum);
            return (
              <div key={tier._id} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
                <div className="flex items-center gap-4 px-5 py-4">
                  <div className="w-12 h-12 rounded-xl bg-rose-100 dark:bg-rose-950 flex items-center justify-center flex-shrink-0">
                    <PawPrint className="h-6 w-6 text-rose-500 dark:text-rose-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-gray-900 dark:text-white">{tier.name}</p>
                      <span className="text-xs bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 px-2 py-0.5 rounded-full">{tier.tierart}</span>
                      {tier.rasse && <span className="text-xs text-gray-500">{tier.rasse}</span>}
                    </div>
                    <div className="flex gap-3 mt-0.5">
                      {tier.geschlecht && <span className="text-xs text-gray-500">{GESCHLECHT_LABEL[tier.geschlecht] ?? tier.geschlecht}</span>}
                      {alter && <span className="text-xs text-gray-500">{alter}</span>}
                      {tier.naechsterTierarztTermin && <span className="flex items-center gap-1 text-xs text-orange-500"><Calendar className="h-3 w-3" />Tierarzt: {formatDate(tier.naechsterTierarztTermin)}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setExpanded(isOpen ? null : tier._id)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
                      {isOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                      Impfungen ({tier.impfungen.length})
                    </button>
                    <button onClick={() => deleteTier(tier._id, tier.name)} className="p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-950 text-red-400 hover:text-red-600 transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {isOpen && (
                  <div className="border-t border-gray-100 dark:border-gray-800 px-5 py-4 bg-gray-50 dark:bg-gray-950 space-y-3">
                    {tier.impfungen.length === 0 && <p className="text-sm text-gray-400 italic">Noch keine Impfeinträge</p>}
                    {tier.impfungen.map((imp) => (
                      <div key={imp._id} className="flex items-start gap-3 bg-white dark:bg-gray-900 rounded-xl p-3 border border-gray-100 dark:border-gray-700">
                        <Syringe className="h-4 w-4 text-rose-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{imp.name}</p>
                          <div className="flex gap-3 mt-0.5">
                            <span className="text-xs text-gray-500">Gegeben: {formatDate(imp.datum)}</span>
                            {imp.naechsteFaelligkeit && <span className="text-xs text-orange-500">Fällig: {formatDate(imp.naechsteFaelligkeit)}</span>}
                            {imp.tierarzt && <span className="text-xs text-gray-500">{imp.tierarzt}</span>}
                          </div>
                        </div>
                      </div>
                    ))}

                    {showImpfForm === tier._id ? (
                      <div className="space-y-2 bg-white dark:bg-gray-900 rounded-xl p-3 border border-gray-100 dark:border-gray-700">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Neue Impfung</p>
                        <div className="grid grid-cols-2 gap-2">
                          <input className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500" placeholder="Impfung *" value={impfForm[tier._id]?.name ?? ""} onChange={(e) => setImpfForm((p) => ({ ...p, [tier._id]: { ...(p[tier._id] ?? emptyImpfung), name: e.target.value } }))} />
                          <input type="date" className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500" value={impfForm[tier._id]?.datum ?? ""} onChange={(e) => setImpfForm((p) => ({ ...p, [tier._id]: { ...(p[tier._id] ?? emptyImpfung), datum: e.target.value } }))} />
                          <input type="date" className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500" placeholder="Nächste Fälligkeit" value={impfForm[tier._id]?.naechsteFaelligkeit ?? ""} onChange={(e) => setImpfForm((p) => ({ ...p, [tier._id]: { ...(p[tier._id] ?? emptyImpfung), naechsteFaelligkeit: e.target.value } }))} />
                          <input className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500" placeholder="Tierarzt" value={impfForm[tier._id]?.tierarzt ?? ""} onChange={(e) => setImpfForm((p) => ({ ...p, [tier._id]: { ...(p[tier._id] ?? emptyImpfung), tierarzt: e.target.value } }))} />
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => setShowImpfForm(null)} className="flex-1 py-1.5 border border-gray-200 dark:border-gray-700 rounded-lg text-xs text-gray-600 dark:text-gray-400">Abbrechen</button>
                          <button onClick={() => addImpfung(tier._id)} className="flex-1 py-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-xs font-medium">Eintragen</button>
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => setShowImpfForm(tier._id)} className="flex items-center gap-2 text-sm text-rose-500 hover:text-rose-600 font-medium">
                        <Plus className="h-4 w-4" />
                        Impfung eintragen
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
