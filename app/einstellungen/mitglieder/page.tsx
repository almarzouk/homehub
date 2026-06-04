"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import Link from "next/link";
import {
  ArrowLeft, Shield, ShieldCheck, ShieldOff, Users, Eye, EyeOff, Pencil, Lock, Crown, RotateCcw,
  LayoutDashboard, ChefHat, Package, Wallet, Sparkles, Pill, Gift, FileText, Map, ArrowLeftRight, UserRound, Calendar,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface Member {
  _id: string;
  name: string;
  email: string;
}

interface ModuleDef {
  key: string;
  label_de: string;
  beschreibung_de: string;
  Icon: LucideIcon;
  color: string;
  group: string;
  defaultViewForMembers: boolean;
  defaultEditForMembers: boolean;
}

interface Permission {
  view: boolean;
  edit: boolean;
}

type MemberPerms = Record<string, Permission>;
type AllPerms = Record<string, MemberPerms>;

const MODULES: ModuleDef[] = [
  { key: "uebersicht",     label_de: "Übersicht",       beschreibung_de: "Dashboard",                       Icon: LayoutDashboard, color: "#3B82F6", group: "tab",  defaultViewForMembers: true,  defaultEditForMembers: true  },
  { key: "kueche",         label_de: "Küche",           beschreibung_de: "Rezepte & Kochgeräte",            Icon: ChefHat,         color: "#F97316", group: "tab",  defaultViewForMembers: true,  defaultEditForMembers: true  },
  { key: "vorrat",         label_de: "Vorrat",          beschreibung_de: "Lagerbestand",                    Icon: Package,         color: "#10B981", group: "tab",  defaultViewForMembers: true,  defaultEditForMembers: true  },
  { key: "finanzen",       label_de: "Finanzen",        beschreibung_de: "Ausgaben & Investitionen",        Icon: Wallet,          color: "#8B5CF6", group: "tab",  defaultViewForMembers: false, defaultEditForMembers: false },
  { key: "haushalt",       label_de: "Haushalt",        beschreibung_de: "Aufgaben & Reinigung",            Icon: Sparkles,        color: "#06B6D4", group: "mehr", defaultViewForMembers: true,  defaultEditForMembers: true  },
  { key: "medikamente",    label_de: "Medikamente",     beschreibung_de: "Vorrat & Dosierungen",            Icon: Pill,            color: "#EF4444", group: "mehr", defaultViewForMembers: true,  defaultEditForMembers: true  },
  { key: "wunschliste",    label_de: "Wunschliste",     beschreibung_de: "Kaufziele & Wünsche",             Icon: Gift,            color: "#8B5CF6", group: "mehr", defaultViewForMembers: true,  defaultEditForMembers: true  },
  { key: "dokumente",      label_de: "Dokumente",       beschreibung_de: "Verträge & Ausweise",             Icon: FileText,        color: "#3B82F6", group: "mehr", defaultViewForMembers: true,  defaultEditForMembers: true  },
  { key: "einkaufsrouten", label_de: "Einkaufsrouten", beschreibung_de: "Gänge & Routen",                  Icon: Map,             color: "#10B981", group: "mehr", defaultViewForMembers: true,  defaultEditForMembers: true  },
  { key: "bewegungen",     label_de: "Lagerbewegungen", beschreibung_de: "Ein- & Ausgänge",                Icon: ArrowLeftRight,  color: "#3B82F6", group: "mehr", defaultViewForMembers: true,  defaultEditForMembers: false },
  { key: "familie",        label_de: "Familie",         beschreibung_de: "Mitglieder & Benachrichtigungen", Icon: UserRound,       color: "#EC4899", group: "mehr", defaultViewForMembers: true,  defaultEditForMembers: false },
  { key: "termine",        label_de: "Termine",         beschreibung_de: "Kalender & Termine",              Icon: Calendar,        color: "#F59E0B", group: "mehr", defaultViewForMembers: true,  defaultEditForMembers: true  },
];

export default function MitgliederPage() {
  const { t } = useTranslation();
  const [members, setMembers] = useState<Member[]>([]);
  const [ownerId, setOwnerId] = useState("");
  const [coAdmins, setCoAdmins] = useState<string[]>([]);
  const [allPerms, setAllPerms] = useState<AllPerms>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [hhRes, permRes] = await Promise.all([
        fetch("/api/mein-haushalt").then((r) => r.json()),
        fetch("/api/mein-haushalt/berechtigungen").then((r) => r.json()),
      ]);
      const hh = hhRes.household;
      if (hh) {
        setMembers(hh.members ?? []);
        setOwnerId(permRes.ownerId ?? "");
        setCoAdmins(permRes.coAdmins ?? []);
        setAllPerms(permRes.memberPermissions ?? {});
        if (hh.members?.length > 0 && !selected) {
          setSelected(hh.members[0]._id);
        }
      }
    } catch {
      setError("Ladefehler");
    } finally {
      setLoading(false);
    }
  }, [selected]);

  useEffect(() => { load(); }, [load]);

  const getPerms = (userId: string): MemberPerms => {
    const stored = allPerms[userId] ?? {};
    const result: MemberPerms = {};
    for (const m of MODULES) {
      result[m.key] = stored[m.key] ?? { view: m.defaultViewForMembers, edit: m.defaultEditForMembers };
    }
    return result;
  };

  const setPerm = (userId: string, moduleKey: string, action: "view" | "edit", value: boolean) => {
    setAllPerms((prev) => {
      const userPerms = { ...(prev[userId] ?? {}) };
      const current = userPerms[moduleKey] ?? { view: false, edit: false };
      const updated = { ...current, [action]: value };
      // Editing requires viewing
      if (action === "edit" && value) updated.view = true;
      if (action === "view" && !value) updated.edit = false;
      userPerms[moduleKey] = updated;
      return { ...prev, [userId]: userPerms };
    });
  };

  const resetToDefaults = (userId: string) => {
    const defaults: MemberPerms = {};
    for (const m of MODULES) {
      defaults[m.key] = { view: m.defaultViewForMembers, edit: m.defaultEditForMembers };
    }
    setAllPerms((prev) => ({ ...prev, [userId]: defaults }));
  };

  const grantAll = (userId: string) => {
    const full: MemberPerms = {};
    for (const m of MODULES) full[m.key] = { view: true, edit: true };
    setAllPerms((prev) => ({ ...prev, [userId]: full }));
  };

  const revokeAll = (userId: string) => {
    const none: MemberPerms = {};
    for (const m of MODULES) none[m.key] = { view: false, edit: false };
    setAllPerms((prev) => ({ ...prev, [userId]: none }));
  };

  const save = async (userId: string) => {
    setSaving(userId);
    setError("");
    try {
      const res = await fetch("/api/mein-haushalt/berechtigungen", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "member", userId, permissions: allPerms[userId] ?? {} }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setSaved(userId);
      setTimeout(() => setSaved(null), 2000);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(null);
    }
  };

  const toggleCoAdmin = async (userId: string) => {
    const isCo = coAdmins.includes(userId);
    try {
      const res = await fetch("/api/mein-haushalt/berechtigungen", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "coadmin", userId, isCoAdmin: !isCo }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setCoAdmins((prev) =>
        isCo ? prev.filter((id) => id !== userId) : [...prev, userId]
      );
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const selectedMember = members.find((m) => m._id === selected);
  const isOwnerSelected = selected === ownerId;
  const isCoAdminSelected = selected ? coAdmins.includes(selected) : false;

  const tabs = MODULES.filter((m) => m.group === "tab");
  const mehr = MODULES.filter((m) => m.group === "mehr");

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className=" mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/einstellungen" className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
          <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Mitglieder & Berechtigungen</h1>
          <p className="text-sm text-gray-500">Lege fest, wer welche App-Bereiche sehen und bearbeiten darf</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3 text-sm text-red-700 dark:text-red-400">{error}</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Member list */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 space-y-2">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide px-2 pb-1">{t("einstellungen.members")}</h2>
          {members.length === 0 && (
            <p className="text-sm text-gray-400 px-2">Keine Mitglieder im Haushalt.</p>
          )}
          {members.map((m) => {
            const isOwner = m._id === ownerId;
            const isCo = coAdmins.includes(m._id);
            const active = selected === m._id;
            return (
              <button
                key={m._id}
                onClick={() => setSelected(m._id)}
                className={`w-full text-left px-3 py-2.5 rounded-xl transition-colors flex items-center gap-3 ${
                  active
                    ? "bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800"
                    : "hover:bg-gray-50 dark:hover:bg-gray-800"
                }`}
              >
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                  isOwner ? "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300" :
                  isCo ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300" :
                  "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                }`}>
                  {m.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium text-gray-900 dark:text-white truncate">{m.name}</span>
                    {isOwner && <Crown className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />}
                    {isCo && !isOwner && <ShieldCheck className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />}
                  </div>
                  <p className="text-xs text-gray-400 truncate">{m.email}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Permission editor */}
        <div className="md:col-span-2 space-y-4">
          {!selectedMember ? (
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-8 text-center">
              <Users className="h-8 w-8 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-400">Mitglied auswählen</p>
            </div>
          ) : (
            <>
              {/* Member header */}
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-sm font-bold text-blue-700 dark:text-blue-300">
                    {selectedMember.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900 dark:text-white">{selectedMember.name}</span>
                      {isOwnerSelected && <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300">Besitzer</span>}
                      {isCoAdminSelected && !isOwnerSelected && <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">Co-Admin</span>}
                    </div>
                    <p className="text-sm text-gray-400">{selectedMember.email}</p>
                  </div>

                  {/* Action buttons */}
                  {!isOwnerSelected && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleCoAdmin(selected!)}
                        title={isCoAdminSelected ? "Co-Admin entfernen" : "Zum Co-Admin ernennen"}
                        className={`p-2 rounded-lg transition-colors ${
                          isCoAdminSelected
                            ? "bg-blue-100 text-blue-600 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-400"
                            : "bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400"
                        }`}
                      >
                        <Shield className="h-4 w-4" />
                      </button>
                      <button onClick={() => resetToDefaults(selected!)} title="Standard wiederherstellen" className="p-2 rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 transition-colors">
                        <RotateCcw className="h-4 w-4" />
                      </button>
                      <button onClick={() => grantAll(selected!)} title="Alles erlauben" className="p-2 rounded-lg bg-green-100 text-green-600 hover:bg-green-200 dark:bg-green-900 dark:text-green-400 transition-colors">
                        <ShieldCheck className="h-4 w-4" />
                      </button>
                      <button onClick={() => revokeAll(selected!)} title="Alles sperren" className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900 dark:text-red-400 transition-colors">
                        <ShieldOff className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>

                {isOwnerSelected && (
                  <div className="mt-3 px-3 py-2 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-700 dark:text-amber-400">
                    Der Besitzer hat immer vollen Zugriff auf alle Bereiche.
                  </div>
                )}
                {isCoAdminSelected && !isOwnerSelected && (
                  <div className="mt-3 px-3 py-2 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-xl text-xs text-blue-700 dark:text-blue-400">
                    Co-Admins haben immer vollen Zugriff auf alle Bereiche.
                  </div>
                )}
              </div>

              {/* Permission grid */}
              {!isOwnerSelected && !isCoAdminSelected && (
                <>
                  {[{ title: "Haupt-Tabs", items: tabs }, { title: "Mehr-Bereiche", items: mehr }].map(({ title, items }) => (
                    <div key={title} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
                      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">{title}</h3>
                        <div className="flex items-center gap-6 text-xs text-gray-400 pr-2">
                          <div className="flex items-center gap-1"><Eye className="h-3 w-3" /> Anzeigen</div>
                          <div className="flex items-center gap-1"><Pencil className="h-3 w-3" /> Bearbeiten</div>
                        </div>
                      </div>

                      {items.map((mod) => {
                        const p = getPerms(selected!)[mod.key] ?? { view: false, edit: false };
                        return (
                          <div key={mod.key} className="flex items-center gap-3 px-4 py-3 border-b border-gray-50 dark:border-gray-800 last:border-0">
                            <div className="w-7 h-7 flex items-center justify-center rounded-lg flex-shrink-0" style={{ backgroundColor: mod.color + "22" }}>
                              <mod.Icon className="h-4 w-4" style={{ color: mod.color }} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 dark:text-white">{mod.label_de}</p>
                              <p className="text-xs text-gray-400">{mod.beschreibung_de}</p>
                            </div>
                            <div className="flex items-center gap-6 flex-shrink-0">
                              {/* View toggle */}
                              <button
                                onClick={() => setPerm(selected!, mod.key, "view", !p.view)}
                                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                                  p.view
                                    ? "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400"
                                    : "bg-gray-100 text-gray-300 dark:bg-gray-800 dark:text-gray-600"
                                }`}
                              >
                                {p.view ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                              </button>

                              {/* Edit toggle */}
                              <button
                                onClick={() => setPerm(selected!, mod.key, "edit", !p.edit)}
                                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                                  p.edit
                                    ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900 dark:text-emerald-400"
                                    : "bg-gray-100 text-gray-300 dark:bg-gray-800 dark:text-gray-600"
                                }`}
                              >
                                {p.edit ? <Pencil className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))}

                  <button
                    onClick={() => save(selected!)}
                    disabled={saving !== null}
                    className="w-full py-3 bg-blue-500 hover:bg-blue-600 disabled:opacity-60 text-white rounded-2xl font-semibold transition-colors flex items-center justify-center gap-2"
                  >
                    {saving === selected ? (
                      <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Wird gespeichert…</>
                    ) : saved === selected ? (
                      <><ShieldCheck className="h-4 w-4" /> Gespeichert!</>
                    ) : (
                      <><Shield className="h-4 w-4" /> Berechtigungen speichern</>
                    )}
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
