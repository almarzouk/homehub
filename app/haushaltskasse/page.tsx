"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { Plus, Trash2, Edit2, X, Check, Wallet, ShoppingCart, Car, UtensilsCrossed, Baby, Shirt, Heart, Home, Gamepad2 } from "lucide-react";
import { cn } from "@/lib/utils";

type KasseKategorie = "lebensmittel" | "transport" | "restaurant" | "kind" | "kleidung" | "gesundheit" | "haushalt" | "freizeit" | "sonstiges";

interface KasseEintrag {
  _id: string;
  betrag: number;
  kategorie: KasseKategorie;
  beschreibung: string;
  datum: string;
  bezahltVon?: string;
  notiz?: string;
}

const KAT_ICONS: Record<KasseKategorie, React.ElementType> = {
  lebensmittel: ShoppingCart, transport: Car, restaurant: UtensilsCrossed,
  kind: Baby, kleidung: Shirt, gesundheit: Heart,
  haushalt: Home, freizeit: Gamepad2, sonstiges: Wallet,
};

const KAT_COLORS: Record<KasseKategorie, string> = {
  lebensmittel: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300",
  transport: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  restaurant: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300",
  kind: "bg-pink-100 text-pink-700 dark:bg-pink-950 dark:text-pink-300",
  kleidung: "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300",
  gesundheit: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
  haushalt: "bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300",
  freizeit: "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300",
  sonstiges: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
};

const KATEGORIEN: KasseKategorie[] = ["lebensmittel","transport","restaurant","kind","kleidung","gesundheit","haushalt","freizeit","sonstiges"];

const emptyForm = {
  betrag: "",
  kategorie: "sonstiges" as KasseKategorie,
  beschreibung: "",
  datum: new Date().toISOString().slice(0, 10),
  bezahltVon: "",
  notiz: "",
};

