"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import {
  Home, Package, Wallet, ChevronLeft, Check, Loader2,
  Copy, CheckCircle2, Grid3x3, ChevronRight, X, Plus,
} from "lucide-react";
import { MODULE_REGISTRY, ModuleKey } from "@/lib/modules";
import { toCents, getCurrentMonth } from "@/lib/utils";

// ─── Types ──────────────────────────────────────────────────────────────────

interface Category {
  name: string;
  color: string;
}

interface Location {
  name: string;
  icon: string;
}

interface FixkostenEntry {
  name: string;
  betrag: string;
  kategorie: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const CATEGORY_COLORS = [
  "#EF4444", "#F97316", "#EAB308", "#22C55E",
  "#06B6D4", "#3B82F6", "#8B5CF6", "#EC4899",
  "#6B7280", "#10B981",
];

const CATEGORY_PRESETS: Category[] = [
  { name: "Lebensmittel", color: "#22C55E" },
  { name: "Getränke", color: "#3B82F6" },
  { name: "Reinigung", color: "#06B6D4" },
  { name: "Hygiene", color: "#8B5CF6" },
  { name: "Tierbedarf", color: "#F97316" },
  { name: "Haushalt", color: "#EAB308" },
];

const LOCATION_PRESETS: Location[] = [
  { name: "Kühlschrank", icon: "❄️" },
  { name: "Gefrierfach", icon: "🧊" },
  { name: "Speisekammer", icon: "🚪" },
  { name: "Keller", icon: "🏚️" },
  { name: "Badschrank", icon: "🛁" },
  { name: "Garage", icon: "🚗" },
];

const FIXKOSTEN_PRESETS = [
  { name: "Miete", kategorie: "wohnen" },
  { name: "Strom & Gas", kategorie: "wohnen" },
  { name: "Internet", kategorie: "kommunikation" },
  { name: "Handy", kategorie: "kommunikation" },
  { name: "Netflix", kategorie: "streaming" },
  { name: "Spotify", kategorie: "streaming" },
  { name: "Krankenversicherung", kategorie: "versicherung" },
  { name: "KFZ-Versicherung", kategorie: "versicherung" },
];

// Modules shown in the wizard (exclude einstellungen — always available)
const WIZARD_MODULES = MODULE_REGISTRY.filter((m) => m.key !== "einstellungen");

// ─── Step indicator ───────────────────────────────────────────────────────────

function StepBar({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex gap-1.5 px-6 pt-5 pb-1">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className="h-1 flex-1 rounded-full transition-all duration-300"
          style={{ background: i <= current ? "var(--primary, #3B82F6)" : "var(--card-border, #E5E7EB)" }}
        />
      ))}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function SetupPage() {
  const { update: updateSession } = useSession();

  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  // Step 0: household
  const [householdName, setHouseholdName] = useState("");
  const [inviteCode, setInviteCode] = useState("");

  // Step 1: modules
  const [enabledModules, setEnabledModules] = useState<ModuleKey[]>(
    WIZARD_MODULES.map((m) => m.key)
  );

  // Step 2: inventory
  const [categories, setCategories] = useState<Category[]>([{ name: "", color: "#22C55E" }]);
  const [locations, setLocations] = useState<Location[]>([{ name: "", icon: "📦" }]);

  // Step 3: finance
  const [salary, setSalary] = useState("");
  const [fixkosten, setFixkosten] = useState<FixkostenEntry[]>([
    { name: "", betrag: "", kategorie: "sonstiges" },
  ]);

  // Summary counts for done step
  const [savedCats, setSavedCats] = useState(0);
  const [savedLocs, setSavedLocs] = useState(0);

  // Load household data on mount
  useEffect(() => {
    fetch("/api/mein-haushalt")
      .then((r) => r.json())
      .then((data) => {
        if (data.household) {
          setHouseholdName(data.household.name ?? "");
          setInviteCode(data.household.inviteCode ?? "");
        }
      })
      .catch(() => {});
  }, []);

  // ─── Step navigation helpers ─────────────────────────────────────────────

  const saveStep0 = useCallback(async () => {
    if (!householdName.trim()) return;
    await fetch("/api/mein-haushalt", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: householdName.trim() }),
    });
  }, [householdName]);

  const saveStep1 = useCallback(async () => {
    const validKeys = enabledModules.filter((k) =>
      WIZARD_MODULES.some((m) => m.key === k)
    );
    await fetch("/api/mein-haushalt/berechtigungen", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "modules", enabledModules: validKeys }),
    });
  }, [enabledModules]);

  const saveStep2 = useCallback(async () => {
    const validCats = categories.filter((c) => c.name.trim());
    const validLocs = locations.filter((l) => l.name.trim());

    await Promise.all([
      ...validCats.map((c) =>
        fetch("/api/vorrat/kategorien", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: c.name.trim(), color: c.color }),
        })
      ),
      ...validLocs.map((l) =>
        fetch("/api/vorrat/lagerorte", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: l.name.trim(), icon: l.icon }),
        })
      ),
    ]);

    setSavedCats(validCats.length);
    setSavedLocs(validLocs.length);
  }, [categories, locations]);

  const saveStep3 = useCallback(async () => {
    if (salary && parseFloat(salary) > 0) {
      await fetch("/api/finanzen/gehalt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          betrag: toCents(parseFloat(salary)),
          monat: getCurrentMonth(),
          waehrung: "EUR",
        }),
      });
    }
    const validItems = fixkosten
      .filter((i) => i.name.trim() && parseFloat(i.betrag) > 0)
      .map((i) => ({
        name: i.name.trim(),
        betrag: toCents(parseFloat(i.betrag)),
        kategorie: i.kategorie,
        aktiv: true,
      }));
    if (validItems.length > 0) {
      await fetch("/api/finanzen/fixkosten", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validItems),
      });
    }
  }, [salary, fixkosten]);

  const handleNext = async () => {
    setSaving(true);
    try {
      if (step === 0) await saveStep0();
      if (step === 1) await saveStep1();
      if (step === 2) await saveStep2();
      if (step === 3) await saveStep3();
    } catch { /* ignore — user can still continue */ }
    setSaving(false);
    setStep((s) => s + 1);
  };

  const handleFinish = async () => {
    setSaving(true);
    try {
      await fetch("/api/setup/complete", { method: "POST" });
      await updateSession();
    } catch { /* ignore */ }
    // Hard redirect so the browser sends the freshly updated JWT cookie.
    // router.push + router.refresh caused a race where the middleware still
    // saw onboardingCompleted=false and bounced back to /setup.
    window.location.href = "/dashboard";
  };

  const copyInviteCode = () => {
    navigator.clipboard.writeText(inviteCode).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ─── Module toggle ────────────────────────────────────────────────────────

  const toggleModule = (key: ModuleKey) => {
    setEnabledModules((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  // ─── Category helpers ─────────────────────────────────────────────────────

  const addCategoryPreset = (preset: Category) => {
    const emptyIdx = categories.findIndex((c) => !c.name.trim());
    if (emptyIdx >= 0) {
      setCategories((prev) =>
        prev.map((c, i) => (i === emptyIdx ? preset : c))
      );
    } else {
      setCategories((prev) => [...prev, { ...preset }]);
    }
  };

  const addLocationPreset = (preset: Location) => {
    const emptyIdx = locations.findIndex((l) => !l.name.trim());
    if (emptyIdx >= 0) {
      setLocations((prev) =>
        prev.map((l, i) => (i === emptyIdx ? preset : l))
      );
    } else {
      setLocations((prev) => [...prev, { ...preset }]);
    }
  };

  // ─── Fixkosten helpers ────────────────────────────────────────────────────

  const addFixkostenPreset = (preset: { name: string; kategorie: string }) => {
    const emptyIdx = fixkosten.findIndex((i) => !i.name.trim());
    if (emptyIdx >= 0) {
      setFixkosten((prev) =>
        prev.map((row, i) => (i === emptyIdx ? { ...row, name: preset.name, kategorie: preset.kategorie } : row))
      );
    } else {
      setFixkosten((prev) => [...prev, { name: preset.name, betrag: "", kategorie: preset.kategorie }]);
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  const TOTAL_STEPS = 5; // 0=household, 1=modules, 2=inventory, 3=finance, 4=done

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "var(--background)" }}
    >
      <div
        className="w-full max-w-lg rounded-2xl shadow-2xl border overflow-hidden"
        style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}
      >
        {step < TOTAL_STEPS - 1 && <StepBar current={step} total={TOTAL_STEPS - 1} />}

        {/* ── Step 0: Household basics ──────────────────────────────────── */}
        {step === 0 && (
          <div className="p-6">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: "rgba(59,130,246,0.1)" }}
            >
              <Home className="h-7 w-7 text-blue-500" />
            </div>
            <h1 className="text-xl font-bold text-center mb-1" style={{ color: "var(--foreground)" }}>
              Willkommen bei HomeHub!
            </h1>
            <p className="text-sm text-center mb-6" style={{ color: "var(--muted)" }}>
              Lass uns deinen Haushalt einrichten. Das dauert nur wenige Minuten.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--foreground)" }}>
                  Name des Haushalts
                </label>
                <input
                  type="text"
                  value={householdName}
                  onChange={(e) => setHouseholdName(e.target.value)}
                  placeholder="z.B. Familie Müller"
                  className="w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                  style={{
                    background: "var(--muted-bg)",
                    borderColor: "var(--card-border)",
                    color: "var(--foreground)",
                  }}
                />
              </div>

              {inviteCode && (
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--foreground)" }}>
                    Einladungscode
                  </label>
                  <div className="flex gap-2">
                    <div
                      className="flex-1 px-4 py-2.5 rounded-xl border text-sm font-mono font-bold tracking-widest"
                      style={{
                        background: "var(--muted-bg)",
                        borderColor: "var(--card-border)",
                        color: "var(--foreground)",
                      }}
                    >
                      {inviteCode}
                    </div>
                    <button
                      type="button"
                      onClick={copyInviteCode}
                      className="px-3 rounded-xl border transition-colors flex items-center gap-1.5 text-sm"
                      style={{ borderColor: "var(--card-border)", color: "var(--muted)" }}
                    >
                      {copied ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                      {copied ? "Kopiert" : "Kopieren"}
                    </button>
                  </div>
                  <p className="text-xs mt-1.5" style={{ color: "var(--muted)" }}>
                    Teile diesen Code mit Haushaltsmitgliedern.
                  </p>
                </div>
              )}
            </div>

            <button
              onClick={handleNext}
              disabled={!householdName.trim() || saving}
              className="w-full mt-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Weiter
              {!saving && <ChevronRight className="h-4 w-4" />}
            </button>
          </div>
        )}

        {/* ── Step 1: Module selection ──────────────────────────────────── */}
        {step === 1 && (
          <div className="p-6">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: "rgba(139,92,246,0.1)" }}
            >
              <Grid3x3 className="h-7 w-7 text-purple-500" />
            </div>
            <h2 className="text-xl font-bold text-center mb-1" style={{ color: "var(--foreground)" }}>
              Welche Module möchtest du nutzen?
            </h2>
            <p className="text-sm text-center mb-5" style={{ color: "var(--muted)" }}>
              Du kannst das jederzeit in den Einstellungen ändern.
            </p>

            <div className="grid grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
              {WIZARD_MODULES.map((mod) => {
                const active = enabledModules.includes(mod.key);
                return (
                  <button
                    key={mod.key}
                    type="button"
                    onClick={() => toggleModule(mod.key)}
                    className="flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all text-sm"
                    style={{
                      borderColor: active ? mod.color : "var(--card-border)",
                      background: active ? `${mod.color}15` : "var(--muted-bg)",
                      color: active ? mod.color : "var(--muted)",
                    }}
                  >
                    <span className="text-base leading-none">
                      {getModuleEmoji(mod.key)}
                    </span>
                    <span className="font-medium truncate flex-1">{mod.label_de}</span>
                    {active && <Check className="h-3.5 w-3.5 flex-shrink-0" />}
                  </button>
                );
              })}
            </div>

            <p className="text-xs text-center mt-3 mb-5" style={{ color: "var(--muted)" }}>
              {enabledModules.length} von {WIZARD_MODULES.length} ausgewählt
            </p>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStep(0)}
                className="p-2.5 rounded-xl border transition-colors"
                style={{ borderColor: "var(--card-border)", color: "var(--muted)" }}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={handleNext}
                disabled={saving}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                Weiter
              </button>
            </div>
          </div>
        )}

        {/* ── Step 2: Inventory setup ───────────────────────────────────── */}
        {step === 2 && (
          <div className="p-6">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: "rgba(16,185,129,0.1)" }}
            >
              <Package className="h-7 w-7 text-emerald-500" />
            </div>
            <h2 className="text-xl font-bold text-center mb-1" style={{ color: "var(--foreground)" }}>
              Vorrat einrichten
            </h2>
            <p className="text-sm text-center mb-5" style={{ color: "var(--muted)" }}>
              Füge Kategorien und Lagerorte hinzu.
            </p>

            {/* Categories */}
            <div className="mb-5">
              <p className="text-sm font-semibold mb-2" style={{ color: "var(--foreground)" }}>
                Kategorien
              </p>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {CATEGORY_PRESETS.map((p) => (
                  <button key={p.name} type="button" onClick={() => addCategoryPreset(p)}
                    className="text-xs px-2.5 py-1 rounded-full transition-colors"
                    style={{ background: `${p.color}20`, color: p.color }}>
                    + {p.name}
                  </button>
                ))}
              </div>
              <div className="space-y-2 max-h-28 overflow-y-auto">
                {categories.map((cat, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <input
                      type="color"
                      value={cat.color}
                      onChange={(e) => setCategories((prev) => prev.map((c, i) => i === idx ? { ...c, color: e.target.value } : c))}
                      className="h-8 w-8 rounded-lg border cursor-pointer flex-shrink-0"
                      style={{ borderColor: "var(--card-border)", padding: "2px" }}
                    />
                    <input
                      value={cat.name}
                      onChange={(e) => setCategories((prev) => prev.map((c, i) => i === idx ? { ...c, name: e.target.value } : c))}
                      placeholder="Kategoriename"
                      className="flex-1 px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      style={{ background: "var(--muted-bg)", borderColor: "var(--card-border)", color: "var(--foreground)" }}
                    />
                    {categories.length > 1 && (
                      <button type="button" onClick={() => setCategories((prev) => prev.filter((_, i) => i !== idx))}
                        className="p-1.5 rounded-lg transition-colors" style={{ color: "var(--muted)" }}>
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button type="button"
                onClick={() => setCategories((prev) => [...prev, { name: "", color: "#3B82F6" }])}
                className="w-full mt-2 py-1.5 text-xs rounded-xl border border-dashed transition-colors"
                style={{ borderColor: "var(--card-border)", color: "var(--muted)" }}>
                <Plus className="h-3.5 w-3.5 inline mr-1" />Kategorie hinzufügen
              </button>
            </div>

            {/* Locations */}
            <div className="mb-5">
              <p className="text-sm font-semibold mb-2" style={{ color: "var(--foreground)" }}>
                Lagerorte
              </p>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {LOCATION_PRESETS.map((p) => (
                  <button key={p.name} type="button" onClick={() => addLocationPreset(p)}
                    className="text-xs px-2.5 py-1 rounded-full transition-colors"
                    style={{ background: "rgba(16,185,129,0.1)", color: "var(--foreground)" }}>
                    {p.icon} {p.name}
                  </button>
                ))}
              </div>
              <div className="space-y-2 max-h-28 overflow-y-auto">
                {locations.map((loc, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <input
                      value={loc.icon}
                      onChange={(e) => setLocations((prev) => prev.map((l, i) => i === idx ? { ...l, icon: e.target.value } : l))}
                      placeholder="📦"
                      className="w-12 px-2 py-2 rounded-xl border text-center text-base focus:outline-none"
                      style={{ background: "var(--muted-bg)", borderColor: "var(--card-border)", color: "var(--foreground)" }}
                      maxLength={4}
                    />
                    <input
                      value={loc.name}
                      onChange={(e) => setLocations((prev) => prev.map((l, i) => i === idx ? { ...l, name: e.target.value } : l))}
                      placeholder="Lagerortname"
                      className="flex-1 px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      style={{ background: "var(--muted-bg)", borderColor: "var(--card-border)", color: "var(--foreground)" }}
                    />
                    {locations.length > 1 && (
                      <button type="button" onClick={() => setLocations((prev) => prev.filter((_, i) => i !== idx))}
                        className="p-1.5 rounded-lg transition-colors" style={{ color: "var(--muted)" }}>
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button type="button"
                onClick={() => setLocations((prev) => [...prev, { name: "", icon: "📦" }])}
                className="w-full mt-2 py-1.5 text-xs rounded-xl border border-dashed transition-colors"
                style={{ borderColor: "var(--card-border)", color: "var(--muted)" }}>
                <Plus className="h-3.5 w-3.5 inline mr-1" />Lagerort hinzufügen
              </button>
            </div>

            <div className="flex gap-2">
              <button type="button" onClick={() => setStep(1)}
                className="p-2.5 rounded-xl border transition-colors"
                style={{ borderColor: "var(--card-border)", color: "var(--muted)" }}>
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button onClick={handleNext} disabled={saving}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium rounded-xl text-sm transition-colors flex items-center justify-center gap-2">
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                Weiter
              </button>
              <button type="button" onClick={() => setStep(3)}
                className="px-4 py-2.5 rounded-xl border text-sm transition-colors"
                style={{ borderColor: "var(--card-border)", color: "var(--muted)" }}>
                Überspringen
              </button>
            </div>
          </div>
        )}

        {/* ── Step 3: Finance setup ─────────────────────────────────────── */}
        {step === 3 && (
          <div className="p-6">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: "rgba(139,92,246,0.1)" }}
            >
              <Wallet className="h-7 w-7 text-purple-500" />
            </div>
            <h2 className="text-xl font-bold text-center mb-1" style={{ color: "var(--foreground)" }}>
              Finanzen einrichten
            </h2>
            <p className="text-sm text-center mb-5" style={{ color: "var(--muted)" }}>
              Optionaler Schritt — du kannst ihn auch später ausfüllen.
            </p>

            {/* Salary */}
            <div className="mb-5">
              <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--foreground)" }}>
                Monatliches Nettoeinkommen
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-medium" style={{ color: "var(--muted)" }}>€</span>
                <input
                  type="number" min="0" step="0.01" value={salary}
                  onChange={(e) => setSalary(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-8 pr-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  style={{ background: "var(--muted-bg)", borderColor: "var(--card-border)", color: "var(--foreground)" }}
                />
              </div>
            </div>

            {/* Fixed costs */}
            <div className="mb-5">
              <p className="text-sm font-semibold mb-2" style={{ color: "var(--foreground)" }}>
                Fixkosten
              </p>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {FIXKOSTEN_PRESETS.map((p) => (
                  <button key={p.name} type="button" onClick={() => addFixkostenPreset(p)}
                    className="text-xs px-2.5 py-1 rounded-full transition-colors"
                    style={{ background: "rgba(139,92,246,0.1)", color: "var(--foreground)" }}>
                    + {p.name}
                  </button>
                ))}
              </div>
              <div className="space-y-2 max-h-36 overflow-y-auto">
                {fixkosten.map((item, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <input
                      value={item.name}
                      onChange={(e) => setFixkosten((prev) => prev.map((r, i) => i === idx ? { ...r, name: e.target.value } : r))}
                      placeholder="Name"
                      className="flex-1 px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                      style={{ background: "var(--muted-bg)", borderColor: "var(--card-border)", color: "var(--foreground)" }}
                    />
                    <div className="relative">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs" style={{ color: "var(--muted)" }}>€</span>
                      <input
                        type="number" min="0" step="0.01" value={item.betrag}
                        onChange={(e) => setFixkosten((prev) => prev.map((r, i) => i === idx ? { ...r, betrag: e.target.value } : r))}
                        placeholder="0"
                        className="w-24 pl-5 pr-2 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                        style={{ background: "var(--muted-bg)", borderColor: "var(--card-border)", color: "var(--foreground)" }}
                      />
                    </div>
                    {fixkosten.length > 1 && (
                      <button type="button" onClick={() => setFixkosten((prev) => prev.filter((_, i) => i !== idx))}
                        className="p-1.5 rounded-lg transition-colors" style={{ color: "var(--muted)" }}>
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button type="button"
                onClick={() => setFixkosten((prev) => [...prev, { name: "", betrag: "", kategorie: "sonstiges" }])}
                className="w-full mt-2 py-1.5 text-xs rounded-xl border border-dashed transition-colors"
                style={{ borderColor: "var(--card-border)", color: "var(--muted)" }}>
                <Plus className="h-3.5 w-3.5 inline mr-1" />Weiteren Fixkosten hinzufügen
              </button>
            </div>

            <div className="flex gap-2">
              <button type="button" onClick={() => setStep(2)}
                className="p-2.5 rounded-xl border transition-colors"
                style={{ borderColor: "var(--card-border)", color: "var(--muted)" }}>
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button onClick={handleNext} disabled={saving}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium rounded-xl text-sm transition-colors flex items-center justify-center gap-2">
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                Weiter
              </button>
              <button type="button" onClick={() => setStep(4)}
                className="px-4 py-2.5 rounded-xl border text-sm transition-colors"
                style={{ borderColor: "var(--card-border)", color: "var(--muted)" }}>
                Überspringen
              </button>
            </div>
          </div>
        )}

        {/* ── Step 4: Done ──────────────────────────────────────────────── */}
        {step === 4 && (
          <div className="p-6 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-200 dark:shadow-blue-900/40">
              <CheckCircle2 className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-xl font-bold mb-1" style={{ color: "var(--foreground)" }}>
              Alles bereit!
            </h2>
            <p className="text-sm mb-6" style={{ color: "var(--muted)" }}>
              Dein Haushalt ist eingerichtet. Du kannst jetzt loslegen.
            </p>

            <div className="space-y-2 mb-6 text-left">
              <SummaryRow emoji="🏠" label="Haushalt" value={householdName} />
              <SummaryRow emoji="🧩" label="Module" value={`${enabledModules.length} aktiv`} />
              {savedCats > 0 && <SummaryRow emoji="📦" label="Kategorien" value={`${savedCats} erstellt`} />}
              {savedLocs > 0 && <SummaryRow emoji="📍" label="Lagerorte" value={`${savedLocs} erstellt`} />}
              {salary && parseFloat(salary) > 0 && (
                <SummaryRow emoji="💰" label="Einkommen" value={`${parseFloat(salary).toLocaleString("de-DE", { minimumFractionDigits: 2 })} €/Monat`} />
              )}
              {fixkosten.filter((i) => i.name.trim() && parseFloat(i.betrag) > 0).length > 0 && (
                <SummaryRow
                  emoji="📋"
                  label="Fixkosten"
                  value={`${fixkosten.filter((i) => i.name.trim() && parseFloat(i.betrag) > 0).length} Einträge`}
                />
              )}
            </div>

            <button
              onClick={handleFinish}
              disabled={saving}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Zum Dashboard
              {!saving && <ChevronRight className="h-4 w-4" />}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Helper components ────────────────────────────────────────────────────────

function SummaryRow({ emoji, label, value }: { emoji: string; label: string; value: string }) {
  return (
    <div
      className="flex items-center justify-between px-4 py-2.5 rounded-xl"
      style={{ background: "var(--muted-bg)" }}
    >
      <span className="text-sm" style={{ color: "var(--muted)" }}>
        {emoji} {label}
      </span>
      <span className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
        {value}
      </span>
    </div>
  );
}

function getModuleEmoji(key: ModuleKey): string {
  const map: Partial<Record<ModuleKey, string>> = {
    uebersicht: "🏠",
    kueche: "🍳",
    vorrat: "📦",
    finanzen: "💰",
    haushalt: "🧹",
    medikamente: "💊",
    wunschliste: "🎁",
    dokumente: "📄",
    einkaufsrouten: "🗺️",
    bewegungen: "🔄",
    familie: "👨‍👩‍👧",
    termine: "📅",
    kalender: "🗓️",
    reinigung: "✨",
    fahrzeuge: "🚗",
    haustiere: "🐾",
    energie: "⚡",
    chat: "💬",
    fitness: "💪",
    lieferungen: "📫",
    einstellungen: "⚙️",
  };
  return map[key] ?? "📌";
}
