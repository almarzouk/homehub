"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import Link from "next/link";
import { Plus, Trash2, Settings, Users, Copy, Check, Shield, Layers } from "lucide-react";

interface Category { _id: string; name: string; color: string; }
interface Location { _id: string; name: string; icon: string; }
interface HouseholdMember { _id: string; name: string; email: string; }
interface Household { _id: string; name: string; inviteCode: string; memberCount: number; members: HouseholdMember[]; }

export default function EinstellungenPage() {
  const { t } = useTranslation();
  const [categories, setCategories] = useState<Category[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [household, setHousehold] = useState<Household | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  const [catName, setCatName] = useState("");
  const [catColor, setCatColor] = useState("#6b7280");
  const [locName, setLocName] = useState("");
  const [locIcon, setLocIcon] = useState("");
  const [catError, setCatError] = useState("");
  const [locError, setLocError] = useState("");
  const [saving, setSaving] = useState<"cat" | "loc" | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [c, l, h] = await Promise.all([
      fetch("/api/vorrat/kategorien").then((r) => r.json()),
      fetch("/api/vorrat/lagerorte").then((r) => r.json()),
      fetch("/api/mein-haushalt").then((r) => r.json()),
    ]);
    setCategories(Array.isArray(c) ? c : []);
    setLocations(Array.isArray(l) ? l : []);
    setHousehold(h.household ?? null);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const addCategory = async () => {
    if (!catName.trim()) return;
    setSaving("cat");
    setCatError("");
    const res = await fetch("/api/vorrat/kategorien", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: catName.trim(), color: catColor }),
    });
    const data = await res.json();
    if (!res.ok) { setCatError(data.error || "Fehler"); setSaving(null); return; }
    setCatName("");
    setSaving(null);
    load();
  };

  const deleteCategory = async (id: string) => {
    if (!confirm("Kategorie löschen?")) return;
    await fetch(`/api/vorrat/kategorien/${id}`, { method: "DELETE" });
    load();
  };

  const addLocation = async () => {
    if (!locName.trim()) return;
    setSaving("loc");
    setLocError("");
    const res = await fetch("/api/vorrat/lagerorte", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: locName.trim(), icon: locIcon }),
    });
    const data = await res.json();
    if (!res.ok) { setLocError(data.error || "Fehler"); setSaving(null); return; }
    setLocName("");
    setSaving(null);
    load();
  };

  const deleteLocation = async (id: string) => {
    if (!confirm("Lagerort löschen?")) return;
    await fetch(`/api/vorrat/lagerorte/${id}`, { method: "DELETE" });
    load();
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
          <Settings className="h-5 w-5 text-gray-600 dark:text-gray-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Einstellungen</h1>
          <p className="text-sm text-gray-500">Kategorien & Lagerorte verwalten</p>
        </div>
      </div>

      {/* Admin quick-actions */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link href="/einstellungen/mitglieder" className="flex items-center gap-4 p-4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 hover:border-blue-300 dark:hover:border-blue-700 transition-colors group">
          <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0">
            <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Mitglieder &amp; Berechtigungen</p>
            <p className="text-xs text-gray-400">Wer darf was sehen und bearbeiten?</p>
          </div>
        </Link>
        <Link href="/einstellungen/module" className="flex items-center gap-4 p-4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 hover:border-purple-300 dark:hover:border-purple-700 transition-colors group">
          <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900 flex items-center justify-center flex-shrink-0">
            <Layers className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <p className="font-semibold text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">App-Bereiche verwalten</p>
            <p className="text-xs text-gray-400">Module für den ganzen Haushalt ein-/ausschalten</p>
          </div>
        </Link>
      </section>

      {loading ? (
        <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <>
          {/* Household Info */}
          {household ? (
            <section className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-500" />
                Mein Haushalt
              </h2>
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">{household.name}</p>
                    <p className="text-sm text-gray-500">{household.memberCount} {household.memberCount === 1 ? "Mitglied" : t("einstellungen.members")}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400 mb-1">Einladungscode</p>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-lg font-bold text-blue-600 dark:text-blue-400 tracking-widest">{household.inviteCode}</span>
                      <button
                        onClick={() => { navigator.clipboard.writeText(household.inviteCode); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                        className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950 text-gray-400 hover:text-blue-600 transition-colors"
                        title={t("einstellungen.copyCode")}>
                        {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>
                {household.members.length > 0 && (
                  <div className="border-t border-gray-100 dark:border-gray-800 pt-3 space-y-2">
                    {household.members.map((m) => (
                      <div key={m._id} className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {m.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{m.name}</p>
                          <p className="text-xs text-gray-400">{m.email}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-xs text-gray-400">Teile den Einladungscode mit Familienmitgliedern, damit sie beim Registrieren beitreten können.</p>
              </div>
            </section>
          ) : (
            <section className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Users className="h-5 w-5 text-orange-500" />
                Haushalt einrichten
              </h2>
              <div className="bg-orange-50 dark:bg-orange-950/30 rounded-2xl border border-orange-200 dark:border-orange-900 p-5">
                <p className="text-sm text-orange-800 dark:text-orange-300 mb-3">
                  Dein Konto ist noch keinem Haushalt zugeordnet. Klicke unten, um automatisch einen Haushalt zu erstellen.
                </p>
                <button
                  onClick={async () => {
                    const res = await fetch("/api/haushalt-migration", { method: "POST" });
                    const data = await res.json();
                    if (data.ok) { alert(`Haushalt erstellt! Einladungscode: ${data.inviteCode}\n\nBitte melde dich erneut an.`); load(); }
                    else alert(data.error);
                  }}
                  className="px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-medium transition-colors"
                >
                  Haushalt einrichten
                </button>
              </div>
            </section>
          )}
          {/* Kategorien */}
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Produktkategorien</h2>
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 space-y-3">
              {catError && <p className="text-sm text-red-600">{catError}</p>}
              <div className="flex gap-2">
                <input type="color" value={catColor} onChange={(e) => setCatColor(e.target.value)} className="w-10 h-10 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer" />
                <input type="text" value={catName} onChange={(e) => setCatName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addCategory()} placeholder="Kategoriename"
                  className="flex-1 px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <button onClick={addCategory} disabled={saving === "cat" || !catName.trim()} className="px-4 py-2.5 bg-blue-500 hover:bg-blue-600 disabled:opacity-60 text-white rounded-xl text-sm transition-colors">
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              {categories.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-2">Noch keine Kategorien.</p>
              ) : (
                <div className="divide-y divide-gray-50 dark:divide-gray-800">
                  {categories.map((c) => (
                    <div key={c._id} className="flex items-center gap-3 py-2.5">
                      <span className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: c.color }} />
                      <span className="flex-1 text-sm text-gray-900 dark:text-white">{c.name}</span>
                      <button onClick={() => deleteCategory(c._id)} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950 text-red-400 hover:text-red-600 rounded-lg transition-colors">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Lagerorte */}
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Lagerorte</h2>
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 space-y-3">
              {locError && <p className="text-sm text-red-600">{locError}</p>}
              <div className="flex gap-2">
                <input type="text" value={locIcon} onChange={(e) => setLocIcon(e.target.value)} placeholder="Icon"
                  className="w-12 px-2 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-center text-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <input type="text" value={locName} onChange={(e) => setLocName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addLocation()} placeholder="Lagerortname"
                  className="flex-1 px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <button onClick={addLocation} disabled={saving === "loc" || !locName.trim()} className="px-4 py-2.5 bg-blue-500 hover:bg-blue-600 disabled:opacity-60 text-white rounded-xl text-sm transition-colors">
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              {locations.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-2">Noch keine Lagerorte.</p>
              ) : (
                <div className="divide-y divide-gray-50 dark:divide-gray-800">
                  {locations.map((l) => (
                    <div key={l._id} className="flex items-center gap-3 py-2.5">
                      <span className="text-lg">{l.icon}</span>
                      <span className="flex-1 text-sm text-gray-900 dark:text-white">{l.name}</span>
                      <button onClick={() => deleteLocation(l._id)} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950 text-red-400 hover:text-red-600 rounded-lg transition-colors">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
