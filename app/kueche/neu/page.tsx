"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, X, ChefHat } from "lucide-react";
import Link from "next/link";
import { useTranslation } from "@/hooks/useTranslation";

interface Kochgeraet {
  _id: string;
  name: string;
  programme: string[];
  leistungen: string[];
}

export default function NeuesGerichtPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [kochgeraete, setKochgeraete] = useState<Kochgeraet[]>([]);
  const [loading, setLoading] = useState(false);
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

  useEffect(() => {
    fetch("/api/kueche/kochgeraete")
      .then((r) => r.json())
      .then((data) => setKochgeraete(Array.isArray(data) ? data : []));
  }, []);

  const onGeraetChange = (name: string) => {
    setForm((f) => ({ ...f, kochgeraet: name, programm: "", leistung: "" }));
    const g = kochgeraete.find((k) => k.name === name);
    setProgramme(g?.programme ?? []);
    setLeistungen(g?.leistungen ?? []);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.kochgeraet) {
      setError(t("kueche.required"));
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/kueche/gerichte", {
        method: "POST",
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
      if (!res.ok) {
        setError(data.error || t("common.error"));
        setLoading(false);
        return;
      }
      router.push("/kueche");
    } catch {
      setError(t("kueche.netError"));
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/kueche" className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
          <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t("kueche.new")}</h1>
          <p className="text-sm text-gray-500">{t("kueche.addFirst")}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3 text-sm text-red-700 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Name */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 space-y-4">
          <h2 className="font-semibold text-gray-900 dark:text-white">{t("kueche.details")}</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t("common.name")} *</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="z. B. Hähnchen mit Reis"
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t("kueche.device")} *</label>
            <select
              required
              value={form.kochgeraet}
              onChange={(e) => onGeraetChange(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="">— {t("kueche.device")} —</option>
              {kochgeraete.map((g) => (
                <option key={g._id} value={g.name}>{g.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 gap-3">
            {programme.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t("kueche.program")}</label>
                <select
                  value={form.programm}
                  onChange={(e) => setForm((f) => ({ ...f, programm: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">— wählen —</option>
                  {programme.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            )}
            {leistungen.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t("kueche.power")}</label>
                <select
                  value={form.leistung}
                  onChange={(e) => setForm((f) => ({ ...f, leistung: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">— wählen —</option>
                  {leistungen.map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Details */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 space-y-4">
          <h2 className="font-semibold text-gray-900 dark:text-white">{t("kueche.details")}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t("kueche.time")}</label>
              <input
                type="text"
                value={form.zeit}
                onChange={(e) => setForm((f) => ({ ...f, zeit: e.target.value }))}
                placeholder="z. B. 30 Min."
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t("kueche.cookTime")}</label>
              <input
                type="number"
                min="0"
                value={form.zeitMinuten}
                onChange={(e) => setForm((f) => ({ ...f, zeitMinuten: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t("kueche.portions")}</label>
              <input
                type="number"
                min="1"
                value={form.portionen}
                onChange={(e) => setForm((f) => ({ ...f, portionen: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t("kueche.difficulty")}</label>
            <div className="flex gap-2 flex-wrap">
              {["einfach", "mittel", "schwer"].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, schwierigkeit: f.schwierigkeit === s ? "" : s }))}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors capitalize ${
                    form.schwierigkeit === s
                      ? s === "einfach" ? "bg-green-100 border-green-400 text-green-700" : s === "mittel" ? "bg-yellow-100 border-yellow-400 text-yellow-700" : "bg-red-100 border-red-400 text-red-700"
                      : "bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.favorit}
              onChange={(e) => setForm((f) => ({ ...f, favorit: e.target.checked }))}
              className="w-4 h-4 rounded accent-orange-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">{t("kueche.favorites")}</span>
          </label>
        </div>

        {/* Zutaten */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 space-y-3">
          <h2 className="font-semibold text-gray-900 dark:text-white">{t("kueche.ingredients")}</h2>
          <div className="flex gap-2">
            <input
              type="text"
              value={zutatInput}
              onChange={(e) => setZutatInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addZutat())}
              placeholder={t("kueche.ingredients") + "…"}
              className="flex-1 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <button type="button" onClick={addZutat} className="px-3 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl transition-colors">
              <Plus className="h-4 w-4" />
            </button>
          </div>
          {zutaten.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {zutaten.map((z) => (
                <span key={z} className="flex items-center gap-1 bg-orange-50 dark:bg-orange-950 text-orange-700 dark:text-orange-300 px-2.5 py-1 rounded-lg text-sm">
                  {z}
                  <button type="button" onClick={() => setZutaten((arr) => arr.filter((x) => x !== z))}><X className="h-3 w-3" /></button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Tags */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 space-y-3">
          <h2 className="font-semibold text-gray-900 dark:text-white">{t("kueche.tags")}</h2>
          <div className="flex gap-2">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
              placeholder={t("kueche.tags") + "…"}
              className="flex-1 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <button type="button" onClick={addTag} className="px-3 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl transition-colors">
              <Plus className="h-4 w-4" />
            </button>
          </div>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tags.map((t) => (
                <span key={t} className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-2.5 py-1 rounded-lg text-sm">
                  #{t}
                  <button type="button" onClick={() => setTags((arr) => arr.filter((x) => x !== t))}><X className="h-3 w-3" /></button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Notizen */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t("kueche.notes")}</label>
          <textarea
            rows={3}
            value={form.notizen}
            onChange={(e) => setForm((f) => ({ ...f, notizen: e.target.value }))}
            placeholder={t("kueche.notesTip")}
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>

        <div className="flex gap-3">
          <Link href="/kueche" className="flex-1 py-2.5 text-center rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            Abbrechen
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2"
          >
            {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <ChefHat className="h-4 w-4" />}
            {loading ? t("haushalt.saving") : t("kueche.new")}
          </button>
        </div>
      </form>
    </div>
  );
}
