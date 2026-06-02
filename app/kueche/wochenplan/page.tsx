"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import Link from "next/link";
import {
  Sparkles,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Clock,
  Users,
  ArrowLeft,
  AlertCircle,
  ChefHat,
} from "lucide-react";

interface GerichtKI {
  _id: string;
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

const WOCHENTAGE = [
  "Montag",
  "Dienstag",
  "Mittwoch",
  "Donnerstag",
  "Freitag",
  "Samstag",
  "Sonntag",
];

const SCHWIERIGKEITS_FARBE: Record<string, string> = {
  einfach: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300",
  mittel: "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300",
  schwer: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
};

export default function WochenplanPage() {
  const { t } = useTranslation();
  const [gerichte, setGerichte] = useState<GerichtKI[]>([]);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [error, setError] = useState("");
  const [weekKey, setWeekKey] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/kueche/wochenplan");
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Fehler beim Laden.");
        setGerichte([]);
      } else {
        setGerichte(data.gerichte ?? []);
        setWeekKey(data.weekKey ?? "");
      }
    } catch {
      setError("Netzwerkfehler. Bitte nochmals versuchen.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const regenerate = async () => {
    setRegenerating(true);
    setError("");
    try {
      // Delete current week plan
      await fetch("/api/kueche/wochenplan", { method: "DELETE" });
      // Generate new one
      const res = await fetch("/api/kueche/wochenplan");
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Fehler bei Neugenerierung.");
        setGerichte([]);
      } else {
        setGerichte(data.gerichte ?? []);
        setWeekKey(data.weekKey ?? "");
      }
    } catch {
      setError("Netzwerkfehler.");
    } finally {
      setRegenerating(false);
    }
  };

  const toggle = (id: string) => setExpanded((prev) => (prev === id ? null : id));

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div>
        <Link
          href="/kueche"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Zurück zur Küche
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-orange-500" />
              {t("kueche.aiPlan")}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              7 syrisch-libanesische Gerichte — automatisch generiert
              {weekKey && <span className="ml-1 text-orange-500">{weekKey}</span>}
            </p>
          </div>
          <button
            onClick={regenerate}
            disabled={loading || regenerating}
            className="flex-shrink-0 flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white rounded-xl text-sm font-medium transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${regenerating ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">{t("kueche.regenerate")}</span>
            <span className="sm:hidden">Neu</span>
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-xl p-4">
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-800 dark:text-red-300">{error}</p>
            {error.includes("OPENAI_API_KEY") && (
              <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                Bitte fügen Sie den OPENAI_API_KEY zur .env.local hinzu und starten Sie den Server neu.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Loading */}
      {(loading || regenerating) && !error && (
        <div className="space-y-4">
          {[...Array(7)].map((_, i) => (
            <div
              key={i}
              className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 animate-pulse"
            >
              <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-3" />
              <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-1/3" />
            </div>
          ))}
          {regenerating && (
            <p className="text-center text-sm text-gray-500">
              KI generiert Ihren Wochenplan… Das kann bis zu 30 Sekunden dauern.
            </p>
          )}
        </div>
      )}

      {/* Recipe cards */}
      {!loading && !regenerating && gerichte.length === 0 && !error && (
        <div className="text-center py-20">
          <ChefHat className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 mb-4">Noch kein Wochenplan generiert.</p>
          <button
            onClick={regenerate}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-medium transition-colors"
          >
            <Sparkles className="h-4 w-4" />
            Wochenplan generieren
          </button>
        </div>
      )}

      {!loading && !regenerating && gerichte.length > 0 && (
        <div className="space-y-3">
          {gerichte.map((g, i) => {
            const isOpen = expanded === g._id;
            return (
              <div
                key={g._id}
                className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden"
              >
                {/* Day label + summary row */}
                <button
                  type="button"
                  onClick={() => toggle(g._id)}
                  className="w-full text-left px-5 py-4 flex items-center gap-4"
                >
                  {/* Day badge */}
                  <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-950 flex items-center justify-center">
                    <span className="text-xs font-bold text-orange-600 dark:text-orange-400 leading-tight text-center">
                      {WOCHENTAGE[i]?.slice(0, 2)}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-0.5">
                      <span className="text-xs font-medium text-orange-500">
                        {WOCHENTAGE[i]}
                      </span>
                      {g.schwierigkeit && (
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${SCHWIERIGKEITS_FARBE[g.schwierigkeit] ?? ""}`}
                        >
                          {g.schwierigkeit}
                        </span>
                      )}
                    </div>
                    <p className="font-semibold text-gray-900 dark:text-white truncate">
                      {g.name}
                    </p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                      <span>{g.kochgeraet}</span>
                      {g.zeitMinuten != null && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {g.zeitMinuten} Min.
                        </span>
                      )}
                      {g.portionen != null && (
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {g.portionen}
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

                {/* Expanded details */}
                {isOpen && (
                  <div className="px-5 pb-5 border-t border-gray-100 dark:border-gray-800 pt-4 space-y-4">
                    {/* Zutaten */}
                    {g.zutaten.length > 0 && (
                      <div>
                        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          Zutaten
                        </h3>
                        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                          {g.zutaten.map((z, idx) => (
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

                    {/* Zubereitung */}
                    {g.notizen && (
                      <div>
                        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          Zubereitung
                        </h3>
                        <div className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-line">
                          {g.notizen}
                        </div>
                      </div>
                    )}

                    {/* Link to full recipe */}
                    <Link
                      href={`/kueche/${g._id}`}
                      className="inline-flex items-center gap-2 text-sm text-orange-500 hover:text-orange-600 font-medium"
                    >
                      Zum vollständigen Rezept
                    </Link>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
