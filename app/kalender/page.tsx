"use client";

import { useEffect, useState, useCallback } from "react";
import { ChevronLeft, ChevronRight, Plus, Calendar, Clock, MapPin, Tag, Trash2 } from "lucide-react";

interface Termin {
  _id: string;
  title: string;
  description?: string;
  date: string;
  time?: string;
  location?: string;
  category: string;
  color?: string;
}

const KATEGORIE_FARBEN: Record<string, string> = {
  arzt: "bg-red-500",
  schule: "bg-blue-500",
  freizeit: "bg-green-500",
  arbeit: "bg-orange-500",
  sonstiges: "bg-gray-500",
  urlaub: "bg-purple-500",
  feiertag: "bg-yellow-500",
};

const KATEGORIEN = ["arzt", "schule", "freizeit", "arbeit", "urlaub", "feiertag", "sonstiges"];
const WOCHENTAGE = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
const MONATE = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];

const emptyForm = { title: "", description: "", date: "", time: "", location: "", category: "sonstiges" };

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  const d = new Date(year, month, 1).getDay();
  return d === 0 ? 6 : d - 1; // Monday = 0
}

export default function KalenderPage() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [termine, setTermine] = useState<Termin[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    // Load all termine and filter client-side for current month
    const res = await fetch("/api/termine");
    const data = await res.json();
    setTermine(Array.isArray(data) ? data : []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
    setSelectedDay(null);
  };
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
    setSelectedDay(null);
  };

  const termineThisMonth = termine.filter((t) => {
    const d = new Date(t.date);
    return d.getFullYear() === year && d.getMonth() === month;
  });

  const termineByDay: Record<number, Termin[]> = {};
  for (const t of termineThisMonth) {
    const day = new Date(t.date).getDate();
    if (!termineByDay[day]) termineByDay[day] = [];
    termineByDay[day].push(t);
  }

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const selectedTermine = selectedDay ? (termineByDay[selectedDay] ?? []) : [];

  const addTermin = async () => {
    if (!form.title || !form.date) return;
    setSaving(true);
    const res = await fetch("/api/termine", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) { setForm(emptyForm); setShowForm(false); load(); }
    setSaving(false);
  };

  const deleteTermin = async (id: string) => {
    await fetch(`/api/termine/${id}`, { method: "DELETE" });
    load();
  };

  const handleDayClick = (day: number) => {
    setSelectedDay(day === selectedDay ? null : day);
    const iso = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    setForm((f) => ({ ...f, date: iso }));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Haushaltskalender</h1>
          <p className="text-sm text-gray-500">Termine und Ereignisse im Überblick</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors">
          <Plus className="h-4 w-4" />
          Termin
        </button>
      </div>

      {showForm && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 space-y-4">
          <h2 className="font-semibold text-gray-900 dark:text-white">Neuer Termin</h2>
          <div className="grid grid-cols-2 gap-3">
            <input className="col-span-2 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Titel *" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <input type="date" className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            <input type="time" className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} />
            <input className="col-span-2 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Ort (optional)" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
            <select className="col-span-2 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {KATEGORIEN.map((k) => <option key={k} value={k}>{k.charAt(0).toUpperCase() + k.slice(1)}</option>)}
            </select>
            <textarea className="col-span-2 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" rows={2} placeholder="Beschreibung (optional)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowForm(false)} className="flex-1 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-600 dark:text-gray-400">Abbrechen</button>
            <button onClick={addTermin} disabled={saving || !form.title || !form.date} className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-xl text-sm font-medium">{saving ? "Speichere..." : "Hinzufügen"}</button>
          </div>
        </div>
      )}

      {/* Calendar grid */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <ChevronLeft className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          </button>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {MONATE[month]} {year}
          </h2>
          <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <ChevronRight className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        <div className="grid grid-cols-7 border-b border-gray-100 dark:border-gray-800">
          {WOCHENTAGE.map((d) => (
            <div key={d} className="py-2 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">{d}</div>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-7">
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} className="min-h-[80px] border-b border-r border-gray-50 dark:border-gray-800" />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
              const isSelected = day === selectedDay;
              const dayTermine = termineByDay[day] ?? [];
              return (
                <div
                  key={day}
                  onClick={() => handleDayClick(day)}
                  className={`min-h-[80px] border-b border-r border-gray-50 dark:border-gray-800 p-1.5 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors ${isSelected ? "bg-blue-50 dark:bg-blue-950/40" : ""}`}
                >
                  <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-sm mb-1 ${isToday ? "bg-blue-600 text-white font-bold" : "text-gray-700 dark:text-gray-300"}`}>
                    {day}
                  </span>
                  <div className="space-y-0.5">
                    {dayTermine.slice(0, 2).map((t) => (
                      <div key={t._id} className={`text-xs px-1 py-0.5 rounded text-white truncate ${KATEGORIE_FARBEN[t.category] ?? "bg-gray-400"}`}>
                        {t.title}
                      </div>
                    ))}
                    {dayTermine.length > 2 && (
                      <div className="text-xs text-gray-500">+{dayTermine.length - 2}</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Selected day details */}
      {selectedDay && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
            {selectedDay}. {MONATE[month]} {year}
          </h3>
          {selectedTermine.length === 0 ? (
            <p className="text-sm text-gray-500">Keine Termine an diesem Tag.</p>
          ) : (
            <div className="space-y-2">
              {selectedTermine.map((t) => (
                <div key={t._id} className="flex items-start gap-3 p-3 rounded-xl border border-gray-100 dark:border-gray-800">
                  <span className={`w-3 h-3 rounded-full mt-1 flex-shrink-0 ${KATEGORIE_FARBEN[t.category] ?? "bg-gray-400"}`} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white text-sm">{t.title}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      {t.time && <span className="flex items-center gap-1 text-xs text-gray-500"><Clock className="h-3 w-3" />{t.time}</span>}
                      {t.location && <span className="flex items-center gap-1 text-xs text-gray-500"><MapPin className="h-3 w-3" />{t.location}</span>}
                      <span className="flex items-center gap-1 text-xs text-gray-500"><Tag className="h-3 w-3" />{t.category}</span>
                    </div>
                    {t.description && <p className="text-xs text-gray-500 mt-1">{t.description}</p>}
                  </div>
                  <button onClick={() => deleteTermin(t._id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950 text-red-400 hover:text-red-600 transition-colors flex-shrink-0">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
