"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  ChefHat,
  Clock,
  Users,
  Sparkles,
  Check,
  BookmarkPlus,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  RotateCcw,
  History,
  Trash2,
} from "lucide-react";

// ─── Wizard Steps Data ───────────────────────────────────────────────────────

const PROTEIN_OPTIONS = [
  { id: "hähnchen", label: "Hähnchen", emoji: "🍗" },
  { id: "hackfleisch", label: "Hackfleisch", emoji: "🥩" },
  { id: "lammfleisch", label: "Lammfleisch", emoji: "🐑" },
  { id: "rindfleisch", label: "Rindfleisch", emoji: "🥩" },
  { id: "fisch", label: "Fisch", emoji: "🐟" },
  { id: "eier", label: "Eier", emoji: "🥚" },
  { id: "linsen", label: "Linsen", emoji: "🫘" },
  { id: "kichererbsen", label: "Kichererbsen", emoji: "🫘" },
  { id: "tofu", label: "Tofu / vegetarisch", emoji: "🥗" },
];

const STAERKE_OPTIONS = [
  { id: "reis", label: "Reis", emoji: "🍚" },
  { id: "bulgur", label: "Bulgur", emoji: "🌾" },
  { id: "couscous", label: "Couscous", emoji: "🌾" },
  { id: "nudeln", label: "Nudeln / Makkaroni", emoji: "🍝" },
  { id: "brot", label: "Brot / Fladenbrot", emoji: "🫓" },
  { id: "kartoffeln", label: "Kartoffeln", emoji: "🥔" },
];

const GEMUESE_OPTIONS = [
  { id: "zwiebeln", label: "Zwiebeln", emoji: "🧅" },
  { id: "tomaten", label: "Tomaten", emoji: "🍅" },
  { id: "zucchini", label: "Zucchini", emoji: "🥒" },
  { id: "aubergine", label: "Aubergine", emoji: "🍆" },
  { id: "paprika", label: "Paprika", emoji: "🫑" },
  { id: "karotten", label: "Karotten", emoji: "🥕" },
  { id: "spinat", label: "Spinat", emoji: "🥬" },
  { id: "kohl", label: "Kohl / Weißkohl", emoji: "🥬" },
  { id: "petersilie", label: "Petersilie", emoji: "🌿" },
  { id: "knoblauch", label: "Knoblauch", emoji: "🧄" },
  { id: "gurken", label: "Gurken", emoji: "🥒" },
  { id: "salat", label: "Salat", emoji: "🥗" },
];

const ZEIT_OPTIONS = [
  { id: 15, label: "15 Min.", desc: "Schnell & einfach" },
  { id: 30, label: "30 Min.", desc: "Normales Kochen" },
  { id: 60, label: "1 Stunde", desc: "Etwas mehr Zeit" },
  { id: 120, label: "2+ Stunden", desc: "Aufwendiges Gericht" },
];

const PERSONEN_OPTIONS = [1, 2, 3, 4, 5, 6, 8];

