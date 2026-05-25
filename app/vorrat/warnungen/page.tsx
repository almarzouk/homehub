"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, Clock, TrendingDown, Package, CheckCircle } from "lucide-react";

interface Product {
  _id: string;
  name: string;
  quantity: number;
  unit: string;
  minQuantity: number;
  expiryDate?: string;
  categoryId?: { name: string; color: string };
}

interface AlertData {
  outOfStock: Product[];
  lowStock: Product[];
  expired: Product[];
  expiringSoon: Product[];
}

export default function WarnungenPage() {
  const [data, setData] = useState<AlertData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/vorrat/warnungen")
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>;
  }

  const total = (data?.outOfStock.length ?? 0) + (data?.lowStock.length ?? 0) + (data?.expired.length ?? 0) + (data?.expiringSoon.length ?? 0);

  if (total === 0) {
    return (
      <div className="text-center py-20">
        <CheckCircle className="h-12 w-12 text-emerald-400 mx-auto mb-3" />
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Alles in Ordnung!</h2>
        <p className="text-gray-500 mt-1">Keine Warnungen im Vorrat.</p>
      </div>
    );
  }

  const Section = ({ title, items, icon: Icon, color }: { title: string; items: Product[]; icon: React.ElementType; color: string }) => {
    if (items.length === 0) return null;
    return (
      <section>
        <h2 className={`flex items-center gap-2 text-sm font-semibold uppercase tracking-wider mb-3 ${color}`}>
          <Icon className="h-4 w-4" />
          {title} ({items.length})
        </h2>
        <div className="space-y-2">
          {items.map((p) => (
            <Link key={p._id} href={`/vorrat/produkte/${p._id}`} className="flex items-center justify-between bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 px-4 py-3 hover:shadow-sm transition-shadow">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">{p.name}</p>
                {p.categoryId && (
                  <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.categoryId.color }} />
                    {p.categoryId.name}
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{p.quantity} {p.unit}</p>
                {p.expiryDate && <p className="text-xs text-gray-400">{new Date(p.expiryDate).toLocaleDateString("de-DE")}</p>}
              </div>
            </Link>
          ))}
        </div>
      </section>
    );
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Warnungen</h1>
        <p className="text-sm text-gray-500">{total} Artikel benötigen Aufmerksamkeit</p>
      </div>
      <Section title="Nicht vorrätig" items={data?.outOfStock ?? []} icon={Package} color="text-red-600" />
      <Section title="Niedriger Bestand" items={data?.lowStock ?? []} icon={TrendingDown} color="text-yellow-600" />
      <Section title="Abgelaufen" items={data?.expired ?? []} icon={AlertTriangle} color="text-red-600" />
      <Section title="Läuft bald ab" items={data?.expiringSoon ?? []} icon={Clock} color="text-orange-600" />
    </div>
  );
}
