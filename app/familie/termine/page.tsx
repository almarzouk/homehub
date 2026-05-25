"use client";

import { useEffect, useState } from "react";
import {
  Calendar, Plus, Trash2, MapPin, Clock, Tag,
  ChevronDown, ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Termin {
  _id: string;
  title: string;
  description?: string;
  date: string;
  time?: string;
  location?: string;
  participants?: string[];
  category: string;
  color: string;
}

const KATEGORIEN = [
  { id: "arzt", label: "Arzt", color: "#EF4444", bg: "#FEF2F2" },
  { id: "schule", label: "Schule", color: "#3B82F6", bg: "#EFF6FF" },
  { id: "freizeit", label: "Freizeit", color: "#10B981", bg: "#ECFDF5" },
  { id: "arbeit", label: "Arbeit", color: "#F59E0B", bg: "#FFFBEB" },
  { id: "sonstiges", label: "Sonstiges", color: "#8B5CF6", bg: "#F5F3FF" },
];

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  today.setHours(0, 0, 0, 0);
  tomorrow.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);

  if (d.getTime() === today.getTime()) return "Heute";
  if (d.getTime() === tomorrow.getTime()) return "Morgen";
  return new Date(dateStr).toLocaleDateString("de-DE", { weekday: "long", day: "2-digit", month: "long" });
}

function isUpcoming(dateStr: string) {
  const d = new Date(dateStr);
  d.setHours(23, 59, 59);
  return d >= new Date();
}

export default function TerminePage() {
  const [termine, setTermine] = useState<Termin[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [showPast, setShowPast] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [form, setForm] = useState({
    title: "", description: "", date: "", time: "", location: "", category: "sonstiges",
  });

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/termine");
      if (res.ok) setTermine(await res.json());
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.date) return;
    setSaving(true);
    try {
      const res = await fetch("/api/termine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setForm({ title: "", description: "", date: "", time: "", location: "", category: "sonstiges" });
        setShowAdd(false);
        load();
      }
    } catch { /* ignore */ }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Termin wirklich löschen?")) return;
    await fetch(`/api/termine/${id}`, { method: "DELETE" });
    load();
  };

  const upcoming = termine.filter((t) => isUpcoming(t.date));
  const past = termine.filter((t) => !isUpcoming(t.date));
  const displayList = showPast ? termine : upcoming;

  const accentColor = KATEGORIEN.find((k) => k.id === form.category)?.color ?? "#3B82F6";

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Familientermine</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {upcoming.length} bevorstehend · {past.length} vergangen
          </p>
        </div>
        <button
          onClick={() => setShowAdd((s) => !s)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm transition-colors shadow-sm"
        >
          <Plus className="h-4 w-4" />
          Termin hinzufügen
        </button>
      </div>

      {/* Add Form */}
      {showAdd && (
        <form onSubmit={handleAdd} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 mb-6 shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Neuer Termin</h2>

          {/* Kategorie pills */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">Kategorie</label>
            <div className="flex flex-wrap gap-2">
              {KATEGORIEN.map((k) => (
                <button key={k.id} type="button" onClick={() => setForm((f) => ({ ...f, category: k.id }))}
                  className={cn("px-3 py-1.5 rounded-full text-xs font-semibold border transition-all",
                    form.category === k.id
                      ? "text-white border-transparent"
                      : "text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800")}
                  style={form.category === k.id ? { backgroundColor: k.color, borderColor: k.color } : {}}>
                  {k.label}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Titel *</label>
            <input required value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="z.B. Arzttermin, Elternabend…"
              className="w-full border rounded-xl px-4 py-3 text-sm font-semibold bg-white dark:bg-gray-900 dark:border-gray-700 dark:text-white focus:outline-none focus:ring-2 transition-shadow"
              style={{ borderColor: form.title ? accentColor + "80" : undefined }}
            />
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Datum *</label>
              <input required type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                className="w-full border rounded-xl px-4 py-3 text-sm bg-white dark:bg-gray-900 dark:border-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Uhrzeit</label>
              <input type="time" value={form.time} onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
                className="w-full border rounded-xl px-4 py-3 text-sm bg-white dark:bg-gray-900 dark:border-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Ort</label>
            <input value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
              placeholder="z.B. Praxis Müller, Schule…"
              className="w-full border rounded-xl px-4 py-3 text-sm bg-white dark:bg-gray-900 dark:border-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Notiz</label>
            <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={2} placeholder="Weitere Informationen…"
              className="w-full border rounded-xl px-4 py-3 text-sm bg-white dark:bg-gray-900 dark:border-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={() => setShowAdd(false)}
              className="flex-1 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800">
              Abbrechen
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors disabled:opacity-70"
              style={{ backgroundColor: accentColor }}>
              {saving ? "Speichern…" : "Termin speichern"}
            </button>
          </div>
        </form>
      )}

      {/* Past toggle */}
      {past.length > 0 && (
        <button onClick={() => setShowPast((s) => !s)}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mb-4">
          {showPast ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          {showPast ? "Vergangene ausblenden" : `${past.length} vergangene Termine anzeigen`}
        </button>
      )}

      {/* Termine list */}
      {loading ? (
        <div className="text-center py-16 text-gray-400">Lade Termine…</div>
      ) : displayList.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-blue-50 dark:bg-blue-950 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Calendar className="h-8 w-8 text-blue-500" />
          </div>
          <p className="text-gray-500 dark:text-gray-400 font-medium">Keine Termine vorhanden</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Klicke auf &quot;Termin hinzufügen&quot; um loszulegen</p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayList.map((termin) => {
            const kat = KATEGORIEN.find((k) => k.id === termin.category) ?? KATEGORIEN[4];
            const isPast = !isUpcoming(termin.date);
            return (
              <div key={termin._id}
                className={cn("flex gap-0 rounded-2xl overflow-hidden border transition-all",
                  isPast ? "border-gray-200 dark:border-gray-800 opacity-60" : "border-gray-200 dark:border-gray-800 hover:shadow-md")}>
                {/* Color bar */}
                <div className="w-1 flex-shrink-0" style={{ backgroundColor: isPast ? "#D1D5DB" : kat.color }} />

                <div className="flex-1 bg-white dark:bg-gray-900 p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: (isPast ? "#E5E7EB" : kat.color) + "20" }}>
                      <Tag className="h-5 w-5" style={{ color: isPast ? "#9CA3AF" : kat.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-bold text-gray-900 dark:text-white text-sm">{termin.title}</p>
                          <div className="flex items-center gap-3 mt-1 flex-wrap">
                            <span className="flex items-center gap-1 text-xs font-semibold"
                              style={{ color: isPast ? "#9CA3AF" : kat.color }}>
                              <Clock className="h-3 w-3" />
                              {formatDate(termin.date)}{termin.time ? ` · ${termin.time} Uhr` : ""}
                            </span>
                            {termin.location && (
                              <span className="flex items-center gap-1 text-xs text-gray-500">
                                <MapPin className="h-3 w-3" />
                                {termin.location}
                              </span>
                            )}
                          </div>
                          {termin.description && (
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5 leading-relaxed line-clamp-2">
                              {termin.description}
                            </p>
                          )}
                        </div>
                        <button onClick={() => handleDelete(termin._id)}
                          className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950 text-gray-400 hover:text-red-500 transition-colors flex-shrink-0">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Category badge */}
                  <div className="mt-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold"
                      style={{ backgroundColor: (isPast ? "#E5E7EB" : kat.color) + "20", color: isPast ? "#9CA3AF" : kat.color }}>
                      {kat.label}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
