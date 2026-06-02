"use client";

import { useEffect, useState, useCallback, Fragment } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Plus, CheckCircle2, Circle, Trash2, Home, RefreshCw, Calendar, AlertTriangle,
} from "lucide-react";

interface Aufgabe {
  _id: string;
  titel: string;
  beschreibung?: string;
  kategorie: "reinigung" | "wartung" | "einkauf" | "sonstiges";
  prioritaet: "hoch" | "mittel" | "niedrig";
  erledigt: boolean;
  wiederholung: "taeglich" | "woechentlich" | "monatlich" | "nein";
  faelligAm?: string;
  erledigtAm?: string;
}

const KATEGORIEN_KEYS = ["alle", "reinigung", "wartung", "einkauf", "sonstiges"] as const;

const PRIORITAET_COLOR: Record<string, string> = {
  hoch: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
  mittel: "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400",
  niedrig: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400",
};

const KAT_COLOR: Record<string, string> = {
  reinigung: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
  wartung: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400",
  einkauf: "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400",
  sonstiges: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
};

const WIEDER_KEYS = ["taeglich", "woechentlich", "monatlich", "nein"] as const;

const emptyForm = {
  titel: "",
  beschreibung: "",
  kategorie: "reinigung" as Aufgabe["kategorie"],
  prioritaet: "mittel" as Aufgabe["prioritaet"],
  wiederholung: "nein" as Aufgabe["wiederholung"],
  faelligAm: "",
};

