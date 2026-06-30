"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { Plus, Trash2, Edit2, X, Check, Baby, Droplets, Moon, Sun, Scale, Ruler, FileText, Milk } from "lucide-react";
import { cn } from "@/lib/utils";

type BabyTyp = "stillen" | "flasche" | "schlaf" | "aufwachen" | "windel" | "gewicht" | "groesse" | "notiz";

interface BabyEintrag {
  _id: string;
  typ: BabyTyp;
  zeitpunkt: string;
  menge?: number;
  dauer?: number;
  seite?: "links" | "rechts" | "beide";
  windel?: "nass" | "schmutzig" | "beides";
  notiz?: string;
}

const TYP_ICONS: Record<BabyTyp, React.ElementType> = {
  stillen: Milk, flasche: Droplets, schlaf: Moon, aufwachen: Sun,
  windel: Baby, gewicht: Scale, groesse: Ruler, notiz: FileText,
};

const TYP_COLORS: Record<BabyTyp, string> = {
  stillen: "bg-pink-100 text-pink-700 dark:bg-pink-950 dark:text-pink-300",
  flasche: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  schlaf: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300",
  aufwachen: "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300",
  windel: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300",
  gewicht: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  groesse: "bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300",
  notiz: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
};

const TYPEN: BabyTyp[] = ["stillen","flasche","schlaf","aufwachen","windel","gewicht","groesse","notiz"];

const emptyForm = {
  typ: "stillen" as BabyTyp,
  zeitpunkt: new Date().toISOString().slice(0, 16),
  menge: "",
  dauer: "",
  seite: "" as "" | "links" | "rechts" | "beide",
  windel: "" as "" | "nass" | "schmutzig" | "beides",
  notiz: "",
};

