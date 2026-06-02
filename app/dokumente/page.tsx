"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Trash2, FileText, AlertTriangle, Eye, X, Calendar } from "lucide-react";

interface Dokument {
  _id: string;
  titel: string;
  kategorie: "vertrag" | "garantie" | "versicherung" | "ausweis" | "gesundheit" | "sonstiges";
  beschreibung?: string;
  bild: string;
  ablaufdatum?: string;
  createdAt: string;
}

const KAT_COLOR: Record<string, string> = {
  vertrag: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
  garantie: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400",
  versicherung: "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400",
  ausweis: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400",
  gesundheit: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
  sonstiges: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
};

const KATEGORIEN = ["alle", "vertrag", "garantie", "versicherung", "ausweis", "gesundheit", "sonstiges"] as const;

const emptyForm = {
  titel: "",
  kategorie: "sonstiges" as Dokument["kategorie"],
  beschreibung: "",
  ablaufdatum: "",
};

export default function DokumentePage() {
  const [dokumente, setDokumente] = useState<Dokument[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<string>("alle");
  const [viewer, setViewer] = useState<Dokument | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/dokumente");
    const data = await res.json();
    setDokumente(data.dokumente ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const del = async (id: string) => {
    if (!confirm("Dokument löschen?")) return;
    await fetch(`/api/dokumente/${id}`, { method: "DELETE" });
    load();
    if (viewer?._id === id) setViewer(null);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImageBase64(reader.result as string);
    reader.readAsDataURL(file);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageBase64) return alert("Bitte ein Bild hochladen.");
    setSaving(true);
    await fetch("/api/dokumente", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        bild: imageBase64,
        ablaufdatum: form.ablaufdatum || undefined,
      }),
    });
    setSaving(false);
    setShowForm(false);
    setForm(emptyForm);
    setImageBase64(null);
    load();
  };

  const isExpired = (d: Dokument) =>
    d.ablaufdatum && new Date(d.ablaufdatum) < new Date();

  const expiredCount = dokumente.filter(isExpired).length;

  const gefiltert = filter === "alle" ? dokumente : dokumente.filter((d) => d.kategorie === filter);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dokumente</h1>
          <p className="text-sm text-gray-500">{dokumente.length} Dokumente</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors">
          <Plus className="h-4 w-4" /> Dokument
        </button>
      </div>

      {/* Alert */}
      {expiredCount > 0 && (
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900">
          <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm font-medium text-red-700 dark:text-red-400">
            {expiredCount} {expiredCount === 1 ? "Dokument" : "Dokumente"} abgelaufen
          </p>
        </div>
      )}

      {/* Category filter */}
      <div className="flex flex-wrap gap-2">
        {KATEGORIEN.map((k) => (
          <button key={k} onClick={() => setFilter(k)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors capitalize ${
              filter === k
                ? "bg-gray-800 text-white dark:bg-white dark:text-gray-900 border-transparent"
                : "bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700"
            }`}>
            {k === "alle" ? "Alle" : k}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : gefiltert.length === 0 ? (
        <div className="text-center py-20">
          <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Keine Dokumente</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {gefiltert.map((d) => (
            <div key={d._id}
              className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden group cursor-pointer"
              onClick={() => setViewer(d)}>
              {/* Thumbnail */}
              <div className="relative h-36 bg-gray-100 dark:bg-gray-800">
                <img src={d.bild} alt={d.titel} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                  <Eye className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                {isExpired(d) && (
                  <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    Abgelaufen
                  </div>
                )}
              </div>
              {/* Info */}
              <div className="p-3">
                <p className="font-semibold text-sm text-gray-900 dark:text-white truncate">{d.titel}</p>
                <div className="flex items-center justify-between mt-1.5">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${KAT_COLOR[d.kategorie]}`}>
                    {d.kategorie}
                  </span>
                  <button onClick={(e) => { e.stopPropagation(); del(d._id); }}
                    className="text-gray-300 hover:text-red-500 transition-colors p-1">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                {d.ablaufdatum && (
                  <p className={`text-xs mt-1.5 flex items-center gap-1 ${isExpired(d) ? "text-red-500" : "text-gray-400"}`}>
                    <Calendar className="h-3 w-3" />
                    {new Date(d.ablaufdatum).toLocaleDateString("de-DE")}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Document Viewer Modal */}
      {viewer && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800">
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white">{viewer.titel}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${KAT_COLOR[viewer.kategorie]}`}>
                    {viewer.kategorie}
                  </span>
                  {viewer.ablaufdatum && (
                    <span className={`text-xs ${isExpired(viewer) ? "text-red-500 font-semibold" : "text-gray-400"}`}>
                      bis {new Date(viewer.ablaufdatum).toLocaleDateString("de-DE")}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => del(viewer._id)}
                  className="p-2 rounded-xl bg-red-50 dark:bg-red-950/30 text-red-500 hover:bg-red-100 transition-colors">
                  <Trash2 className="h-4 w-4" />
                </button>
                <button onClick={() => setViewer(null)}
                  className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200 transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="overflow-y-auto flex-1">
              <img src={viewer.bild} alt={viewer.titel} className="w-full object-contain" />
              {viewer.beschreibung && (
                <p className="p-4 text-sm text-gray-500">{viewer.beschreibung}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Upload Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Neues Dokument</h2>
            <form onSubmit={save} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Titel *</label>
                <input required value={form.titel} onChange={(e) => setForm({ ...form, titel: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="z.B. Mietvertrag 2024" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Kategorie</label>
                  <select value={form.kategorie} onChange={(e) => setForm({ ...form, kategorie: e.target.value as Dokument["kategorie"] })}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {["vertrag","garantie","versicherung","ausweis","gesundheit","sonstiges"].map((k) => (
                      <option key={k} value={k}>{k}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Gültig bis</label>
                  <input type="date" value={form.ablaufdatum} onChange={(e) => setForm({ ...form, ablaufdatum: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Beschreibung</label>
                <textarea value={form.beschreibung} onChange={(e) => setForm({ ...form, beschreibung: e.target.value })}
                  rows={2} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Bild / Foto *</label>
                <input type="file" accept="image/*" onChange={handleImageChange}
                  className="w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                {imageBase64 && (
                  <img src={imageBase64} alt="Vorschau" className="mt-2 w-full h-40 object-cover rounded-xl" />
                )}
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => { setShowForm(false); setForm(emptyForm); setImageBase64(null); }}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  Abbrechen
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium transition-colors disabled:opacity-50">
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
