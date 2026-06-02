"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Plus, Search, Star, ChefHat, Clock, Sparkles, HelpCircle } from "lucide-react";

interface Gericht {
  _id: string;
  name: string;
  kochgeraet: string;
  programm?: string;
  zeitMinuten?: number;
  portionen?: number;
  schwierigkeit?: string;
  favorit: boolean;
  gekochtAnzahl: number;
  tags: string[];
}

export default function KuechePage() {
  const [gerichte, setGerichte] = useState<Gericht[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [nurFavoriten, setNurFavoriten] = useState(false);
  const [sortierung, setSortierung] = useState("name");

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ sortierung });
    if (search) params.set("suche", search);
    if (nurFavoriten) params.set("favoriten", "1");
    const res = await fetch(`/api/kueche/gerichte?${params}`);
    const data = await res.json();
    // Filter out AI-generated weekly plan recipes from main list
    const all: Gericht[] = Array.isArray(data) ? data : [];
    setGerichte(all.filter((g) => !g.tags.includes("ki-vorschlag")));
    setLoading(false);
  }, [search, nurFavoriten, sortierung]);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  const toggleFavorit = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    await fetch(`/api/kueche/gerichte/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ aktion: "favorit-umschalten" }),
    });
    load();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Küche</h1>
          <p className="text-sm text-gray-500">{gerichte.length} Gerichte</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href="/kueche/was-kochen"
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-2 rounded-xl text-sm font-medium transition-colors"
          >
            <HelpCircle className="h-4 w-4" />
            <span className="hidden sm:inline">Was kochen?</span>
            <span className="sm:hidden">Was kochen?</span>
          </Link>
          <Link
            href="/kueche/wochenplan"
            className="flex items-center gap-2 bg-purple-500 hover:bg-purple-600 text-white px-3 py-2 rounded-xl text-sm font-medium transition-colors"
          >
            <Sparkles className="h-4 w-4" />
            <span className="hidden sm:inline">KI-Wochenplan</span>
            <span className="sm:hidden">Wochenplan</span>
          </Link>
          <Link
            href="/kueche/neu"
            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-3 py-2 rounded-xl text-sm font-medium transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Neues Gericht</span>
            <span className="sm:hidden">Neu</span>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Gerichte suchen…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setNurFavoriten(!nurFavoriten)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-colors ${
              nurFavoriten
                ? "bg-yellow-100 border-yellow-300 text-yellow-800"
                : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400"
            }`}
          >
            <Star className="h-4 w-4" />
            Favoriten
          </button>
          <select
            value={sortierung}
            onChange={(e) => setSortierung(e.target.value)}
            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="name">Name A–Z</option>
            <option value="name-desc">Name Z–A</option>
            <option value="neueste">Neueste zuerst</option>
            <option value="zeit">Kürzeste Zeit</option>
            <option value="oft-gekocht">Oft gekocht</option>
            <option value="zuletzt-gekocht">Zuletzt gekocht</option>
          </select>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : gerichte.length === 0 ? (
        <div className="text-center py-20">
          <ChefHat className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">
            {search || nurFavoriten
              ? "Keine Ergebnisse gefunden."
              : "Noch keine Gerichte. Legen Sie das erste an!"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {gerichte.map((g) => (
            <Link
              key={g._id}
              href={`/kueche/${g._id}`}
              className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 hover:shadow-md transition-shadow group relative"
            >
              <button
                onClick={(e) => toggleFavorit(g._id, e)}
                className="absolute top-4 right-4 text-gray-300 hover:text-yellow-400 transition-colors"
              >
                <Star className={`h-5 w-5 ${g.favorit ? "fill-yellow-400 text-yellow-400" : ""}`} />
              </button>
              <h3 className="font-semibold text-gray-900 dark:text-white pr-8 mb-1 line-clamp-2">
                {g.name}
              </h3>
              <p className="text-sm text-orange-600 font-medium">{g.kochgeraet}</p>
              {g.programm && <p className="text-xs text-gray-400 mt-0.5">{g.programm}</p>}
              <div className="flex items-center gap-3 mt-3 text-xs text-gray-400">
                {g.zeitMinuten != null && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {g.zeitMinuten} Min.
                  </span>
                )}
                {g.portionen != null && <span>{g.portionen} Port.</span>}
                {g.schwierigkeit && <span className="capitalize">{g.schwierigkeit}</span>}
                {g.gekochtAnzahl > 0 && <span>× {g.gekochtAnzahl}</span>}
              </div>
              {g.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {g.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="text-xs bg-orange-50 dark:bg-orange-950 text-orange-600 px-2 py-0.5 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
