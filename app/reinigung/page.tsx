"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Trash2, CheckCircle, Circle, Sparkles, Calendar, User, RefreshCw } from "lucide-react";

interface Reinigung {
  _id: string;
  bereich: string;
  aufgabe: string;
  haeufigkeit: string;
  zugewiesen?: string;
  naechsteFaelligkeit?: string;
  letzteErledigung?: string;
  erledigt: boolean;
  notizen?: string;
}

const HAEUFIGKEIT_LABEL: Record<string, string> = {
  taeglich: "Täglich",
  woechentlich: "Wöchentlich",
  zweiwochentlich: "Alle 2 Wochen",
  monatlich: "Monatlich",
  vierteljaehrlich: "Vierteljährlich",
};

const HAEUFIGKEIT_COLOR: Record<string, string> = {
  taeglich: "text-red-600 bg-red-50 dark:bg-red-950 dark:text-red-400",
  woechentlich: "text-orange-600 bg-orange-50 dark:bg-orange-950 dark:text-orange-400",
  zweiwochentlich: "text-yellow-600 bg-yellow-50 dark:bg-yellow-950 dark:text-yellow-400",
  monatlich: "text-blue-600 bg-blue-50 dark:bg-blue-950 dark:text-blue-400",
  vierteljaehrlich: "text-purple-600 bg-purple-50 dark:bg-purple-950 dark:text-purple-400",
};

const emptyForm = { bereich: "", aufgabe: "", haeufigkeit: "woechentlich", zugewiesen: "", naechsteFaelligkeit: "", notizen: "" };

function formatDate(str?: string) {
  if (!str) return null;
  return new Date(str).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function isOverdue(naechste?: string) {
  if (!naechste) return false;
  return new Date(naechste) < new Date();
}

export default function ReinigungPage() {
  const [items, setItems] = useState<Reinigung[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState("alle");

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/reinigung");
    const data = await res.json();
    setItems(Array.isArray(data) ? data : []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const addItem = async () => {
    if (!form.bereich || !form.aufgabe) return;
    setSaving(true);
    const res = await fetch("/api/reinigung", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        naechsteFaelligkeit: form.naechsteFaelligkeit || undefined,
      }),
    });
    if (res.ok) { setForm(emptyForm); setShowForm(false); load(); }
    setSaving(false);
  };

  const toggleErledigt = async (item: Reinigung) => {
    const now = new Date().toISOString();
    await fetch(`/api/reinigung/${item._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        erledigt: !item.erledigt,
        letzteErledigung: !item.erledigt ? now : undefined,
      }),
    });
    load();
  };

  const deleteItem = async (id: string) => {
    await fetch(`/api/reinigung/${id}`, { method: "DELETE" });
    load();
  };

  const bereiche = [...new Set(items.map((i) => i.bereich))];
  const filtered = filter === "alle" ? items : filter === "faellig" ? items.filter((i) => isOverdue(i.naechsteFaelligkeit) && !i.erledigt) : items.filter((i) => i.bereich === filter);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reinigungsplan</h1>
          <p className="text-sm text-gray-500">Aufgaben nach Bereich und Häufigkeit</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors">
          <Plus className="h-4 w-4" />
          Aufgabe
        </button>
      </div>

      {showForm && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 space-y-4">
          <h2 className="font-semibold text-gray-900 dark:text-white">Neue Aufgabe</h2>
          <div className="grid grid-cols-2 gap-3">
            <input className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" placeholder="Bereich *" value={form.bereich} onChange={(e) => setForm({ ...form, bereich: e.target.value })} list="bereiche-list" />
            <datalist id="bereiche-list">{bereiche.map((b) => <option key={b} value={b} />)}</datalist>
            <input className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" placeholder="Aufgabe *" value={form.aufgabe} onChange={(e) => setForm({ ...form, aufgabe: e.target.value })} />
            <select className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" value={form.haeufigkeit} onChange={(e) => setForm({ ...form, haeufigkeit: e.target.value })}>
              {Object.entries(HAEUFIGKEIT_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <input className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" placeholder="Zugewiesen an (optional)" value={form.zugewiesen} onChange={(e) => setForm({ ...form, zugewiesen: e.target.value })} />
            <input type="date" className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" value={form.naechsteFaelligkeit} onChange={(e) => setForm({ ...form, naechsteFaelligkeit: e.target.value })} />
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowForm(false)} className="flex-1 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-600 dark:text-gray-400">Abbrechen</button>
            <button onClick={addItem} disabled={saving || !form.bereich || !form.aufgabe} className="flex-1 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-60 text-white rounded-xl text-sm font-medium">{saving ? "Speichere..." : "Hinzufügen"}</button>
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {["alle", "faellig", ...bereiche].map((b) => (
          <button key={b} onClick={() => setFilter(b)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filter === b ? "bg-cyan-600 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"}`}>
            {b === "alle" ? "Alle" : b === "faellig" ? "Fällig" : b}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20"><Sparkles className="h-12 w-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-500">Keine Aufgaben gefunden.</p></div>
      ) : (
        <div className="space-y-2">
          {filtered.map((item) => (
            <div key={item._id} className={`bg-white dark:bg-gray-900 rounded-2xl border overflow-hidden transition-all ${item.erledigt ? "border-gray-100 dark:border-gray-800 opacity-60" : isOverdue(item.naechsteFaelligkeit) ? "border-red-200 dark:border-red-800" : "border-gray-100 dark:border-gray-800"}`}>
              <div className="flex items-center gap-4 px-4 py-3">
                <button onClick={() => toggleErledigt(item)} className="flex-shrink-0 text-cyan-600">
                  {item.erledigt ? <CheckCircle className="h-5 w-5" /> : <Circle className="h-5 w-5 text-gray-300" />}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className={`font-medium text-sm ${item.erledigt ? "line-through text-gray-400" : "text-gray-900 dark:text-white"}`}>{item.aufgabe}</p>
                    <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">{item.bereich}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${HAEUFIGKEIT_COLOR[item.haeufigkeit] ?? ""}`}>{HAEUFIGKEIT_LABEL[item.haeufigkeit] ?? item.haeufigkeit}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    {item.zugewiesen && <span className="flex items-center gap-1 text-xs text-gray-500"><User className="h-3 w-3" />{item.zugewiesen}</span>}
                    {item.naechsteFaelligkeit && <span className={`flex items-center gap-1 text-xs ${isOverdue(item.naechsteFaelligkeit) && !item.erledigt ? "text-red-500" : "text-gray-500"}`}><Calendar className="h-3 w-3" />Fällig: {formatDate(item.naechsteFaelligkeit)}</span>}
                    {item.letzteErledigung && <span className="flex items-center gap-1 text-xs text-gray-400"><RefreshCw className="h-3 w-3" />Zuletzt: {formatDate(item.letzteErledigung)}</span>}
                  </div>
                </div>
                <button onClick={() => deleteItem(item._id)} className="p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-950 text-red-400 hover:text-red-600 transition-colors flex-shrink-0">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
