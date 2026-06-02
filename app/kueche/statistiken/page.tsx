"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { ChefHat, Star, Clock, BarChart3 } from "lucide-react";

interface Gericht {
  _id: string;
  name: string;
  kochgeraet: string;
  zeitMinuten?: number;
  favorit: boolean;
  gekochtAnzahl: number;
  zuletztGekocht?: string | null;
}

export default function KuecheStatistikPage() {
  const { t } = useTranslation();
  const [gerichte, setGerichte] = useState<Gericht[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/kueche/gerichte?sortierung=oft-gekocht")
      .then((r) => r.json())
      .then((d) => { setGerichte(Array.isArray(d) ? d : []); setLoading(false); });
  }, []);

  const totalGekocht = gerichte.reduce((s, g) => s + g.gekochtAnzahl, 0);
  const favoriten = gerichte.filter((g) => g.favorit).length;
  const mitZeit = gerichte.filter((g) => g.zeitMinuten);
  const avgZeit = mitZeit.length ? Math.round(mitZeit.reduce((s, g) => s + (g.zeitMinuten ?? 0), 0) / mitZeit.length) : 0;
  const topGerichte = [...gerichte].sort((a, b) => b.gekochtAnzahl - a.gekochtAnzahl).slice(0, 10);

  if (loading) return <div className="flex justify-center py-32"><div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t("kueche.statistics.title")}</h1>
        <p className="text-sm text-gray-500">{t("kueche.statistics.overview")}</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: t("kueche.statistics.totalRecipes"), value: gerichte.length, icon: <ChefHat className="h-5 w-5 text-orange-500" /> },
          { label: t("kueche.statistics.favorites"), value: favoriten, icon: <Star className="h-5 w-5 text-yellow-500" /> },
          { label: t("kueche.statistics.avgCookTime"), value: avgZeit ? `${avgZeit} ${t("kueche.statistics.minutes")}` : "—", icon: <Clock className="h-5 w-5 text-blue-500" /> },
          { label: t("kueche.statistics.totalCooked"), value: totalGekocht, icon: <BarChart3 className="h-5 w-5 text-green-500" /> },
        ].map((s) => (
          <div key={s.label} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4">
            <div className="flex items-center gap-2 mb-2">{s.icon}<span className="text-xs text-gray-500">{s.label}</span></div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{s.value}</p>
          </div>
        ))}
      </div>

      {topGerichte.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-800 font-semibold text-gray-900 dark:text-white">
            {t("kueche.statistics.mostCooked")}
          </div>
          <div className="divide-y divide-gray-50 dark:divide-gray-800">
            {topGerichte.map((g, i) => (
              <div key={g._id} className="flex items-center gap-4 px-5 py-3">
                <span className="text-sm font-bold text-gray-400 w-5">{i + 1}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{g.name}</p>
                  <p className="text-xs text-gray-400">{g.kochgeraet}</p>
                </div>
                <span className="text-sm font-semibold text-orange-500">{g.gekochtAnzahl}×</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
