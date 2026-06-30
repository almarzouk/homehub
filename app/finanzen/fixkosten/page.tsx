"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { Plus, Trash2, Pencil, X, Lock } from "lucide-react";
import { formatCurrency, toCents, fromCents } from "@/lib/utils";

interface Fixkosten {
  _id: string;
  name: string;
  betrag: number;
  kategorie: string;
  faelligAm?: number;
  aktiv: boolean;
}

const CATEGORY_ICONS: Record<string, string> = {
  wohnen: "🏠", transport: "🚗", versicherung: "🛡️", kommunikation: "📱",
  streaming: "🎬", gesundheit: "❤️", bildung: "📚", sonstiges: "📋",
};

const EMPTY_FORM = { name: "", betrag: "", kategorie: "sonstiges", faelligAm: "", aktiv: true };

export default function FixkostenPage() {
  const { t } = useTranslation();
  const [items, setItems] = useState<Fixkosten[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{ open: boolean; editing: Fixkosten | null }>({ open: false, editing: null });
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/finanzen/fixkosten");
    const data = await res.json();
    setItems(Array.isArray(data) ? data : []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => { setForm(EMPTY_FORM); setModal({ open: true, editing: null }); };

  const openEdit = (item: Fixkosten) => {
    setForm({
      name: item.name,
      betrag: fromCents(item.betrag).toFixed(2),
      kategorie: item.kategorie,
      faelligAm: item.faelligAm?.toString() ?? "",
      aktiv: item.aktiv,
    });
    setModal({ open: true, editing: item });
  };

  const closeModal = () => setModal({ open: false, editing: null });

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setSaving(true);
    const payload = {
      name: form.name,
      betrag: toCents(parseFloat(form.betrag)),
      kategorie: form.kategorie,
      faelligAm: form.faelligAm ? parseInt(form.faelligAm) : undefined,
      aktiv: form.aktiv,
    };
    if (modal.editing) {
      await fetch(`/api/finanzen/fixkosten/${modal.editing._id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } else {
      await fetch("/api/finanzen/fixkosten", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }
    setSaving(false);
    closeModal();
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t("finanzen.deleteFixkostenConfirm"))) return;
    await fetch(`/api/finanzen/fixkosten/${id}`, { method: "DELETE" });
    load();
  };

  const toggleAktiv = async (item: Fixkosten) => {
    await fetch(`/api/finanzen/fixkosten/${item._id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ aktiv: !item.aktiv }),
    });
    load();
  };

  const total = items.filter((i) => i.aktiv).reduce((s, i) => s + i.betrag, 0);
  const totalAll = items.reduce((s, i) => s + i.betrag, 0);

  const PRESETS = [
    { name: "Miete", kategorie: "wohnen" }, { name: "Strom & Gas", kategorie: "wohnen" },
    { name: "Internet", kategorie: "kommunikation" }, { name: "Handy", kategorie: "kommunikation" },
    { name: "Netflix", kategorie: "streaming" }, { name: "Spotify", kategorie: "streaming" },
    { name: "Krankenversicherung", kategorie: "versicherung" }, { name: "KFZ-Versicherung", kategorie: "versicherung" },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-indigo-500" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t("finanzen.fixkosten")}</h1>
          </div>
          <p className="text-sm text-gray-500">{t("finanzen.fixkostenDesc")}</p>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors">
          <Plus className="h-4 w-4" />{t("finanzen.newFixkosten")}
        </button>
      </div>

      {/* Summary */}
      {items.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-indigo-50 dark:bg-indigo-950 rounded-2xl p-4">
            <p className="text-xs text-gray-500 mb-1">{t("finanzen.fixkostenTotal")}</p>
            <p className="text-xl font-bold text-indigo-700 dark:text-indigo-400">{formatCurrency(total, "EUR")}</p>
            <p className="text-xs text-gray-400">{t("common.all")}: {formatCurrency(totalAll, "EUR")}</p>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4">
            <p className="text-xs text-gray-500 mb-1">{items.filter(i => i.aktiv).length} aktiv</p>
            <div className="space-y-1">
              {Object.entries(
                items.filter(i => i.aktiv).reduce<Record<string, number>>((acc, i) => {
                  acc[i.kategorie] = (acc[i.kategorie] ?? 0) + i.betrag;
                  return acc;
                }, {})
              ).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([kat, amt]) => (
                <div key={kat} className="flex justify-between text-xs">
                  <span className="text-gray-500">{CATEGORY_ICONS[kat] ?? "📋"} {kat}</span>
                  <span className="font-medium">{formatCurrency(amt, "EUR")}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-20">
          <Lock className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 mb-4">{t("finanzen.noFixkosten")}</p>
          {/* Quick presets */}
          <div>
            <p className="text-xs text-gray-400 mb-2">{t("finanzen.setupPresets")}</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {PRESETS.slice(0, 4).map((p) => (
                <button key={p.name} onClick={() => { setForm({ ...EMPTY_FORM, name: p.name, kategorie: p.kategorie }); setModal({ open: true, editing: null }); }}
                  className="text-xs px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-full hover:bg-indigo-100 transition-colors">
                  + {p.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item._id}
              className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl border group transition-all ${item.aktiv ? "bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800" : "bg-gray-50 dark:bg-gray-900/50 border-gray-100 dark:border-gray-800 opacity-60"}`}>
              <div className="text-xl flex-shrink-0">{CATEGORY_ICONS[item.kategorie] ?? "📋"}</div>
              <div className="flex-1 min-w-0">
                <p className={`font-medium text-sm ${item.aktiv ? "text-gray-900 dark:text-white" : "text-gray-400 line-through"}`}>{item.name}</p>
                <p className="text-xs text-gray-400">
                  {item.kategorie}
                  {item.faelligAm ? ` · ${t("finanzen.faelligAm")} ${item.faelligAm}.` : ""}
                </p>
              </div>
              <span className="font-bold text-indigo-600 dark:text-indigo-400 flex-shrink-0">
                {formatCurrency(item.betrag, "EUR")}
              </span>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => toggleAktiv(item)}
                  className={`text-xs px-2 py-1 rounded-lg transition-colors ${item.aktiv ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-400" : "bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-gray-800"}`}>
                  {item.aktiv ? "✓" : "○"}
                </button>
                <button onClick={() => openEdit(item)}
                  className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950 rounded-lg transition-colors">
                  <Pencil className="h-4 w-4" />
                </button>
                <button onClick={() => handleDelete(item._id)}
                  className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950 rounded-lg transition-colors">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modal.open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={closeModal}>
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
              <h2 className="font-semibold text-gray-900 dark:text-white">{modal.editing ? t("finanzen.fixkosten") : t("finanzen.newFixkosten")}</h2>
              <button onClick={closeModal} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl">
                <X className="h-4 w-4 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {/* Preset chips */}
              {!modal.editing && (
                <div>
                  <p className="text-xs text-gray-400 mb-2">{t("finanzen.setupPresets")}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {PRESETS.map((p) => (
                      <button key={p.name} type="button"
                        onClick={() => setForm(f => ({ ...f, name: p.name, kategorie: p.kategorie }))}
                        className="text-xs px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-full hover:bg-indigo-100 transition-colors">
                        {p.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">{t("common.name")}</label>
                <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">{t("common.amount")} (€)</label>
                  <input required type="number" step="0.01" min="0" value={form.betrag}
                    onChange={(e) => setForm({ ...form, betrag: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">{t("finanzen.faelligAm")} ({t("common.optional")})</label>
                  <input type="number" min="1" max="31" value={form.faelligAm}
                    onChange={(e) => setForm({ ...form, faelligAm: e.target.value })} placeholder="1–31"
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">{t("common.category")}</label>
                <select value={form.kategorie} onChange={(e) => setForm({ ...form, kategorie: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  {Object.entries(CATEGORY_ICONS).map(([k, icon]) => (
                    <option key={k} value={k}>{icon} {k}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={closeModal}
                  className="flex-1 py-2.5 text-sm text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  {t("common.cancel")}
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white text-sm rounded-xl disabled:opacity-50 transition-colors font-medium">
                  {saving ? t("finanzen.saving") : t("common.save")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
