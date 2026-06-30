"use client";

import { useState, useEffect } from "react";
import {
  Plane, FileText, Package, Heart, Sparkles, Pill, Zap,
  Briefcase, MoreHorizontal, CheckCircle2, Circle, ChevronDown,
  RotateCcw, MapPin, Users, User, CheckCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";

type Person = "all" | "adults" | "baby";

interface ChecklistItem {
  id: string;
  person: Person;
}

interface ChecklistCategory {
  id: string;
  categoryKey: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  items: ChecklistItem[];
}

const CHECKLIST: ChecklistCategory[] = [
  {
    id: "documents", categoryKey: "documents",
    icon: FileText,
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-50 dark:bg-blue-950",
    items: [
      { id: "doc1", person: "all" },
      { id: "doc2", person: "adults" },
      { id: "doc3", person: "adults" },
      { id: "doc4", person: "adults" },
      { id: "doc5", person: "baby" },
    ],
  },
  {
    id: "adults-clothes", categoryKey: "adultsClothes",
    icon: Package,
    color: "text-orange-600 dark:text-orange-400",
    bgColor: "bg-orange-50 dark:bg-orange-950",
    items: [
      { id: "ac1", person: "adults" }, { id: "ac2", person: "adults" },
      { id: "ac3", person: "adults" }, { id: "ac4", person: "adults" },
      { id: "ac5", person: "adults" }, { id: "ac6", person: "adults" },
      { id: "ac7", person: "adults" }, { id: "ac8", person: "adults" },
      { id: "ac9", person: "adults" }, { id: "ac10", person: "adults" },
      { id: "ac11", person: "adults" }, { id: "ac12", person: "adults" },
      { id: "ac13", person: "adults" }, { id: "ac14", person: "adults" },
    ],
  },
  {
    id: "baby", categoryKey: "baby",
    icon: Heart,
    color: "text-pink-600 dark:text-pink-400",
    bgColor: "bg-pink-50 dark:bg-pink-950",
    items: [
      { id: "b1", person: "baby" }, { id: "b2", person: "baby" },
      { id: "b3", person: "baby" }, { id: "b4", person: "baby" },
      { id: "b5", person: "baby" }, { id: "b6", person: "baby" },
      { id: "b7", person: "baby" }, { id: "b8", person: "baby" },
      { id: "b9", person: "baby" }, { id: "b10", person: "baby" },
      { id: "b11", person: "baby" }, { id: "b12", person: "baby" },
      { id: "b13", person: "baby" },
    ],
  },
  {
    id: "hygiene", categoryKey: "hygiene",
    icon: Sparkles,
    color: "text-cyan-600 dark:text-cyan-400",
    bgColor: "bg-cyan-50 dark:bg-cyan-950",
    items: [
      { id: "h1", person: "all" }, { id: "h2", person: "adults" },
      { id: "h3", person: "adults" }, { id: "h4", person: "adults" },
      { id: "h5", person: "all" }, { id: "h6", person: "all" },
    ],
  },
  {
    id: "medicine", categoryKey: "medicine",
    icon: Pill,
    color: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-50 dark:bg-red-950",
    items: [
      { id: "m1", person: "all" }, { id: "m2", person: "baby" },
      { id: "m3", person: "all" }, { id: "m4", person: "all" },
      { id: "m5", person: "adults" }, { id: "m6", person: "all" },
    ],
  },
  {
    id: "electronics", categoryKey: "electronics",
    icon: Zap,
    color: "text-yellow-600 dark:text-yellow-400",
    bgColor: "bg-yellow-50 dark:bg-yellow-950",
    items: [
      { id: "e1", person: "all" }, { id: "e2", person: "adults" },
      { id: "e3", person: "adults" }, { id: "e4", person: "adults" },
      { id: "e5", person: "adults" },
    ],
  },
  {
    id: "carry-on", categoryKey: "carryOn",
    icon: Briefcase,
    color: "text-violet-600 dark:text-violet-400",
    bgColor: "bg-violet-50 dark:bg-violet-950",
    items: [
      { id: "ca1", person: "adults" }, { id: "ca2", person: "baby" },
      { id: "ca3", person: "baby" }, { id: "ca4", person: "baby" },
      { id: "ca5", person: "all" }, { id: "ca6", person: "adults" },
    ],
  },
  {
    id: "extras", categoryKey: "extras",
    icon: MoreHorizontal,
    color: "text-gray-600 dark:text-gray-400",
    bgColor: "bg-gray-100 dark:bg-gray-800",
    items: [
      { id: "x1", person: "adults" }, { id: "x2", person: "baby" },
      { id: "x3", person: "all" }, { id: "x4", person: "all" },
    ],
  },
];

const STORAGE_KEY = "reisecheckliste-kanaren-2025";

type PersonFilter = "all" | "adults" | "baby";
type ViewMode = "family" | "person";

const PERSON_COLORS: Record<Person, string> = {
  all: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  adults: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  baby: "bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300",
};

export default function ReisechecklistePage() {
  const { t } = useTranslation();
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<Set<string>>(new Set(CHECKLIST.map((c) => c.id)));
  const [viewMode, setViewMode] = useState<ViewMode>("family");
  const [personFilter, setPersonFilter] = useState<PersonFilter>("all");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setChecked(new Set(JSON.parse(stored)));
    } catch {}
  }, []);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...checked]));
  }, [checked, mounted]);

  const toggle = (id: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const allItems = CHECKLIST.flatMap((c) => c.items);
  const totalCount = allItems.length;
  const doneCount = allItems.filter((i) => checked.has(i.id)).length;
  const percent = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  const visibleCategories = CHECKLIST.map((cat) => ({
    ...cat,
    items: viewMode === "person"
      ? cat.items.filter((i) => personFilter === "all" || i.person === personFilter || i.person === "all")
      : cat.items,
  })).filter((cat) => cat.items.length > 0);

  if (!mounted) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-sky-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-sm flex-shrink-0">
            <Plane className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {t("reisecheckliste.title")}
            </h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              <MapPin className="h-3.5 w-3.5 text-gray-400" />
              <span className="text-sm text-gray-500">{t("reisecheckliste.destination")}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setChecked(new Set(allItems.map((i) => i.id)))}
            title={t("reisecheckliste.checkAll")}
            className="p-2 rounded-xl text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-950/40 transition-colors"
          >
            <CheckCheck className="h-4 w-4" />
          </button>
          <button
            onClick={() => setChecked(new Set())}
            title={t("reisecheckliste.reset")}
            className="p-2 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Progress Card */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {t("reisecheckliste.progress")}
          </span>
          <span dir="ltr" className={cn(
            "text-sm font-bold",
            percent === 100 ? "text-green-600 dark:text-green-400" : "text-blue-600 dark:text-blue-400"
          )}>
            {doneCount} / {totalCount}
          </span>
        </div>
        <div className="h-2.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500",
              percent === 100 ? "bg-green-500" : "bg-blue-500"
            )}
            style={{ width: `${percent}%` }}
          />
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-gray-400">
            {percent === 100
              ? t("reisecheckliste.readyToTravel")
              : t("reisecheckliste.itemsLeft").replace("{n}", String(totalCount - doneCount))}
          </span>
          <span className="text-xs font-semibold text-gray-500">{percent}%</span>
        </div>

        {/* Category mini stats */}
        <div className="grid grid-cols-4 gap-2 mt-4 pt-4 border-t border-gray-50 dark:border-gray-800">
          {CHECKLIST.slice(0, 4).map((cat) => {
            const total = cat.items.length;
            const done = cat.items.filter((i) => checked.has(i.id)).length;
            const Icon = cat.icon;
            return (
              <div key={cat.id} className="text-center">
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center mx-auto mb-1", cat.bgColor)}>
                  <Icon className={cn("h-4 w-4", cat.color)} />
                </div>
                <div dir="ltr" className="text-[10px] text-gray-400 leading-tight">{done}/{total}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* View Mode Toggle */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1 gap-1">
          <button
            onClick={() => setViewMode("family")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
              viewMode === "family"
                ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            )}
          >
            <Users className="h-3.5 w-3.5" />
            {t("reisecheckliste.viewFamily")}
          </button>
          <button
            onClick={() => setViewMode("person")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
              viewMode === "person"
                ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            )}
          >
            <User className="h-3.5 w-3.5" />
            {t("reisecheckliste.viewPerson")}
          </button>
        </div>

        {viewMode === "person" && (
          <div className="flex gap-1.5">
            {(["all", "adults", "baby"] as PersonFilter[]).map((p) => (
              <button
                key={p}
                onClick={() => setPersonFilter(p)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                  personFilter === p
                    ? PERSON_COLORS[p]
                    : "bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                )}
              >
                {t(`reisecheckliste.persons.${p}`)}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Categories */}
      <div className="space-y-3">
        {visibleCategories.map((cat) => {
          const Icon = cat.icon;
          const total = cat.items.length;
          const done = cat.items.filter((i) => checked.has(i.id)).length;
          const isExpanded = expanded.has(cat.id);
          const allDone = done === total;

          return (
            <div
              key={cat.id}
              className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden"
            >
              <button
                onClick={() => toggleExpand(cat.id)}
                className="w-full flex items-center gap-3 px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0", cat.bgColor)}>
                  <Icon className={cn("h-[18px] w-[18px]", cat.color)} />
                </div>
                <div className="flex-1 text-start">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      {t(`reisecheckliste.categories.${cat.categoryKey}`)}
                    </span>
                    {allDone && (
                      <span className="text-[10px] bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400 px-1.5 py-0.5 rounded-full font-medium">
                        {t("reisecheckliste.complete")}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 h-1 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className={cn("h-full rounded-full transition-all duration-300", allDone ? "bg-green-500" : "bg-blue-500")}
                        style={{ width: `${total > 0 ? (done / total) * 100 : 0}%` }}
                      />
                    </div>
                    <span dir="ltr" className="text-[11px] text-gray-400 flex-shrink-0">{done}/{total}</span>
                  </div>
                </div>
                <ChevronDown
                  className={cn("h-4 w-4 text-gray-400 transition-transform duration-200 flex-shrink-0", isExpanded ? "rotate-180" : "")}
                />
              </button>

              {isExpanded && (
                <div className="border-t border-gray-50 dark:border-gray-800 divide-y divide-gray-50 dark:divide-gray-800">
                  {cat.items.map((item) => {
                    const isDone = checked.has(item.id);
                    const note = t(`reisecheckliste.notes.${item.id}`);
                    return (
                      <button
                        key={item.id}
                        onClick={() => toggle(item.id)}
                        className={cn(
                          "w-full flex items-center gap-3 px-5 py-3 text-start transition-colors",
                          isDone
                            ? "bg-green-50/50 dark:bg-green-950/20"
                            : "hover:bg-gray-50 dark:hover:bg-gray-800/30"
                        )}
                      >
                        {isDone ? (
                          <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                        ) : (
                          <Circle className="h-5 w-5 text-gray-300 dark:text-gray-600 flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <span className={cn(
                            "text-sm font-medium",
                            isDone ? "text-gray-400 dark:text-gray-500 line-through" : "text-gray-900 dark:text-white"
                          )}>
                            {t(`reisecheckliste.items.${item.id}`)}
                          </span>
                          {note && (
                            <span className="text-xs text-gray-400 dark:text-gray-500 ms-2">{note}</span>
                          )}
                        </div>
                        {viewMode === "family" && item.person !== "all" && (
                          <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full font-medium flex-shrink-0", PERSON_COLORS[item.person])}>
                            {t(`reisecheckliste.persons.${item.person}`)}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {doneCount > 0 && (
        <div className="text-center py-2">
          <p className="text-xs text-gray-400">
            {percent === 100 ? t("reisecheckliste.enjoyTrip") : ""}
          </p>
        </div>
      )}
    </div>
  );
}