const SCHWIERIGKEITS_FARBE: Record<string, string> = {
  einfach: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300",
  mittel:
    "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300",
  schwer: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface Rezept {
  name: string;
  kochgeraet: string;
  programm?: string;
  leistung?: string;
  zeit?: string;
  zeitMinuten?: number;
  portionen?: number;
  schwierigkeit?: string;
  zutaten: string[];
  notizen: string;
  tags: string[];
}

// ─── Step Component ───────────────────────────────────────────────────────────

function MultiSelectChips({
  options,
  selected,
  onChange,
}: {
  options: { id: string; label: string; emoji?: string }[];
  selected: string[];
  onChange: (id: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const active = selected.includes(opt.id);
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium border transition-all ${
              active
                ? "bg-orange-500 border-orange-500 text-white shadow-sm"
                : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-orange-300"
            }`}
          >
            {opt.emoji && <span>{opt.emoji}</span>}
            {opt.label}
            {active && <Check className="h-3.5 w-3.5 ml-0.5" />}
          </button>
        );
      })}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function WasKochenPage() {
  const router = useRouter();

  // Wizard state
  const [step, setStep] = useState(0); // 0–5 = questions, 6 = results
  const [protein, setProtein] = useState<string[]>([]);
  const [staerke, setSaerke] = useState<string[]>([]);
  const [gemuese, setGemuese] = useState<string[]>([]);
  const [zeitMinuten, setZeitMinuten] = useState(30);
  const [personen, setPersonen] = useState(4);
  const [extra, setExtra] = useState("");

  // Results state
  const [loading, setLoading] = useState(false);
  const [loadingCache, setLoadingCache] = useState(true);
  const [error, setError] = useState("");
  const [rezepte, setRezepte] = useState<Rezept[]>([]);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [saving, setSaving] = useState<number | null>(null);
  const [saved, setSaved] = useState<Set<number>>(new Set());

  // Cache info
  const [cacheId, setCacheId] = useState<string | null>(null);
  const [cacheTitel, setCacheTitel] = useState("");
  const [cacheDate, setCacheDate] = useState<string | null>(null);
  const [cacheTokens, setCacheTokens] = useState(0);
  const [deletingCache, setDeletingCache] = useState(false);

  // On mount: load last cached result
  useEffect(() => {
    fetch("/api/kueche/was-kochen")
      .then((r) => r.json())
      .then((data) => {
        if (data.cached) {
          const c = data.cached;
          setRezepte(c.rezepte ?? []);
          setCacheId(c._id);
          setCacheTitel(c.titel ?? "");
          setCacheDate(c.createdAt ?? null);
          setCacheTokens(c.tokenGeschaetzt ?? 0);
          setExpanded(0);
          setStep(6);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingCache(false));
  }, []);

  const deleteCache = async () => {
    if (!cacheId) return;
    setDeletingCache(true);
    try {
      await fetch(`/api/kueche/ki-verlauf/${cacheId}`, { method: "DELETE" });
      reset();
    } finally {
      setDeletingCache(false);
    }
  };

  const toggle = (arr: string[], id: string) =>
    arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id];

  const STEPS = [
    {
      title: "Was hast du im Kühlschrank?",
      subtitle: "Protein / Fleisch (mehrere möglich)",
      icon: "🥩",
      canSkip: false,
      valid: protein.length > 0,
    },
    {
      title: "Welche Sättigungsbeilage?",
      subtitle: "Kohlenhydrate (mehrere möglich)",
      icon: "🍚",
      canSkip: false,
      valid: staerke.length > 0,
    },
    {
      title: "Welches Gemüse hast du?",
      subtitle: "Mehrere möglich — oder überspringen",
      icon: "🥦",
      canSkip: true,
      valid: true,
    },
    {
      title: "Wie viel Zeit hast du?",
      subtitle: "Ungefähre Kochzeit",
      icon: "⏱️",
      canSkip: false,
      valid: true,
    },
    {
      title: "Für wie viele Personen?",
      subtitle: "Portionen",
      icon: "👥",
      canSkip: false,
      valid: true,
    },
    {
      title: "Noch etwas zu Hause?",
      subtitle: "Optional: sonstige Zutaten (Gewürze, Käse, Sahne...)",
      icon: "📝",
      canSkip: true,
      valid: true,
    },
  ];

  const current = STEPS[step];
  const progress = ((step) / STEPS.length) * 100;

  const next = () => {
    if (step < STEPS.length - 1) setStep((s) => s + 1);
    else generate();
  };

  const back = () => {
    if (step > 0) setStep((s) => s - 1);
  };

  const reset = () => {
    setStep(0);
    setProtein([]);
    setSaerke([]);
    setGemuese([]);
    setZeitMinuten(30);
    setPersonen(4);
    setExtra("");
    setRezepte([]);
    setError("");
    setExpanded(null);
    setSaved(new Set());
    setCacheId(null);
    setCacheTitel("");
    setCacheDate(null);
    setCacheTokens(0);
  };

  const generate = async () => {
    setLoading(true);
    setError("");
    setRezepte([]);
    setStep(6);

    try {
      const res = await fetch("/api/kueche/was-kochen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ protein, staerke, gemuese, zeitMinuten, personen, extra }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Fehler bei der Generierung.");
      } else {
        setRezepte(data.rezepte ?? []);
        setCacheTokens(data.tokenVerbraucht ?? 0);
        setExpanded(0);
        // Reload cache info
        fetch("/api/kueche/was-kochen")
          .then((r) => r.json())
          .then((d) => {
            if (d.cached) {
              setCacheId(d.cached._id);
              setCacheTitel(d.cached.titel ?? "");
              setCacheDate(d.cached.createdAt ?? null);
            }
          })
          .catch(() => {});
      }
    } catch {
      setError("Netzwerkfehler. Bitte erneut versuchen.");
    } finally {
      setLoading(false);
    }
  };

  const saveRezept = async (idx: number) => {
    setSaving(idx);
    try {
      const res = await fetch("/api/kueche/was-kochen", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(rezepte[idx]),
      });
      const data = await res.json();
      if (res.ok) {
        setSaved((s) => new Set([...s, idx]));
        // Navigate to saved recipe after short delay
        setTimeout(() => router.push(`/kueche/${data._id}`), 800);
      }
    } finally {
      setSaving(null);
    }
  };

  // ── Results View ────────────────────────────────────────────────────────────
  if (step === 6) {
    // Still loading cache on first mount
    if (loadingCache) {
      return (
        <div className="flex items-center justify-center py-32">
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      );
    }

    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <button
            onClick={reset}
            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-orange-500" />
              Deine Rezeptvorschläge
            </h1>
            <p className="text-sm text-gray-500">
              Basierend auf deinen Zutaten — syrisch &amp; libanesisch
            </p>
          </div>
        </div>

        {/* Cache info banner */}
        {cacheId && !loading && rezepte.length > 0 && (
          <div className="flex items-center justify-between gap-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-xl px-4 py-3">
            <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300 min-w-0">
              <History className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">
                <span className="font-medium">{cacheTitel}</span>
                {cacheDate && (
                  <span className="ml-1 text-blue-500">
                    — {new Date(cacheDate).toLocaleDateString("de-DE")}
                  </span>
                )}
                {cacheTokens > 0 && (
                  <span className="ml-1 text-blue-400 text-xs">({cacheTokens} Tokens)</span>
                )}
              </span>
            </div>
            <button
              onClick={deleteCache}
              disabled={deletingCache}
              title="Gespeichertes Ergebnis löschen"
              className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-100 hover:bg-red-200 dark:bg-red-950 dark:hover:bg-red-900 text-red-600 dark:text-red-400 text-xs font-medium transition-colors disabled:opacity-60"
            >
              {deletingCache ? (
                <div className="w-3 h-3 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Trash2 className="h-3.5 w-3.5" />
              )}
              Löschen &amp; neu
            </button>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-start gap-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-xl p-4">
            <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-800 dark:text-red-300">{error}</p>
              <button
                onClick={reset}
                className="mt-2 text-xs text-red-600 hover:text-red-800 flex items-center gap-1"
              >
                <RotateCcw className="h-3 w-3" /> Neu starten
              </button>
            </div>
          </div>
        )}

        {/* Loading skeletons */}
        {loading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 animate-pulse"
              >
                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-3" />
                <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-1/2 mb-2" />
                <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-1/3" />
              </div>
            ))}
            <p className="text-center text-sm text-gray-500">
              KI erstellt Rezepte aus deinen Zutaten…
            </p>
          </div>
        )}

        {/* Recipe cards */}
        {!loading && rezepte.length > 0 && (
          <>
            <div className="space-y-3">
              {rezepte.map((r, i) => {
                const isOpen = expanded === i;
                const isSaved = saved.has(i);
                return (
                  <div
                    key={i}
                    className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden"
                  >
                    {/* Header row */}
                    <button
                      type="button"
                      onClick={() => setExpanded(isOpen ? null : i)}
                      className="w-full text-left px-5 py-4 flex items-center gap-4"
                    >
                      <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-950 flex items-center justify-center">
                        <span className="text-lg font-bold text-orange-600 dark:text-orange-400">
                          {i + 1}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-0.5">
                          {r.schwierigkeit && (
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${SCHWIERIGKEITS_FARBE[r.schwierigkeit] ?? ""}`}
                            >
                              {r.schwierigkeit}
                            </span>
                          )}
                        </div>
                        <p className="font-semibold text-gray-900 dark:text-white truncate">
                          {r.name}
                        </p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                          <span>{r.kochgeraet}</span>
                          {r.zeitMinuten != null && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {r.zeitMinuten} Min.
                            </span>
                          )}
                          {r.portionen != null && (
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {r.portionen}
                            </span>
                          )}
                        </div>
                      </div>
                      {isOpen ? (
                        <ChevronUp className="h-5 w-5 text-gray-400 flex-shrink-0" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-gray-400 flex-shrink-0" />
                      )}
                    </button>

                    {/* Expanded content */}
                    {isOpen && (
                      <div className="px-5 pb-5 border-t border-gray-100 dark:border-gray-800 pt-4 space-y-4">
                        {r.zutaten.length > 0 && (
                          <div>
                            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                              Zutaten
                            </h3>
                            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                              {r.zutaten.map((z, idx) => (
                                <li
                                  key={idx}
                                  className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400"
                                >
                                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-orange-400 flex-shrink-0" />
                                  {z}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {r.notizen && (
                          <div>
                            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                              Zubereitung
                            </h3>
                            <div className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-line">
                              {r.notizen}
                            </div>
                          </div>
                        )}

                        {/* Save button */}
                        <button
                          onClick={() => saveRezept(i)}
                          disabled={saving === i || isSaved}
                          className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                            isSaved
                              ? "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300"
                              : "bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white"
                          }`}
                        >
                          {saving === i ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : isSaved ? (
                            <>
                              <Check className="h-4 w-4" />
                              Gespeichert — zum Rezept
                            </>
                          ) : (
                            <>
                              <BookmarkPlus className="h-4 w-4" />
                              Rezept in Küche speichern
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Try again */}
            <div className="flex gap-3">
              <button
                onClick={reset}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <RotateCcw className="h-4 w-4" />
                Neue Suche
              </button>
              <Link
                href="/kueche"
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                <ChefHat className="h-4 w-4" />
                Zur Küche
              </Link>
            </div>
          </>
        )}
      </div>
    );
  }

  // ── Wizard View ─────────────────────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/kueche"
          className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Was soll ich kochen?
          </h1>
          <p className="text-sm text-gray-500">
            {step + 1} von {STEPS.length} Fragen
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-orange-500 rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Question card */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 space-y-5">
        <div className="flex items-start gap-3">
          <span className="text-3xl">{current.icon}</span>
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              {current.title}
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">{current.subtitle}</p>
          </div>
        </div>

        {/* Step content */}
        {step === 0 && (
          <MultiSelectChips
            options={PROTEIN_OPTIONS}
            selected={protein}
            onChange={(id) => setProtein(toggle(protein, id))}
          />
        )}

        {step === 1 && (
          <MultiSelectChips
            options={STAERKE_OPTIONS}
            selected={staerke}
            onChange={(id) => setSaerke(toggle(staerke, id))}
          />
        )}

        {step === 2 && (
          <MultiSelectChips
            options={GEMUESE_OPTIONS}
            selected={gemuese}
            onChange={(id) => setGemuese(toggle(gemuese, id))}
          />
        )}

        {step === 3 && (
          <div className="grid grid-cols-2 gap-3">
            {ZEIT_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setZeitMinuten(opt.id)}
                className={`flex flex-col items-center p-4 rounded-xl border text-center transition-all ${
                  zeitMinuten === opt.id
                    ? "bg-orange-500 border-orange-500 text-white shadow-sm"
                    : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-orange-300"
                }`}
              >
                <Clock className="h-5 w-5 mb-1" />
                <span className="font-semibold text-sm">{opt.label}</span>
                <span className={`text-xs mt-0.5 ${zeitMinuten === opt.id ? "text-orange-100" : "text-gray-400"}`}>
                  {opt.desc}
                </span>
              </button>
            ))}
          </div>
        )}

        {step === 4 && (
          <div className="flex flex-wrap gap-2">
            {PERSONEN_OPTIONS.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setPersonen(n)}
                className={`w-14 h-14 rounded-xl border font-bold text-lg transition-all ${
                  personen === n
                    ? "bg-orange-500 border-orange-500 text-white shadow-sm"
                    : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-orange-300"
                }`}
              >
                {n}
              </button>
            ))}
            <div className="flex items-center gap-2 mt-1 w-full text-sm text-gray-400">
              <Users className="h-4 w-4" />
              {personen} {personen === 1 ? "Person" : "Personen"}
            </div>
          </div>
        )}

        {step === 5 && (
          <textarea
            value={extra}
            onChange={(e) => setExtra(e.target.value)}
            placeholder="z. B. Ich habe noch Joghurt, Tomatenmark, Zitrone, Olivenöl…"
            rows={4}
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        )}
      </div>

      {/* Navigation buttons */}
      <div className="flex gap-3">
        {step > 0 && (
          <button
            type="button"
            onClick={back}
            className="flex items-center gap-2 px-5 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Zurück
          </button>
        )}

        {current.canSkip && step < STEPS.length - 1 && (
          <button
            type="button"
            onClick={() => setStep((s) => s + 1)}
            className="flex items-center gap-2 px-5 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Überspringen
          </button>
        )}

        <button
          type="button"
          onClick={next}
          disabled={!current.valid}
          className={`ml-auto flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-colors ${
            step === STEPS.length - 1
              ? "bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white"
              : "bg-orange-500 hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed text-white"
          }`}
        >
          {step === STEPS.length - 1 ? (
            <>
              <Sparkles className="h-4 w-4" />
              Rezepte generieren
            </>
          ) : (
            <>
              Weiter
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
