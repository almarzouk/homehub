"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { Plus, Trash2, Edit2, X, Check, Plane, MapPin, Calendar, Euro, Users, CheckCircle2, Circle, ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface CheckItem { _id: string; text: string; erledigt: boolean; }
interface Reise {
  _id: string;
  name: string;
  ziel: string;
  startDatum?: string;
  endDatum?: string;
  budget?: number;
  waehrung: string;
  teilnehmer?: string;
  notizen?: string;
  checkliste: CheckItem[];
  status: "geplant" | "aktiv" | "abgeschlossen";
}

const STATUS_COLORS: Record<string, string> = {
  geplant: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  aktiv: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300",
  abgeschlossen: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
};

const emptyForm = {
  name: "", ziel: "", startDatum: "", endDatum: "",
  budget: "", waehrung: "EUR", teilnehmer: "", notizen: "",
  status: "geplant" as Reise["status"],
};

function fmt(iso?: string) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString([], { day: "2-digit", month: "2-digit", year: "numeric" });
}

function nights(start?: string, end?: string) {
  if (!start || !end) return null;
  const diff = (new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60 * 60 * 24);
  return diff > 0 ? Math.round(diff) : null;
}

export default function ReisenPage() {
  const { t } = useTranslation();
  const [reisen, setReisen] = useState<Reise[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [newItem, setNewItem] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/reisen");
    const data = await res.json();
    setReisen(data.reisen ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const openNew = () => {
    setEditId(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (r: Reise) => {
    setEditId(r._id);
    setForm({
      name: r.name, ziel: r.ziel,
      startDatum: r.startDatum ? new Date(r.startDatum).toISOString().slice(0, 10) : "",
      endDatum: r.endDatum ? new Date(r.endDatum).toISOString().slice(0, 10) : "",
      budget: r.budget?.toString() ?? "",
      waehrung: r.waehrung,
      teilnehmer: r.teilnehmer ?? "",
      notizen: r.notizen ?? "",
      status: r.status,
    });
    setShowForm(true);
  };

  const save = async () => {
    if (!form.name || !form.ziel) return;
    setSaving(true);
    const body: Record<string, unknown> = {
      name: form.name, ziel: form.ziel, waehrung: form.waehrung, status: form.status,
      startDatum: form.startDatum || undefined,
      endDatum: form.endDatum || undefined,
      budget: form.budget ? parseFloat(form.budget) : undefined,
      teilnehmer: form.teilnehmer || undefined,
      notizen: form.notizen || undefined,
    };
    const url = editId ? `/api/reisen/${editId}` : "/api/reisen";
    const method = editId ? "PATCH" : "POST";
    await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setShowForm(false);
    setSaving(false);
    load();
  };

  const del = async (id: string) => {
    if (!confirm(t("common.confirm"))) return;
    await fetch(`/api/reisen/${id}`, { method: "DELETE" });
    load();
  };

  const addCheckItem = async (reiseId: string) => {
    const text = newItem[reiseId]?.trim();
    if (!text) return;
    await fetch(`/api/reisen/${reiseId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ checkItem: { text } }),
    });
    setNewItem(prev => ({ ...prev, [reiseId]: "" }));
    load();
  };

  const toggleItem = async (reiseId: string, itemId: string) => {
    await fetch(`/api/reisen/${reiseId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ toggleItem: itemId }),
    });
    load();
  };

  const deleteItem = async (reiseId: string, itemId: string) => {
    await fetch(`/api/reisen/${reiseId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deleteItem: itemId }),
    });
    load();
  };

  const toggleExpand = (id: string) => setExpanded(prev => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 bg-gradient-to-br from-sky-400 to-blue-600 rounded-2xl flex items-center justify-center shadow-sm">
            <Plane className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t("reisen.title")}</h1>
            <p className="text-sm text-gray-500">{reisen.length} {t("reisen.trips")}</p>
          </div>
        </div>
        <button onClick={openNew}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm font-medium shadow-sm transition-colors">
          <Plus className="h-4 w-4" /> {t("reisen.addTrip")}
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : reisen.length === 0 ? (
        <div className="text-center py-20">
          <Plane className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 mb-4">{t("reisen.empty")}</p>
          <button onClick={openNew} className="px-4 py-2 bg-blue-500 text-white rounded-xl text-sm font-medium hover:bg-blue-600 transition-colors">
            {t("reisen.addTrip")}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {reisen.map((r) => {
            const isExpanded = expanded.has(r._id);
            const done = r.checkliste.filter(c => c.erledigt).length;
            const total = r.checkliste.length;
            const n = nights(r.startDatum, r.endDatum);
            return (
              <div key={r._id} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
                {/* Trip header */}
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-base font-bold text-gray-900 dark:text-white truncate">{r.name}</h3>
                        <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-medium flex-shrink-0", STATUS_COLORS[r.status])}>
                          {t(`reisen.status.${r.status}`)}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400">
                        <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{r.ziel}</span>
                        {r.startDatum && <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{fmt(r.startDatum)}{r.endDatum && ` → ${fmt(r.endDatum)}`}{n && ` (${n} ${t("reisen.nights")})`}</span>}
                        {r.budget && <span className="flex items-center gap-1"><Euro className="h-3 w-3" />{r.budget} {r.waehrung}</span>}
                        {r.teilnehmer && <span className="flex items-center gap-1"><Users className="h-3 w-3" />{r.teilnehmer}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button onClick={() => openEdit(r)} className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors">
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button onClick={() => del(r._id)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Checklist toggle */}
                  <button onClick={() => toggleExpand(r._id)}
                    className="flex items-center gap-2 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
                    {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                    {t("reisen.checklist")} {total > 0 && <span dir="ltr" className="text-gray-400">({done}/{total})</span>}
                    {total > 0 && (
                      <div className="flex-1 max-w-24 h-1 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(done / total) * 100}%` }} />
                      </div>
                    )}
                  </button>
                </div>

                {/* Checklist */}
                {isExpanded && (
                  <div className="border-t border-gray-50 dark:border-gray-800">
                    {r.checkliste.map((item) => (
                      <div key={item._id} className={cn("flex items-center gap-3 px-5 py-2.5", item.erledigt && "opacity-60")}>
                        <button onClick={() => toggleItem(r._id, item._id)} className="flex-shrink-0">
                          {item.erledigt ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Circle className="h-4 w-4 text-gray-300 dark:text-gray-600" />}
                        </button>
                        <span className={cn("flex-1 text-sm", item.erledigt ? "line-through text-gray-400" : "text-gray-900 dark:text-white")}>
                          {item.text}
                        </span>
                        <button onClick={() => deleteItem(r._id, item._id)} className="p-1 rounded text-gray-300 hover:text-red-500 transition-colors">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                    <div className="flex gap-2 px-5 py-3 border-t border-gray-50 dark:border-gray-800">
                      <input
                        type="text"
                        value={newItem[r._id] ?? ""}
                        onChange={e => setNewItem(prev => ({ ...prev, [r._id]: e.target.value }))}
                        onKeyDown={e => { if (e.key === "Enter") addCheckItem(r._id); }}
                        placeholder={t("reisen.addItem")}
                        className="flex-1 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white placeholder:text-gray-400"
                      />
                      <button onClick={() => addCheckItem(r._id)} className="p-1.5 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors">
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 dark:bg-black/60 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800 sticky top-0 bg-white dark:bg-gray-900">
              <h2 className="font-semibold text-gray-900 dark:text-white">
                {editId ? t("reisen.editTrip") : t("reisen.addTrip")}
              </h2>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">{t("reisen.tripName")} *</label>
                <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder={t("reisen.tripNamePlaceholder")}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">{t("reisen.destination")} *</label>
                <input type="text" value={form.ziel} onChange={e => setForm(f => ({ ...f, ziel: e.target.value }))} placeholder={t("reisen.destinationPlaceholder")}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white" />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-xs font-medium text-gray-500 mb-1 block">{t("reisen.startDate")}</label>
                  <input type="date" value={form.startDatum} onChange={e => setForm(f => ({ ...f, startDatum: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white" />
                </div>
                <div className="flex-1">
                  <label className="text-xs font-medium text-gray-500 mb-1 block">{t("reisen.endDate")}</label>
                  <input type="date" value={form.endDatum} onChange={e => setForm(f => ({ ...f, endDatum: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white" />
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-xs font-medium text-gray-500 mb-1 block">{t("reisen.budget")}</label>
                  <input type="number" value={form.budget} onChange={e => setForm(f => ({ ...f, budget: e.target.value }))} min="0" placeholder="0"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white" />
                </div>
                <div className="w-24">
                  <label className="text-xs font-medium text-gray-500 mb-1 block">{t("reisen.currency")}</label>
                  <select value={form.waehrung} onChange={e => setForm(f => ({ ...f, waehrung: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white">
                    <option>EUR</option><option>USD</option><option>GBP</option><option>SAR</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">{t("reisen.participants")}</label>
                <input type="text" value={form.teilnehmer} onChange={e => setForm(f => ({ ...f, teilnehmer: e.target.value }))} placeholder={t("reisen.participantsPlaceholder")}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">{t("common.status")}</label>
                <div className="flex gap-2">
                  {(["geplant","aktiv","abgeschlossen"] as const).map(s => (
                    <button key={s} onClick={() => setForm(f => ({ ...f, status: s }))}
                      className={cn("flex-1 py-2 rounded-xl text-xs font-medium transition-all",
                        form.status === s ? STATUS_COLORS[s] : "bg-gray-100 dark:bg-gray-800 text-gray-500")}>
                      {t(`reisen.status.${s}`)}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">{t("common.note")} ({t("common.optional")})</label>
                <textarea rows={2} value={form.notizen} onChange={e => setForm(f => ({ ...f, notizen: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white resize-none" />
              </div>
            </div>
            <div className="flex gap-3 p-5 pt-0">
              <button onClick={() => setShowForm(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                {t("common.cancel")}
              </button>
              <button onClick={save} disabled={saving || !form.name || !form.ziel}
                className="flex-1 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Check className="h-4 w-4" />}
                {t("common.save")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