function toLocalDatetime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString([], { day: "2-digit", month: "2-digit" }) + " " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function BabyPage() {
  const { t } = useTranslation();
  const [eintraege, setEintraege] = useState<BabyEintrag[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [filterTyp, setFilterTyp] = useState<BabyTyp | "alle">("alle");

  const load = useCallback(async () => {
    setLoading(true);
    const params = filterTyp !== "alle" ? `?typ=${filterTyp}` : "";
    const res = await fetch(`/api/baby${params}`);
    const data = await res.json();
    setEintraege(data.eintraege ?? []);
    setLoading(false);
  }, [filterTyp]);

  useEffect(() => { load(); }, [load]);

  const openNew = () => {
    setEditId(null);
    setForm({ ...emptyForm, zeitpunkt: new Date().toISOString().slice(0, 16) });
    setShowForm(true);
  };

  const openEdit = (e: BabyEintrag) => {
    setEditId(e._id);
    setForm({
      typ: e.typ,
      zeitpunkt: new Date(e.zeitpunkt).toISOString().slice(0, 16),
      menge: e.menge?.toString() ?? "",
      dauer: e.dauer?.toString() ?? "",
      seite: e.seite ?? "",
      windel: e.windel ?? "",
      notiz: e.notiz ?? "",
    });
    setShowForm(true);
  };

  const save = async () => {
    setSaving(true);
    const body: Record<string, unknown> = {
      typ: form.typ,
      zeitpunkt: form.zeitpunkt,
      notiz: form.notiz || undefined,
    };
    if (form.menge) body.menge = parseFloat(form.menge);
    if (form.dauer) body.dauer = parseInt(form.dauer);
    if (form.seite) body.seite = form.seite;
    if (form.windel) body.windel = form.windel;

    const url = editId ? `/api/baby/${editId}` : "/api/baby";
    const method = editId ? "PATCH" : "POST";
    await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setShowForm(false);
    setSaving(false);
    load();
  };

  const del = async (id: string) => {
    if (!confirm(t("common.confirm"))) return;
    await fetch(`/api/baby/${id}`, { method: "DELETE" });
    load();
  };

  const typLabel = (typ: BabyTyp) => t(`baby.types.${typ}`);

  const showExtra = (e: BabyEintrag) => {
    const parts: string[] = [];
    if (e.dauer) parts.push(`${e.dauer} ${t("baby.min")}`);
    if (e.menge) parts.push(`${e.menge} ${e.typ === "gewicht" ? "g" : e.typ === "groesse" ? "cm" : "ml"}`);
    if (e.seite) parts.push(t(`baby.sides.${e.seite}`));
    if (e.windel) parts.push(t(`baby.windel.${e.windel}`));
    return parts.join(" · ");
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 bg-gradient-to-br from-pink-400 to-rose-500 rounded-2xl flex items-center justify-center shadow-sm">
            <Baby className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t("baby.title")}</h1>
            <p className="text-sm text-gray-500">{eintraege.length} {t("baby.entries")}</p>
          </div>
        </div>
        <button onClick={openNew}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-pink-500 hover:bg-pink-600 text-white rounded-xl text-sm font-medium shadow-sm transition-colors">
          <Plus className="h-4 w-4" /> {t("baby.addEntry")}
        </button>
      </div>

      {/* Filter */}
      <div className="flex flex-wrap gap-2">
        {(["alle", ...TYPEN] as const).map((typ) => {
          const Icon = typ !== "alle" ? TYP_ICONS[typ] : null;
          return (
            <button key={typ} onClick={() => setFilterTyp(typ as BabyTyp | "alle")}
              className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all",
                filterTyp === typ
                  ? typ === "alle" ? "bg-gray-800 text-white dark:bg-white dark:text-gray-900" : TYP_COLORS[typ as BabyTyp]
                  : "bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-gray-800 dark:hover:text-white"
              )}>
              {Icon && <Icon className="h-3.5 w-3.5" />}
              {typ === "alle" ? t("common.all") : typLabel(typ as BabyTyp)}
            </button>
          );
        })}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : eintraege.length === 0 ? (
        <div className="text-center py-20">
          <Baby className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 mb-4">{t("baby.empty")}</p>
          <button onClick={openNew} className="px-4 py-2 bg-pink-500 text-white rounded-xl text-sm font-medium hover:bg-pink-600 transition-colors">
            {t("baby.addEntry")}
          </button>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 divide-y divide-gray-50 dark:divide-gray-800">
          {eintraege.map((e) => {
            const Icon = TYP_ICONS[e.typ];
            const extra = showExtra(e);
            return (
              <div key={e._id} className="flex items-center gap-4 px-5 py-3.5">
                <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0", TYP_COLORS[e.typ])}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{typLabel(e.typ)}</p>
                  <p className="text-xs text-gray-400">
                    {toLocalDatetime(e.zeitpunkt)}{extra ? ` · ${extra}` : ""}{e.notiz ? ` · ${e.notiz}` : ""}
                  </p>
                </div>
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
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 dark:bg-black/60 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
              <h2 className="font-semibold text-gray-900 dark:text-white">
                {editId ? t("baby.editEntry") : t("baby.addEntry")}
              </h2>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              {/* Typ */}
              <div>
                <label className="text-xs font-medium text-gray-500 mb-2 block">{t("baby.type")}</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {TYPEN.map((typ) => {
                    const Icon = TYP_ICONS[typ];
                    return (
                      <button key={typ} onClick={() => setForm(f => ({ ...f, typ }))}
                        className={cn("flex flex-col items-center gap-1 p-2.5 rounded-xl text-[11px] font-medium transition-all",
                          form.typ === typ ? TYP_COLORS[typ] : "bg-gray-50 dark:bg-gray-800 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
                        )}>
                        <Icon className="h-4 w-4" />
                        {typLabel(typ)}
                      </button>
                    );
                  })}
                </div>
              </div>
              {/* Zeitpunkt */}
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">{t("baby.time")}</label>
                <input type="datetime-local" value={form.zeitpunkt} onChange={e => setForm(f => ({ ...f, zeitpunkt: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white" />
              </div>
              {/* Menge / Dauer */}
              {(["stillen","schlaf","aufwachen"].includes(form.typ)) && (
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">{t("baby.duration")} ({t("baby.min")})</label>
                  <input type="number" value={form.dauer} onChange={e => setForm(f => ({ ...f, dauer: e.target.value }))} min="0"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white" />
                </div>
              )}
              {(["flasche","gewicht","groesse"].includes(form.typ)) && (
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">
                    {form.typ === "gewicht" ? `${t("baby.amount")} (g)` : form.typ === "groesse" ? `${t("baby.amount")} (cm)` : `${t("baby.amount")} (ml)`}
                  </label>
                  <input type="number" value={form.menge} onChange={e => setForm(f => ({ ...f, menge: e.target.value }))} min="0"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white" />
                </div>
              )}
              {form.typ === "stillen" && (
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">{t("baby.side")}</label>
                  <div className="flex gap-2">
                    {(["links","rechts","beide"] as const).map(s => (
                      <button key={s} onClick={() => setForm(f => ({ ...f, seite: f.seite === s ? "" : s }))}
                        className={cn("flex-1 py-1.5 rounded-lg text-xs font-medium transition-all",
                          form.seite === s ? "bg-pink-500 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-500")}>
                        {t(`baby.sides.${s}`)}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {form.typ === "windel" && (
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">{t("baby.windelType")}</label>
                  <div className="flex gap-2">
                    {(["nass","schmutzig","beides"] as const).map(w => (
                      <button key={w} onClick={() => setForm(f => ({ ...f, windel: f.windel === w ? "" : w }))}
                        className={cn("flex-1 py-1.5 rounded-lg text-xs font-medium transition-all",
                          form.windel === w ? "bg-orange-500 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-500")}>
                        {t(`baby.windel.${w}`)}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {/* Notiz */}
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">{t("common.note")} ({t("common.optional")})</label>
                <input type="text" value={form.notiz} onChange={e => setForm(f => ({ ...f, notiz: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white" />
              </div>
            </div>
            <div className="flex gap-3 p-5 pt-0">
              <button onClick={() => setShowForm(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                {t("common.cancel")}
              </button>
              <button onClick={save} disabled={saving}
                className="flex-1 py-2.5 rounded-xl bg-pink-500 hover:bg-pink-600 text-white text-sm font-medium transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
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
