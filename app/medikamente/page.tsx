"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Trash2, AlertTriangle, Pill, Camera } from "lucide-react";

interface Medikament {
  _id: string;
  name: string;
  wirkstoff?: string;
  dosierung: string;
  einheit: "mg" | "ml" | "tablette" | "kapsel" | "tropfen" | "sonstiges";
  vorrat: number;
  mindestvorrat: number;
  ablaufdatum?: string;
  einnahmezeiten: string[];
  einnahmehinweis?: string;
  bild?: string;
  erinnerung: boolean;
}

const EINNAHME_TIMES = ["morgens", "mittags", "abends", "nachts"];

const VORRAT_COLOR = (m: Medikament) => {
  if (m.vorrat === 0) return "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400";
  if (m.vorrat <= m.mindestvorrat) return "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400";
  return "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400";
};

const emptyForm = {
  name: "",
  wirkstoff: "",
  dosierung: "",
  einheit: "tablette" as Medikament["einheit"],
  vorrat: 0,
  mindestvorrat: 5,
  ablaufdatum: "",
  einnahmezeiten: [] as string[],
  einnahmehinweis: "",
  erinnerung: true,
};

export default function MedikamentePage() {
  const [medikamente, setMedikamente] = useState<Medikament[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/medikamente");
    const data = await res.json();
    setMedikamente(data.medikamente ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const del = async (id: string) => {
    if (!confirm("Medikament löschen?")) return;
    await fetch(`/api/medikamente/${id}`, { method: "DELETE" });
    load();
  };

  const toggleZeit = (zeit: string) => {
    setForm((f) => ({
      ...f,
      einnahmezeiten: f.einnahmezeiten.includes(zeit)
        ? f.einnahmezeiten.filter((z) => z !== zeit)
        : [...f.einnahmezeiten, zeit],
    }));
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/medikamente", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, ablaufdatum: form.ablaufdatum || undefined }),
    });
    setSaving(false);
    setShowForm(false);
    setForm(emptyForm);
    load();
  };

  const isExpired = (m: Medikament) =>
    m.ablaufdatum && new Date(m.ablaufdatum) < new Date();

  const alerts = medikamente.filter(
    (m) => m.vorrat <= m.mindestvorrat || isExpired(m)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Medikamente</h1>
          <p className="text-sm text-gray-500">{medikamente.length} Einträge</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
        >
          <Plus className="h-4 w-4" /> Medikament
        </button>
      </div>

      {/* Alert banner */}
      {alerts.length > 0 && (
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900">
          <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-700 dark:text-red-400">
              {alerts.length} {alerts.length === 1 ? "Medikament benötigt" : "Medikamente benötigen"} Aufmerksamkeit
            </p>
            <p className="text-xs text-red-600 dark:text-red-500 mt-0.5">
              {alerts.map((m) => m.name).join(", ")}
            </p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : medikamente.length === 0 ? (
        <div className="text-center py-20">
          <Pill className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Noch keine Medikamente</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {medikamente.map((m) => (
            <div key={m._id}
              className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 space-y-3">
              <div className="flex items-start gap-3">
                {m.bild ? (
                  <img src={m.bild} alt={m.name} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-red-50 dark:bg-red-950/30 flex items-center justify-center flex-shrink-0">
                    <Pill className="h-6 w-6 text-red-400" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">{m.name}</p>
                  {m.wirkstoff && <p className="text-xs text-gray-500 truncate">{m.wirkstoff}</p>}
                  <p className="text-xs text-gray-500">{m.dosierung} {m.einheit}</p>
                </div>
                <button onClick={() => del(m._id)} className="text-gray-300 hover:text-red-500 transition-colors flex-shrink-0">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="flex flex-wrap gap-1.5">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${VORRAT_COLOR(m)}`}>
                  {m.vorrat} {m.einheit}
                </span>
                {isExpired(m) && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400">
                    Abgelaufen
                  </span>
                )}
                {m.ablaufdatum && !isExpired(m) && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                    bis {new Date(m.ablaufdatum).toLocaleDateString("de-DE")}
                  </span>
                )}
                {m.einnahmezeiten.map((z) => (
                  <span key={z} className="px-2 py-0.5 rounded-full text-xs bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400">
                    {z}
                  </span>
                ))}
              </div>

              {m.einnahmehinweis && (
                <p className="text-xs text-gray-400 truncate">{m.einnahmehinweis}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Neues Medikament</h2>
            <form onSubmit={save} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Name *</label>
                <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="z.B. Ibuprofen" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Wirkstoff</label>
                <input value={form.wirkstoff} onChange={(e) => setForm({ ...form, wirkstoff: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="z.B. Ibuprofen 400mg" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Dosierung *</label>
                  <input required value={form.dosierung} onChange={(e) => setForm({ ...form, dosierung: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="400" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Einheit</label>
                  <select value={form.einheit} onChange={(e) => setForm({ ...form, einheit: e.target.value as Medikament["einheit"] })}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-red-500">
                    {["mg", "ml", "tablette", "kapsel", "tropfen", "sonstiges"].map((u) => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Vorrat</label>
                  <input type="number" min="0" value={form.vorrat} onChange={(e) => setForm({ ...form, vorrat: +e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Mindestvorrat</label>
                  <input type="number" min="0" value={form.mindestvorrat} onChange={(e) => setForm({ ...form, mindestvorrat: +e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Ablaufdatum</label>
                <input type="date" value={form.ablaufdatum} onChange={(e) => setForm({ ...form, ablaufdatum: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-2">Einnahmezeiten</label>
                <div className="flex gap-2 flex-wrap">
                  {EINNAHME_TIMES.map((z) => (
                    <button key={z} type="button"
                      onClick={() => toggleZeit(z)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                        form.einnahmezeiten.includes(z)
                          ? "bg-red-500 text-white border-red-500"
                          : "bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700"
                      }`}>
                      {z}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Hinweis</label>
                <input value={form.einnahmehinweis} onChange={(e) => setForm({ ...form, einnahmehinweis: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="z.B. Zum Essen nehmen" />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => { setShowForm(false); setForm(emptyForm); }}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  Abbrechen
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition-colors disabled:opacity-50">
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
