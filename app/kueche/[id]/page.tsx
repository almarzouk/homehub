"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Star, ChefHat, Clock, Users, Trash2, Edit3, Check, X, Plus } from "lucide-react";

interface Gericht {
  _id: string;
  name: string;
  kochgeraet: string;
  programm: string;
  leistung: string;
  zeit: string;
  zeitMinuten?: number;
  portionen?: number;
  schwierigkeit?: string;
  zutaten: string[];
  tags: string[];
  notizen: string;
  favorit: boolean;
  gekochtAnzahl: number;
  zuletztGekocht?: string | null;
}

interface Kochgeraet {
  _id: string;
  name: string;
  programme: string[];
  leistungen: string[];
}

export default function GerichtDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [gericht, setGericht] = useState<Gericht | null>(null);
  const [kochgeraete, setKochgeraete] = useState<Kochgeraet[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    kochgeraet: "",
    programm: "",
    leistung: "",
    zeit: "",
    zeitMinuten: "",
    portionen: "",
    schwierigkeit: "",
    notizen: "",
    favorit: false,
  });
  const [zutaten, setZutaten] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [zutatInput, setZutatInput] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [programme, setProgramme] = useState<string[]>([]);
  const [leistungen, setLeistungen] = useState<string[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    const [gRes, kRes] = await Promise.all([
      fetch(`/api/kueche/gerichte/${id}`),
      fetch("/api/kueche/kochgeraete"),
    ]);
    const g = await gRes.json();
    const k = await kRes.json();
    if (!gRes.ok) { router.replace("/kueche"); return; }
    setGericht(g);
    setKochgeraete(Array.isArray(k) ? k : []);
    setLoading(false);
  }, [id, router]);

  useEffect(() => { load(); }, [load]);

  const startEdit = () => {
    if (!gericht) return;
    setForm({
      name: gericht.name,
      kochgeraet: gericht.kochgeraet,
      programm: gericht.programm,
      leistung: gericht.leistung,
      zeit: gericht.zeit,
      zeitMinuten: gericht.zeitMinuten?.toString() ?? "",
      portionen: gericht.portionen?.toString() ?? "",
      schwierigkeit: gericht.schwierigkeit ?? "",
      notizen: gericht.notizen,
      favorit: gericht.favorit,
    });
    setZutaten([...gericht.zutaten]);
    setTags([...gericht.tags]);
    const g = kochgeraete.find((k) => k.name === gericht.kochgeraet);
    setProgramme(g?.programme ?? []);
    setLeistungen(g?.leistungen ?? []);
    setEditing(true);
  };

  const onGeraetChange = (name: string) => {
    setForm((f) => ({ ...f, kochgeraet: name, programm: "", leistung: "" }));
    const g = kochgeraete.find((k) => k.name === name);
    setProgramme(g?.programme ?? []);
    setLeistungen(g?.leistungen ?? []);
  };

  const saveEdit = async () => {
    setSaving(true);
    setError("");
    const res = await fetch(`/api/kueche/gerichte/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        zeitMinuten: form.zeitMinuten ? parseInt(form.zeitMinuten) : undefined,
        portionen: form.portionen ? parseInt(form.portionen) : undefined,
        zutaten,
        tags,
      }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error || "Speicherfehler"); setSaving(false); return; }
    setGericht(data);
    setEditing(false);
    setSaving(false);
  };

  const toggleFavorit = async () => {
    const res = await fetch(`/api/kueche/gerichte/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ aktion: "favorit-umschalten" }),
    });
    const data = await res.json();
    if (res.ok) setGericht(data);
  };

  const alsGekocht = async () => {
    const res = await fetch(`/api/kueche/gerichte/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ aktion: "als-gekocht-markieren" }),
    });
    const data = await res.json();
    if (res.ok) setGericht(data);
  };

  const deleteGericht = async () => {
    if (!confirm("Gericht wirklich löschen?")) return;
    setDeleting(true);
    await fetch(`/api/kueche/gerichte/${id}`, { method: "DELETE" });
    router.push("/kueche");
  };

  const addZutat = () => {
    const v = zutatInput.trim();
    if (v && !zutaten.includes(v)) setZutaten((z) => [...z, v]);
    setZutatInput("");
  };
  const addTag = () => {
    const v = tagInput.trim().toLowerCase();
    if (v && !tags.includes(v)) setTags((t) => [...t, v]);
    setTagInput("");
  };

  if (loading) return (
    <div className="flex items-center justify-center py-32">
      <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!gericht) return null;

  if (editing) {
    return (
      <div className="max-w-2xl mx-auto space-y-5">
        <div className="flex items-center gap-3">
          <button onClick={() => setEditing(false)} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800"><ArrowLeft className="h-5 w-5" /></button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gericht bearbeiten</h1>
        </div>
        {error && <div className="bg-red-50 dark:bg-red-950 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">{error}</div>}

        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 space-y-4">
          <h2 className="font-semibold">Grundangaben</h2>
          <div>
            <label className="block text-sm font-medium mb-1.5">Name *</label>
            <input type="text" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Kochgerät *</label>
            <select value={form.kochgeraet} onChange={(e) => onGeraetChange(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500">
              {kochgeraete.map((g) => <option key={g._id} value={g.name}>{g.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1.5">Zeit</label>
              <input type="text" value={form.zeit} onChange={(e) => setForm((f) => ({ ...f, zeit: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Minuten</label>
              <input type="number" min="0" value={form.zeitMinuten} onChange={(e) => setForm((f) => ({ ...f, zeitMinuten: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Portionen</label>
              <input type="number" min="1" value={form.portionen} onChange={(e) => setForm((f) => ({ ...f, portionen: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </div>
          </div>
          <div className="flex gap-2">
            {["einfach", "mittel", "schwer"].map((s) => (
              <button key={s} type="button" onClick={() => setForm((f) => ({ ...f, schwierigkeit: f.schwierigkeit === s ? "" : s }))}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${form.schwierigkeit === s ? "bg-orange-100 border-orange-400 text-orange-700" : "bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400"}`}>
                {s}
              </button>
            ))}
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.favorit} onChange={(e) => setForm((f) => ({ ...f, favorit: e.target.checked }))} className="w-4 h-4 accent-orange-500" />
            <span className="text-sm">Als Favorit</span>
          </label>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 space-y-3">
          <h2 className="font-semibold">Zutaten</h2>
          <div className="flex gap-2">
            <input type="text" value={zutatInput} onChange={(e) => setZutatInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addZutat())} placeholder="Zutat…"
              className="flex-1 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
            <button type="button" onClick={addZutat} className="px-3 py-2 bg-orange-500 text-white rounded-xl"><Plus className="h-4 w-4" /></button>
          </div>
          <div className="flex flex-wrap gap-2">
            {zutaten.map((z) => (
              <span key={z} className="flex items-center gap-1 bg-orange-50 dark:bg-orange-950 text-orange-700 dark:text-orange-300 px-2.5 py-1 rounded-lg text-sm">
                {z} <button type="button" onClick={() => setZutaten((arr) => arr.filter((x) => x !== z))}><X className="h-3 w-3" /></button>
              </span>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 space-y-3">
          <h2 className="font-semibold">Tags</h2>
          <div className="flex gap-2">
            <input type="text" value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())} placeholder="Tag…"
              className="flex-1 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
            <button type="button" onClick={addTag} className="px-3 py-2 bg-orange-500 text-white rounded-xl"><Plus className="h-4 w-4" /></button>
          </div>
          <div className="flex flex-wrap gap-2">
            {tags.map((t) => (
              <span key={t} className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-2.5 py-1 rounded-lg text-sm">
                #{t} <button type="button" onClick={() => setTags((arr) => arr.filter((x) => x !== t))}><X className="h-3 w-3" /></button>
              </span>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
          <label className="block text-sm font-medium mb-1.5">Notizen</label>
          <textarea rows={3} value={form.notizen} onChange={(e) => setForm((f) => ({ ...f, notizen: e.target.value }))}
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-500" />
        </div>

        <div className="flex gap-3">
          <button onClick={() => setEditing(false)} className="flex-1 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            Abbrechen
          </button>
          <button onClick={saveEdit} disabled={saving} className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2">
            {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Check className="h-4 w-4" />}
            {saving ? "Speichere…" : "Speichern"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <Link href="/kueche" className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800"><ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" /></Link>
        <div className="flex items-center gap-2">
          <button onClick={toggleFavorit} className={`p-2 rounded-xl transition-colors ${gericht.favorit ? "text-yellow-500" : "text-gray-400 hover:text-yellow-500"}`}>
            <Star className="h-5 w-5" fill={gericht.favorit ? "currentColor" : "none"} />
          </button>
          <button onClick={startEdit} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400">
            <Edit3 className="h-5 w-5" />
          </button>
          <button onClick={deleteGericht} disabled={deleting} className="p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-950 text-red-500 transition-colors">
            <Trash2 className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{gericht.name}</h1>
        <p className="text-orange-500 font-medium">{gericht.kochgeraet}{gericht.programm ? ` · ${gericht.programm}` : ""}{gericht.leistung ? ` · ${gericht.leistung}` : ""}</p>
        <div className="flex flex-wrap gap-4 mt-4 text-sm text-gray-500">
          {gericht.zeitMinuten && <span className="flex items-center gap-1"><Clock className="h-4 w-4" />{gericht.zeitMinuten} Min.</span>}
          {gericht.portionen && <span className="flex items-center gap-1"><Users className="h-4 w-4" />{gericht.portionen} Portionen</span>}
          {gericht.schwierigkeit && <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${gericht.schwierigkeit === "einfach" ? "bg-green-100 text-green-700" : gericht.schwierigkeit === "mittel" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}>{gericht.schwierigkeit}</span>}
        </div>
      </div>

      {gericht.zutaten.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-3">Zutaten</h2>
          <ul className="space-y-1.5">
            {gericht.zutaten.map((z) => (
              <li key={z} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                {z}
              </li>
            ))}
          </ul>
        </div>
      )}

      {gericht.notizen && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-2">Notizen</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{gericht.notizen}</p>
        </div>
      )}

      {gericht.tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {gericht.tags.map((t) => (
            <span key={t} className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2.5 py-1 rounded-lg text-sm">#{t}</span>
          ))}
        </div>
      )}

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">{gericht.gekochtAnzahl}× gekocht</p>
            {gericht.zuletztGekocht && (
              <p className="text-xs text-gray-400">Zuletzt: {new Date(gericht.zuletztGekocht).toLocaleDateString("de-DE")}</p>
            )}
          </div>
          <button
            onClick={alsGekocht}
            className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-xl text-sm font-medium transition-colors"
          >
            <ChefHat className="h-4 w-4" />
            Als gekocht markieren
          </button>
        </div>
      </div>
    </div>
  );
}