export default function HaushaltPage() {
  const { t } = useTranslation();
  const { lang } = useLanguage();
  const [aufgaben, setAufgaben] = useState<Aufgabe[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<string>("alle");
  const [nurOffen, setNurOffen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (nurOffen) params.set("erledigt", "false");
    if (filter !== "alle") params.set("kategorie", filter);
    const res = await fetch(`/api/haushalt?${params}`);
    const data = await res.json();
    setAufgaben(data.aufgaben ?? []);
    setLoading(false);
  }, [nurOffen, filter]);

  useEffect(() => { load(); }, [load]);

  const toggle = async (a: Aufgabe) => {
    await fetch(`/api/haushalt/${a._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ erledigt: !a.erledigt }),
    });
    load();
  };

  const del = async (id: string) => {
    if (!confirm(t("haushalt.deleteTask"))) return;
    await fetch(`/api/haushalt/${id}`, { method: "DELETE" });
    load();
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/haushalt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, faelligAm: form.faelligAm || undefined }),
    });
    setSaving(false);
    setShowForm(false);
    setForm(emptyForm);
    load();
  };

  const erledigt = aufgaben.filter((a) => a.erledigt).length;
  const offen = aufgaben.filter((a) => !a.erledigt).length;

  const isOverdue = (a: Aufgabe) =>
    !a.erledigt && a.faelligAm && new Date(a.faelligAm) < new Date();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t("haushalt.title")}</h1>
          <p className="text-sm text-gray-500">{offen} {t("haushalt.open")} · {erledigt} {t("haushalt.done")}</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
        >
          <Plus className="h-4 w-4" /> {t("haushalt.newTask")}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: t("haushalt.total"), value: aufgaben.length, color: "text-gray-700 dark:text-gray-200" },
          { label: t("haushalt.pending"), value: offen, color: "text-orange-600 dark:text-orange-400" },
          { label: t("haushalt.completed"), value: erledigt, color: "text-emerald-600 dark:text-emerald-400" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 text-center">
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-gray-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <button
          onClick={() => setNurOffen((v) => !v)}
          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
            nurOffen
              ? "bg-cyan-500 text-white border-cyan-500"
              : "bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700"
          }`}
        >
          {t("haushalt.onlyOpen")}
        </button>
        {KATEGORIEN_KEYS.map((id) => (
          <button
            key={id}
            onClick={() => setFilter(id)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              filter === id
                ? "bg-gray-800 text-white dark:bg-white dark:text-gray-900 border-transparent"
                : "bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700"
            }`}
          >
            {id === "alle" ? t("haushalt.all") : t(`haushalt.categories.${id}`)}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : aufgaben.length === 0 ? (
        <div className="text-center py-20">
          <Home className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">{t("haushalt.noTasks")}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {aufgaben.map((a) => (
            <div
              key={a._id}
              className={`flex items-start gap-3 p-4 rounded-2xl border transition-colors ${
                a.erledigt
                  ? "bg-gray-50 dark:bg-gray-900/50 border-gray-100 dark:border-gray-800 opacity-60"
                  : "bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800"
              }`}
            >
              <button onClick={() => toggle(a)} className="mt-0.5 flex-shrink-0">
                {a.erledigt
                  ? <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  : <Circle className="h-5 w-5 text-gray-300 hover:text-cyan-500 transition-colors" />}
              </button>
              <div className="flex-1 min-w-0">
                <p className={`font-medium text-sm ${a.erledigt ? "line-through text-gray-400" : "text-gray-900 dark:text-white"}`}>
                  {a.titel}
                </p>
                {a.beschreibung && (
                  <p className="text-xs text-gray-500 mt-0.5 truncate">{a.beschreibung}</p>
                )}
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${KAT_COLOR[a.kategorie]}`}>
                    {t(`haushalt.categories.${a.kategorie}`)}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${PRIORITAET_COLOR[a.prioritaet]}`}>
                    {t(`haushalt.priority.${a.prioritaet}`)}
                  </span>
                  {a.wiederholung !== "nein" && (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                      <RefreshCw className="h-3 w-3" />{t(`haushalt.repeat.${a.wiederholung}`)}
                    </span>
                  )}
                  {a.faelligAm && (
                    <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                      isOverdue(a)
                        ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400"
                        : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                    }`}>
                      {isOverdue(a) && <AlertTriangle className="h-3 w-3" />}
                      <Calendar className="h-3 w-3" />
                      {new Date(a.faelligAm).toLocaleDateString(lang)}
                    </span>
                  )}
                </div>
              </div>
              <button onClick={() => del(a._id)} className="flex-shrink-0 text-gray-300 hover:text-red-500 transition-colors">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">{t("haushalt.newTask")}</h2>
            <form onSubmit={save} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">{t("haushalt.title")} *</label>
                <input required value={form.titel} onChange={(e) => setForm({ ...form, titel: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  placeholder="z.B. Küche putzen" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">{t("common.description")}</label>
                <textarea value={form.beschreibung} onChange={(e) => setForm({ ...form, beschreibung: e.target.value })}
                  rows={2} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">{t("common.category")}</label>
                  <select value={form.kategorie} onChange={(e) => setForm({ ...form, kategorie: e.target.value as Aufgabe["kategorie"] })}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500">
                    <option value="reinigung">{t("haushalt.categories.reinigung")}</option>
                    <option value="wartung">{t("haushalt.categories.wartung")}</option>
                    <option value="einkauf">{t("haushalt.categories.einkauf")}</option>
                    <option value="sonstiges">{t("haushalt.categories.sonstiges")}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">{t("haushalt.priorityLabel") || "Priorität"}</label>
                  <select value={form.prioritaet} onChange={(e) => setForm({ ...form, prioritaet: e.target.value as Aufgabe["prioritaet"] })}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500">
                    <option value="hoch">{t("haushalt.priority.hoch")}</option>
                    <option value="mittel">{t("haushalt.priority.mittel")}</option>
                    <option value="niedrig">{t("haushalt.priority.niedrig")}</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">{t("haushalt.repeatLabel")}</label>
                  <select value={form.wiederholung} onChange={(e) => setForm({ ...form, wiederholung: e.target.value as Aufgabe["wiederholung"] })}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500">
                    <option value="nein">{t("haushalt.repeat.nein")}</option>
                    <option value="taeglich">{t("haushalt.repeat.taeglich")}</option>
                    <option value="woechentlich">{t("haushalt.repeat.woechentlich")}</option>
                    <option value="monatlich">{t("haushalt.repeat.monatlich")}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">{t("haushalt.dueDate")}</label>
                  <input type="date" value={form.faelligAm} onChange={(e) => setForm({ ...form, faelligAm: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" />
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => { setShowForm(false); setForm(emptyForm); }}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  {t("common.cancel")}
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white text-sm font-medium transition-colors disabled:opacity-50">
                  {saving ? t("haushalt.saving") : t("common.save")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