export default function HaushaltskassePage() {
  const { t } = useTranslation();
  const [eintraege, setEintraege] = useState<KasseEintrag[]>([]);
  const [summe, setSumme] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [filterKat, setFilterKat] = useState<KasseKategorie | "alle">("alle");

  const load = useCallback(async () => {
    setLoading(true);
    const params = filterKat !== "alle" ? `?kategorie=${filterKat}` : "";
    const res = await fetch(`/api/haushaltskasse${params}`);
    const data = await res.json();
    setEintraege(data.eintraege ?? []);
    setSumme(data.summe ?? 0);
    setLoading(false);
  }, [filterKat]);

  useEffect(() => { load(); }, [load]);

  const openNew = () => {
    setEditId(null);
    setForm({ ...emptyForm, datum: new Date().toISOString().slice(0, 10) });
    setShowForm(true);
  };

  const openEdit = (e: KasseEintrag) => {
    setEditId(e._id);
    setForm({
      betrag: e.betrag.toString(),
      kategorie: e.kategorie,
      beschreibung: e.beschreibung,
      datum: new Date(e.datum).toISOString().slice(0, 10),
      bezahltVon: e.bezahltVon ?? "",
      notiz: e.notiz ?? "",
    });
    setShowForm(true);
  };

  const save = async () => {
    if (!form.betrag || !form.beschreibung) return;
    setSaving(true);
    const body = {
      betrag: parseFloat(form.betrag),
      kategorie: form.kategorie,
      beschreibung: form.beschreibung,
      datum: form.datum,
      bezahltVon: form.bezahltVon || undefined,
      notiz: form.notiz || undefined,
    };
    const url = editId ? `/api/haushaltskasse/${editId}` : "/api/haushaltskasse";
    const method = editId ? "PATCH" : "POST";
    await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setShowForm(false);
    setSaving(false);
    load();
  };

  const del = async (id: string) => {
    if (!confirm(t("common.confirm"))) return;
    await fetch(`/api/haushaltskasse/${id}`, { method: "DELETE" });
    load();
  };

  // Group by date
  const grouped = eintraege.reduce<Record<string, KasseEintrag[]>>((acc, e) => {
    const day = new Date(e.datum).toLocaleDateString([], { weekday: "short", day: "2-digit", month: "2-digit" });
    if (!acc[day]) acc[day] = [];
    acc[day].push(e);
    return acc;
  }, {});

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center shadow-sm">
            <Wallet className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t("haushaltskasse.title")}</h1>
            <p className="text-sm text-gray-500">{t("haushaltskasse.total")}: <span className="font-semibold text-emerald-600 dark:text-emerald-400">{summe.toFixed(2)} €</span></p>
          </div>
        </div>
        <button onClick={openNew}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-medium shadow-sm transition-colors">
          <Plus className="h-4 w-4" /> {t("haushaltskasse.addEntry")}
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {KATEGORIEN.slice(0, 4).map((kat) => {
          const Icon = KAT_ICONS[kat];
          const katSumme = eintraege.filter(e => e.kategorie === kat).reduce((s, e) => s + e.betrag, 0);
          return (
            <div key={kat} className={cn("rounded-2xl p-4 cursor-pointer transition-all", filterKat === kat ? KAT_COLORS[kat] : "bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800")}
              onClick={() => setFilterKat(prev => prev === kat ? "alle" : kat)}>
              <Icon className="h-5 w-5 mb-2 opacity-70" />
              <p className="text-xs text-gray-500 dark:text-gray-400">{t(`haushaltskasse.categories.${kat}`)}</p>
              <p className="text-base font-bold">{katSumme.toFixed(0)} €</p>
            </div>
          );
        })}
      </div>

      {/* Filter */}
      <div className="flex flex-wrap gap-2">
        <button onClick={() => setFilterKat("alle")}
          className={cn("px-3 py-1.5 rounded-xl text-xs font-medium transition-all",
            filterKat === "alle" ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900" : "bg-gray-100 dark:bg-gray-800 text-gray-500")}>
          {t("common.all")}
        </button>
        {KATEGORIEN.map((kat) => {
          const Icon = KAT_ICONS[kat];
          return (
            <button key={kat} onClick={() => setFilterKat(prev => prev === kat ? "alle" : kat)}
              className={cn("flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium transition-all",
                filterKat === kat ? KAT_COLORS[kat] : "bg-gray-100 dark:bg-gray-800 text-gray-500")}>
              <Icon className="h-3 w-3" />
              {t(`haushaltskasse.categories.${kat}`)}
            </button>
          );
        })}
      </div>

      {/* List grouped by date */}
      {loading ? (
        <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : eintraege.length === 0 ? (
        <div className="text-center py-20">
          <Wallet className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 mb-4">{t("haushaltskasse.empty")}</p>
          <button onClick={openNew} className="px-4 py-2 bg-emerald-500 text-white rounded-xl text-sm font-medium hover:bg-emerald-600 transition-colors">
            {t("haushaltskasse.addEntry")}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([day, items]) => {
            const daySum = items.reduce((s, e) => s + e.betrag, 0);
            return (
              <div key={day}>
                <div className="flex items-center justify-between mb-2 px-1">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{day}</span>
                  <span className="text-xs font-semibold text-gray-500">{daySum.toFixed(2)} €</span>
                </div>
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 divide-y divide-gray-50 dark:divide-gray-800">
                  {items.map((e) => {
                    const Icon = KAT_ICONS[e.kategorie];
                    return (
                      <div key={e._id} className="flex items-center gap-4 px-5 py-3.5">
                        <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0", KAT_COLORS[e.kategorie])}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{e.beschreibung}</p>
                          <p className="text-xs text-gray-400">
                            {t(`haushaltskasse.categories.${e.kategorie}`)}
                            {e.bezahltVon && ` · ${e.bezahltVon}`}
                            {e.notiz && ` · ${e.notiz}`}
                          </p>
                        </div>
                        <span className="text-sm font-bold text-gray-900 dark:text-white flex-shrink-0">{e.betrag.toFixed(2)} €</span>
                        <div className="flex items-center gap-1">
                          <button onClick={() => openEdit(e)} className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors">
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => del(e._id)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 dark:bg-black/60 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
              <h2 className="font-semibold text-gray-900 dark:text-white">
                {editId ? t("haushaltskasse.editEntry") : t("haushaltskasse.addEntry")}
              </h2>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-xs font-medium text-gray-500 mb-1 block">{t("haushaltskasse.amount")} (€) *</label>
                  <input type="number" value={form.betrag} onChange={e => setForm(f => ({ ...f, betrag: e.target.value }))} min="0" step="0.01" placeholder="0.00"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white" />
                </div>
                <div className="flex-1">
                  <label className="text-xs font-medium text-gray-500 mb-1 block">{t("common.date")}</label>
                  <input type="date" value={form.datum} onChange={e => setForm(f => ({ ...f, datum: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">{t("common.description")} *</label>
                <input type="text" value={form.beschreibung} onChange={e => setForm(f => ({ ...f, beschreibung: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-2 block">{t("common.category")}</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {KATEGORIEN.map((kat) => {
                    const Icon = KAT_ICONS[kat];
                    return (
                      <button key={kat} onClick={() => setForm(f => ({ ...f, kategorie: kat }))}
                        className={cn("flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all",
                          form.kategorie === kat ? KAT_COLORS[kat] : "bg-gray-50 dark:bg-gray-800 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
                        )}>
                        <Icon className="h-3.5 w-3.5 flex-shrink-0" />
                        {t(`haushaltskasse.categories.${kat}`)}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">{t("haushaltskasse.paidBy")} ({t("common.optional")})</label>
                <input type="text" value={form.bezahltVon} onChange={e => setForm(f => ({ ...f, bezahltVon: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white" />
              </div>
            </div>
            <div className="flex gap-3 p-5 pt-0">
              <button onClick={() => setShowForm(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                {t("common.cancel")}
              </button>
              <button onClick={save} disabled={saving || !form.betrag || !form.beschreibung}
                className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
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
