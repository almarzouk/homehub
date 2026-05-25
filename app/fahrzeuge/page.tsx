"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Trash2, Car, Wrench, Calendar, ChevronDown, ChevronRight } from "lucide-react";

interface Wartungseintrag {
  _id: string;
  datum: string;
  beschreibung: string;
  kosten?: number;
  kilometerstand?: number;
  werkstatt?: string;
}

interface Fahrzeug {
  _id: string;
  bezeichnung: string;
  kennzeichen?: string;
  marke?: string;
  modell?: string;
  baujahr?: number;
  farbe?: string;
  treibstoff?: string;
  naechsterTuev?: string;
  naechsterService?: string;
  aktuellerKmStand?: number;
  wartungen: Wartungseintrag[];
  notizen?: string;
}

const TREIBSTOFF_LABEL: Record<string, string> = {
  benzin: "Benzin", diesel: "Diesel", elektro: "Elektro", hybrid: "Hybrid", gas: "Gas", sonstige: "Sonstige",
};

const emptyForm = { bezeichnung: "", kennzeichen: "", marke: "", modell: "", baujahr: "", farbe: "", treibstoff: "", naechsterTuev: "", naechsterService: "", aktuellerKmStand: "", notizen: "" };
const emptyWartung = { datum: "", beschreibung: "", kosten: "", kilometerstand: "", werkstatt: "" };

function formatDate(str?: string) {
  if (!str) return null;
  return new Date(str).toLocaleDateString("de-DE");
}

function isNearDue(str?: string) {
  if (!str) return false;
  const diff = new Date(str).getTime() - Date.now();
  return diff > 0 && diff < 60 * 24 * 60 * 60 * 1000; // within 60 days
}

