"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import Link from "next/link";
import { Plus, Trash2, Settings, Users, Copy, Check, Shield, Layers, Package, MapPin } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { LoadingState } from "@/components/ui/LoadingState";
import { EmptyState } from "@/components/ui/EmptyState";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import { toast } from "@/components/ui/Toast";

interface Category { _id: string; name: string; color: string; }
interface Location { _id: string; name: string; icon: string; }
interface HouseholdMember { _id: string; name: string; email: string; }
interface Household { _id: string; name: string; inviteCode: string; memberCount: number; members: HouseholdMember[]; }

export default function EinstellungenPage() {
  const { t } = useTranslation();
  const { confirm, ConfirmDialogComponent } = useConfirm();
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
    try {
      const [c, l, h] = await Promise.all([
        fetch("/api/vorrat/kategorien").then((r) => r.json()),
        fetch("/api/vorrat/lagerorte").then((r) => r.json()),
        fetch("/api/mein-haushalt").then((r) => r.json()),
      ]);
      setCategories(Array.isArray(c) ? c : []);
      setLocations(Array.isArray(l) ? l : []);
      setHousehold(h.household ?? null);
    } catch {
      toast("error", t("common.error"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => { load(); }, [load]);

  const addCategory = async () => {
    if (!catName.trim()) return;
    setSaving("cat");
    setCatError("");
    try {
      const res = await fetch("/api/vorrat/kategorien", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: catName.trim(), color: catColor }),
      });
      const data = await res.json();
      if (!res.ok) { setCatError(data.error || t("common.error")); return; }
      setCatName("");
      toast("success", t("common.success"));
      load();
    } catch {
      setCatError(t("common.error"));
    } finally {
      setSaving(null);
    }
  };

  const deleteCategory = async (id: string) => {
    confirm({
      title: t("common.delete"),
      message: `${t("common.delete")} — ${categories.find(c => c._id === id)?.name}`,
      variant: "danger",
      onConfirm: async () => {
        await fetch(`/api/vorrat/kategorien/${id}`, { method: "DELETE" });
        toast("success", t("common.success"));
        load();
      },
    });
  };

  const addLocation = async () => {
    if (!locName.trim()) return;
    setSaving("loc");
    setLocError("");
    try {
      const res = await fetch("/api/vorrat/lagerorte", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: locName.trim(), icon: locIcon }),
      });
      const data = await res.json();
      if (!res.ok) { setLocError(data.error || t("common.error")); return; }
      setLocName("");
      toast("success", t("common.success"));
      load();
    } catch {
      setLocError(t("common.error"));
    } finally {
      setSaving(null);
    }
  };

  const deleteLocation = async (id: string) => {
    confirm({
      title: t("common.delete"),
      message: `${t("common.delete")} — ${locations.find(l => l._id === id)?.name}`,
      variant: "danger",
      onConfirm: async () => {
        await fetch(`/api/vorrat/lagerorte/${id}`, { method: "DELETE" });
        toast("success", t("common.success"));
        load();
      },
    });
  };

  const copyCode = () => {
    if (!household) return;
    navigator.clipboard.writeText(household.inviteCode);
    setCopied(true);
    toast("success", t("einstellungen.copied"));
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <ConfirmDialogComponent />

      <PageHeader
        title={t("einstellungen.title")}
        icon={Settings}
      />

      {/* Quick-actions */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-3 stagger-children">
        <Link
          href="/einstellungen/mitglieder"
          className="flex items-center gap-4 p-4 rounded-2xl border card-hover"
          style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}
        >
          <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center flex-shrink-0">
            <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>
              {t("einstellungen.members")}
            </p>
            <p className="text-xs" style={{ color: "var(--muted)" }}>
              Wer darf was sehen und bearbeiten?
            </p>
          </div>
        </Link>
        <Link
          href="/einstellungen/module"
          className="flex items-center gap-4 p-4 rounded-2xl border card-hover"
          style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}
        >
          <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center flex-shrink-0">
            <Layers className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>
              {t("einstellungen.modules")}
            </p>
            <p className="text-xs" style={{ color: "var(--muted)" }}>
              {t("einstellungen.moduleVisibility")}
            </p>
          </div>
        </Link>
      </section>

      {loading ? (
        <LoadingState />
      ) : (
        <>
          {/* Household Info */}
          {household ? (
            <section className="space-y-4">
              <h2 className="text-sm font-semibold flex items-center gap-2" style={{ color: "var(--foreground)" }}>
                <Users className="h-4 w-4 text-blue-500" />
                {t("einstellungen.household")}
              </h2>
              <div className="rounded-2xl border p-5 space-y-4" style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}>
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-semibold" style={{ color: "var(--foreground)" }}>{household.name}</p>
                    <p className="text-sm" style={{ color: "var(--muted)" }}>
                      {household.memberCount} {t("einstellungen.members")}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs mb-1" style={{ color: "var(--muted)" }}>{t("einstellungen.inviteCode")}</p>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-lg font-bold text-blue-600 dark:text-blue-400 tracking-widest">
                        {household.inviteCode}
                      </span>
                      <button
                        onClick={copyCode}
                        className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/30 text-gray-400 hover:text-blue-600 transition-colors"
                        title={t("einstellungen.copyCode")}
                      >
                        {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>
                {household.members.length > 0 && (
                  <div className="border-t pt-3 space-y-2" style={{ borderColor: "var(--card-border)" }}>
                    {household.members.map((m) => (
                      <div key={m._id} className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {m.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>{m.name}</p>
                          <p className="text-xs truncate" style={{ color: "var(--muted)" }}>{m.email}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          ) : (
            <section className="rounded-2xl border p-5" style={{ background: "var(--warning-subtle)", borderColor: "var(--warning)" }}>
              <p className="text-sm text-amber-800 dark:text-amber-300 mb-3">
                Dein Konto ist noch keinem Haushalt zugeordnet.
              </p>
              <button
                onClick={async () => {
                  const res = await fetch("/api/haushalt-migration", { method: "POST" });
                  const data = await res.json();
                  if (data.ok) { toast("success", "Haushalt erstellt!"); load(); }
                  else toast("error", data.error);
                }}
                className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-medium transition-colors btn-press"
              >
                {t("einstellungen.household")} einrichten
              </button>
            </section>
          )}

          {/* Kategorien */}
          <section className="space-y-4">
            <h2 className="text-sm font-semibold flex items-center gap-2" style={{ color: "var(--foreground)" }}>
              <Package className="h-4 w-4 text-blue-500" />
              {t("einstellungen.categories")}
            </h2>
            <div className="rounded-2xl border p-5 space-y-3" style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}>
              {catError && <p className="text-sm text-red-600">{catError}</p>}
              <div className="flex gap-2">
                <input
                  type="color"
                  value={catColor}
                  onChange={(e) => setCatColor(e.target.value)}
                  className="w-10 h-10 rounded-lg border cursor-pointer"
                  style={{ borderColor: "var(--card-border)" }}
                />
                <input
                  type="text"
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addCategory()}
                  placeholder="Kategoriename"
                  className="flex-1 px-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{ background: "var(--card-bg)", borderColor: "var(--card-border)", color: "var(--foreground)" }}
                />
                <button
                  onClick={addCategory}
                  disabled={saving === "cat" || !catName.trim()}
                  className="px-4 py-2.5 bg-blue-500 hover:bg-blue-600 disabled:opacity-60 text-white rounded-xl text-sm transition-colors btn-press"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              {categories.length === 0 ? (
                <EmptyState
                  icon={Package}
                  title={t("einstellungen.noCategories")}
                  className="py-8"
                />
              ) : (
                <div className="divide-y" style={{ borderColor: "var(--card-border)" }}>
                  {categories.map((c) => (
                    <div key={c._id} className="flex items-center gap-3 py-2.5">
                      <span className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: c.color }} />
                      <span className="flex-1 text-sm" style={{ color: "var(--foreground)" }}>{c.name}</span>
                      <button
                        onClick={() => deleteCategory(c._id)}
                        className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/30 text-gray-400 hover:text-red-500 rounded-lg transition-colors"
                      >
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
            <h2 className="text-sm font-semibold flex items-center gap-2" style={{ color: "var(--foreground)" }}>
              <MapPin className="h-4 w-4 text-blue-500" />
              {t("einstellungen.locations")}
            </h2>
            <div className="rounded-2xl border p-5 space-y-3" style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}>
              {locError && <p className="text-sm text-red-600">{locError}</p>}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={locIcon}
                  onChange={(e) => setLocIcon(e.target.value)}
                  placeholder="😀"
                  className="w-12 px-2 py-2.5 rounded-xl border text-center text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}
                />
                <input
                  type="text"
                  value={locName}
                  onChange={(e) => setLocName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addLocation()}
                  placeholder="Lagerortname"
                  className="flex-1 px-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{ background: "var(--card-bg)", borderColor: "var(--card-border)", color: "var(--foreground)" }}
                />
                <button
                  onClick={addLocation}
                  disabled={saving === "loc" || !locName.trim()}
                  className="px-4 py-2.5 bg-blue-500 hover:bg-blue-600 disabled:opacity-60 text-white rounded-xl text-sm transition-colors btn-press"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              {locations.length === 0 ? (
                <EmptyState
                  icon={MapPin}
                  title={t("einstellungen.noLocations")}
                  className="py-8"
                />
              ) : (
                <div className="divide-y" style={{ borderColor: "var(--card-border)" }}>
                  {locations.map((l) => (
                    <div key={l._id} className="flex items-center gap-3 py-2.5">
                      <span className="text-lg">{l.icon}</span>
                      <span className="flex-1 text-sm" style={{ color: "var(--foreground)" }}>{l.name}</span>
                      <button
                        onClick={() => deleteLocation(l._id)}
                        className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/30 text-gray-400 hover:text-red-500 rounded-lg transition-colors"
                      >
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
