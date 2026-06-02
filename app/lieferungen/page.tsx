"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { Plus, Trash2, Package, ExternalLink, CheckCircle, Clock, Truck, AlertCircle, ArchiveX } from "lucide-react";

interface Lieferung {
  _id: string;
  bezeichnung: string;
  haendler?: string;
  trackingNummer?: string;
  trackingUrl?: string;
  status: string;
  bestelldatum?: string;
  erwarteteAnkunft?: string;
  angekommendAm?: string;
  empfaenger?: string;
  notizen?: string;
}

const STATUS_CONFIG: Record<string, { label: string; icon: React.ComponentType<{ className?: string }>; color: string; bg: string }> = {
  bestellt: { label: "Bestellt", icon: Package, color: "text-blue-600", bg: "bg-blue-100 dark:bg-blue-950" },
  versendet: { label: "Versendet", icon: Package, color: "text-purple-600", bg: "bg-purple-100 dark:bg-purple-950" },
  unterwegs: { label: "Unterwegs", icon: Truck, color: "text-orange-600", bg: "bg-orange-100 dark:bg-orange-950" },
  zugestellt: { label: "Zugestellt", icon: CheckCircle, color: "text-green-600", bg: "bg-green-100 dark:bg-green-950" },
  abgeholt: { label: "Abgeholt", icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-100 dark:bg-emerald-950" },
  problem: { label: "Problem", icon: AlertCircle, color: "text-red-600", bg: "bg-red-100 dark:bg-red-950" },
};

const STATUS_ORDER = ["bestellt", "versendet", "unterwegs", "zugestellt", "abgeholt", "problem"];

const emptyForm = { bezeichnung: "", haendler: "", trackingNummer: "", trackingUrl: "", status: "bestellt", bestelldatum: "", erwarteteAnkunft: "", empfaenger: "", notizen: "" };

function formatDate(str?: string) {
  if (!str) return null;
  return new Date(str).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" });
}

export default function LieferungenPage() {
  const { t } = useTranslation();
  const [items, setItems] = useState<Lieferung[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [statusFilter, setStatusFilter] = useState("alle");

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/lieferungen");
    const data = await res.json();
    setItems(Array.isArray(data) ? data : []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const addItem = async () => {
    if (!form.bezeichnung) return;
    setSaving(true);
    const res = await fetch("/api/lieferungen", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        bestelldatum: form.bestelldatum || undefined,
        erwarteteAnkunft: form.erwarteteAnkunft || undefined,
        trackingUrl: form.trackingUrl || undefined,
      }),
    });
    if (res.ok) { setForm(emptyForm); setShowForm(false); load(); }
    setSaving(false);
  };

  const updateStatus = async (id: string, status: string) => {
    const extra = status === "zugestellt" || status === "abgeholt"
      ? { angekommendAm: new Date().toISOString() }
      : {};
    await fetch(`/api/lieferungen/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, ...extra }),
    });
    load();
  };

  const deleteItem = async (id: string) => {
    await fetch(`/api/lieferungen/${id}`, { method: "DELETE" });
    load();
  };

  const filtered = statusFilter === "alle" ? items : items.filter((i) => i.status === statusFilter);
  const aktive = items.filter((i) => !["zugestellt", "abgeholt"].includes(i.status)).length;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t("lieferungen.title")}</h1>
          <p className="text-sm text-gray-500">{aktive > 0 ? `${aktive} aktive Sendung${aktive > 1 ? "en" : ""}` : "Alle zugestellt"}</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors">
          <Plus className="h-4 w-4" />
          Lieferung
        </button>
      </div>

      {showForm && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 space-y-4">
          <h2 className="font-semibold text-gray-900 dark:text-white">Neue Lieferung</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input className="col-span-2 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Bezeichnung *" value={form.bezeichnung} onChange={(e) => setForm({ ...form, bezeichnung: e.target.value })} />
            <input className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Händler (Amazon, DHL...)" value={form.haendler} onChange={(e) => setForm({ ...form, haendler: e.target.value })} />
            <input className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Tracking-Nr." value={form.trackingNummer} onChange={(e) => setForm({ ...form, trackingNummer: e.target.value })} />
            <input className="col-span-2 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Tracking-URL" value={form.trackingUrl} onChange={(e) => setForm({ ...form, trackingUrl: e.target.value })} />
            <div><label className="text-xs text-gray-500 mb-1 block">Bestelldatum</label><input type="date" className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" value={form.bestelldatum} onChange={(e) => setForm({ ...form, bestelldatum: e.target.value })} /></div>
            <div><label className="text-xs text-gray-500 mb-1 block">Erwartete Ankunft</label><input type="date" className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" value={form.erwarteteAnkunft} onChange={(e) => setForm({ ...form, erwarteteAnkunft: e.target.value })} /></div>
            <input className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Empfänger" value={form.empfaenger} onChange={(e) => setForm({ ...form, empfaenger: e.target.value })} />
            <select className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              {STATUS_ORDER.map((s) => <option key={s} value={s}>{STATUS_CONFIG[s]?.label ?? s}</option>)}
            </select>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowForm(false)} className="flex-1 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-600 dark:text-gray-400">Abbrechen</button>
            <button onClick={addItem} disabled={saving || !form.bezeichnung} className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-xl text-sm font-medium">{saving ? "Speichere..." : "Hinzufügen"}</button>
          </div>
        </div>
      )}

      {/* Status filter */}
      <div className="flex gap-2 flex-wrap">
        {["alle", ...STATUS_ORDER].map((s) => {
          const cfg = s === "alle" ? null : STATUS_CONFIG[s];
          return (
            <button key={s} onClick={() => setStatusFilter(s)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${statusFilter === s ? "bg-indigo-600 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"}`}>
              {cfg?.label ?? "Alle"}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20"><ArchiveX className="h-12 w-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-500">Keine Lieferungen gefunden.</p></div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => {
            const cfg = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.bestellt;
            const StatusIcon = cfg.icon;
            return (
              <div key={item._id} className={`bg-white dark:bg-gray-900 rounded-2xl border overflow-hidden ${item.status === "problem" ? "border-red-200 dark:border-red-800" : "border-gray-100 dark:border-gray-800"}`}>
                <div className="flex items-start gap-4 px-5 py-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.bg}`}>
                    <StatusIcon className={`h-5 w-5 ${cfg.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-sm text-gray-900 dark:text-white">{item.bezeichnung}</p>
                      {item.haendler && <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-500 px-2 py-0.5 rounded-full">{item.haendler}</span>}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                      {item.trackingNummer && <span className="text-xs font-mono text-gray-500">{item.trackingNummer}</span>}
                      {item.bestelldatum && <span className="flex items-center gap-1 text-xs text-gray-500"><Clock className="h-3 w-3" />Bestellt: {formatDate(item.bestelldatum)}</span>}
                      {item.erwarteteAnkunft && <span className="flex items-center gap-1 text-xs text-gray-500"><Package className="h-3 w-3" />Erwartet: {formatDate(item.erwarteteAnkunft)}</span>}
                      {item.empfaenger && <span className="text-xs text-gray-500">für {item.empfaenger}</span>}
                    </div>
                    {/* Status actions */}
                    <div className="flex gap-1.5 mt-2 flex-wrap">
                      {STATUS_ORDER.filter((s) => s !== item.status).map((s) => (
                        <button key={s} onClick={() => updateStatus(item._id, s)} className="text-xs px-2 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-indigo-100 dark:hover:bg-indigo-950 hover:text-indigo-600 transition-colors">
                          {STATUS_CONFIG[s]?.label ?? s}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {item.trackingUrl && (
                      <a href={item.trackingUrl} target="_blank" rel="noopener noreferrer" className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 transition-colors">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                    <button onClick={() => deleteItem(item._id)} className="p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-950 text-red-400 hover:text-red-600 transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
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