export default function FahrzeugePage() {
  const [fahrzeuge, setFahrzeuge] = useState<Fahrzeug[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [wartungForm, setWartungForm] = useState<Record<string, typeof emptyWartung>>({});
  const [showWartungForm, setShowWartungForm] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/fahrzeuge");
    const data = await res.json();
    setFahrzeuge(Array.isArray(data) ? data : []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const addFahrzeug = async () => {
    if (!form.bezeichnung) return;
    setSaving(true);
    const res = await fetch("/api/fahrzeuge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        baujahr: form.baujahr ? parseInt(form.baujahr) : undefined,
        aktuellerKmStand: form.aktuellerKmStand ? parseFloat(form.aktuellerKmStand) : undefined,
        naechsterTuev: form.naechsterTuev || undefined,
        naechsterService: form.naechsterService || undefined,
      }),
    });
    if (res.ok) { setForm(emptyForm); setShowForm(false); load(); }
    setSaving(false);
  };

  const deleteFahrzeug = async (id: string, name: string) => {
    if (!confirm(`"${name}" wirklich löschen?`)) return;
    await fetch(`/api/fahrzeuge/${id}`, { method: "DELETE" });
    load();
  };

  const addWartung = async (id: string) => {
    const w = wartungForm[id] ?? emptyWartung;
    if (!w.datum || !w.beschreibung) return;
    const res = await fetch(`/api/fahrzeuge/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        addWartung: {
          datum: w.datum,
          beschreibung: w.beschreibung,
          kosten: w.kosten ? parseFloat(w.kosten) : undefined,
          kilometerstand: w.kilometerstand ? parseFloat(w.kilometerstand) : undefined,
          werkstatt: w.werkstatt || undefined,
        },
      }),
    });
    if (res.ok) {
      setWartungForm((prev) => ({ ...prev, [id]: emptyWartung }));
      setShowWartungForm(null);
      load();
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Fahrzeugpflege</h1>
          <p className="text-sm text-gray-500">Fahrzeuge, TÜV-Termine und Wartungshistorie</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors">
          <Plus className="h-4 w-4" />
          Fahrzeug
        </button>
      </div>

      {showForm && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 space-y-4">
          <h2 className="font-semibold text-gray-900 dark:text-white">Neues Fahrzeug</h2>
          <div className="grid grid-cols-2 gap-3">
            <input className="col-span-2 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" placeholder="Bezeichnung *" value={form.bezeichnung} onChange={(e) => setForm({ ...form, bezeichnung: e.target.value })} />
            <input className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" placeholder="Kennzeichen" value={form.kennzeichen} onChange={(e) => setForm({ ...form, kennzeichen: e.target.value })} />
            <input className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" placeholder="Marke" value={form.marke} onChange={(e) => setForm({ ...form, marke: e.target.value })} />
            <input className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" placeholder="Modell" value={form.modell} onChange={(e) => setForm({ ...form, modell: e.target.value })} />
            <input type="number" className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" placeholder="Baujahr" value={form.baujahr} onChange={(e) => setForm({ ...form, baujahr: e.target.value })} />
            <select className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" value={form.treibstoff} onChange={(e) => setForm({ ...form, treibstoff: e.target.value })}>
              <option value="">Treibstoff wählen</option>
              {Object.entries(TREIBSTOFF_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <input type="number" className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" placeholder="KM-Stand" value={form.aktuellerKmStand} onChange={(e) => setForm({ ...form, aktuellerKmStand: e.target.value })} />
            <div className="col-span-2 grid grid-cols-2 gap-3">
              <div><label className="text-xs text-gray-500 mb-1 block">Nächster TÜV</label><input type="date" className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" value={form.naechsterTuev} onChange={(e) => setForm({ ...form, naechsterTuev: e.target.value })} /></div>
              <div><label className="text-xs text-gray-500 mb-1 block">Nächster Service</label><input type="date" className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" value={form.naechsterService} onChange={(e) => setForm({ ...form, naechsterService: e.target.value })} /></div>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowForm(false)} className="flex-1 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-600 dark:text-gray-400">Abbrechen</button>
            <button onClick={addFahrzeug} disabled={saving || !form.bezeichnung} className="flex-1 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-60 text-white rounded-xl text-sm font-medium">{saving ? "Speichere..." : "Hinzufügen"}</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16"><div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : fahrzeuge.length === 0 ? (
        <div className="text-center py-20"><Car className="h-12 w-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-500">Noch keine Fahrzeuge eingetragen.</p></div>
      ) : (
        <div className="space-y-4">
          {fahrzeuge.map((f) => {
            const isOpen = expanded === f._id;
            const tuevSoon = isNearDue(f.naechsterTuev);
            const serviceSoon = isNearDue(f.naechsterService);
            return (
              <div key={f._id} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
                <div className="flex items-center gap-4 px-5 py-4">
                  <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-950 flex items-center justify-center flex-shrink-0">
                    <Car className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-gray-900 dark:text-white">{f.bezeichnung}</p>
                      {f.kennzeichen && <span className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded font-mono text-gray-600 dark:text-gray-400">{f.kennzeichen}</span>}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {[f.marke, f.modell, f.baujahr].filter(Boolean).join(" · ")}
                      {f.treibstoff && ` · ${TREIBSTOFF_LABEL[f.treibstoff] ?? f.treibstoff}`}
                    </p>
                    <div className="flex gap-3 mt-1">
                      {f.naechsterTuev && <span className={`text-xs ${tuevSoon ? "text-red-500 font-medium" : "text-gray-500"}`}>TÜV: {formatDate(f.naechsterTuev)}</span>}
                      {f.naechsterService && <span className={`text-xs ${serviceSoon ? "text-orange-500 font-medium" : "text-gray-500"}`}>Service: {formatDate(f.naechsterService)}</span>}
                      {f.aktuellerKmStand && <span className="text-xs text-gray-500">{f.aktuellerKmStand.toLocaleString("de-DE")} km</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setExpanded(isOpen ? null : f._id)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
                      {isOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                      Wartungen ({f.wartungen.length})
                    </button>
                    <button onClick={() => deleteFahrzeug(f._id, f.bezeichnung)} className="p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-950 text-red-400 hover:text-red-600 transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {isOpen && (
                  <div className="border-t border-gray-100 dark:border-gray-800 px-5 py-4 bg-gray-50 dark:bg-gray-950">
                    <div className="space-y-2 mb-4">
                      {f.wartungen.length === 0 && <p className="text-sm text-gray-400 italic">Noch keine Wartungseinträge</p>}
                      {f.wartungen.sort((a, b) => new Date(b.datum).getTime() - new Date(a.datum).getTime()).map((w) => (
                        <div key={w._id} className="flex items-start gap-3 bg-white dark:bg-gray-900 rounded-xl p-3 border border-gray-100 dark:border-gray-700">
                          <Wrench className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-sm font-medium text-gray-900 dark:text-white">{w.beschreibung}</p>
                              <span className="text-xs text-gray-500">{formatDate(w.datum)}</span>
                            </div>
                            <div className="flex gap-3 mt-0.5">
                              {w.kosten !== undefined && <span className="text-xs text-gray-500">{w.kosten.toFixed(2)} €</span>}
                              {w.kilometerstand && <span className="text-xs text-gray-500">{w.kilometerstand.toLocaleString("de-DE")} km</span>}
                              {w.werkstatt && <span className="text-xs text-gray-500">{w.werkstatt}</span>}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {showWartungForm === f._id ? (
                      <div className="space-y-3 bg-white dark:bg-gray-900 rounded-xl p-3 border border-gray-100 dark:border-gray-700">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Neue Wartung</p>
                        <div className="grid grid-cols-2 gap-2">
                          <input type="date" className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" value={wartungForm[f._id]?.datum ?? ""} onChange={(e) => setWartungForm((prev) => ({ ...prev, [f._id]: { ...(prev[f._id] ?? emptyWartung), datum: e.target.value } }))} />
                          <input className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" placeholder="Beschreibung *" value={wartungForm[f._id]?.beschreibung ?? ""} onChange={(e) => setWartungForm((prev) => ({ ...prev, [f._id]: { ...(prev[f._id] ?? emptyWartung), beschreibung: e.target.value } }))} />
                          <input type="number" className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" placeholder="Kosten (€)" value={wartungForm[f._id]?.kosten ?? ""} onChange={(e) => setWartungForm((prev) => ({ ...prev, [f._id]: { ...(prev[f._id] ?? emptyWartung), kosten: e.target.value } }))} />
                          <input className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" placeholder="Werkstatt" value={wartungForm[f._id]?.werkstatt ?? ""} onChange={(e) => setWartungForm((prev) => ({ ...prev, [f._id]: { ...(prev[f._id] ?? emptyWartung), werkstatt: e.target.value } }))} />
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => setShowWartungForm(null)} className="flex-1 py-1.5 border border-gray-200 dark:border-gray-700 rounded-lg text-xs text-gray-600 dark:text-gray-400">Abbrechen</button>
                          <button onClick={() => addWartung(f._id)} className="flex-1 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-medium">Eintragen</button>
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => setShowWartungForm(f._id)} className="flex items-center gap-2 text-sm text-amber-600 hover:text-amber-700 font-medium">
                        <Plus className="h-4 w-4" />
                        Wartung eintragen
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
