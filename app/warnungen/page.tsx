"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { AlertTriangle, PackageX, TrendingDown, Clock, Calendar } from "lucide-react";

interface AlertProduct {
  _id: string;
  name: string;
  quantity: number;
  unit: string;
  minQuantity: number;
  expiryDate?: string;
}

interface Alerts {
  outOfStock: AlertProduct[];
  lowStock: AlertProduct[];
  expired: AlertProduct[];
  expiringSoon: AlertProduct[];
}

export default function WarnungenPage() {
  const [alerts, setAlerts] = useState<Alerts>({ outOfStock: [], lowStock: [], expired: [], expiringSoon: [] });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/vorrat/warnungen");
    const data = await res.json();
    setAlerts(data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const total = alerts.outOfStock.length + alerts.lowStock.length + alerts.expired.length + alerts.expiringSoon.length;

  if (loading) return <div className="flex justify-center py-32"><div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Warnungen</h1>
        <p className="text-sm text-gray-500">{total} Produkte benötigen Aufmerksamkeit</p>
      </div>

      {total === 0 && (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-950 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="h-8 w-8 text-green-500" />
          </div>
          <p className="text-gray-500">Alles in Ordnung! Keine Warnungen.</p>
        </div>
      )}

      {alerts.outOfStock.length > 0 && (
        <Section title="Nicht vorrätig" color="red" icon={<PackageX className="h-5 w-5" />} count={alerts.outOfStock.length}>
          {alerts.outOfStock.map((p) => (
            <ProductRow key={p._id} p={p} />
          ))}
        </Section>
      )}

      {alerts.expired.length > 0 && (
        <Section title="Abgelaufen" color="red" icon={<Calendar className="h-5 w-5" />} count={alerts.expired.length}>
          {alerts.expired.map((p) => (
            <ProductRow key={p._id} p={p} showExpiry />
          ))}
        </Section>
      )}

      {alerts.lowStock.length > 0 && (
        <Section title="Niedriger Bestand" color="yellow" icon={<TrendingDown className="h-5 w-5" />} count={alerts.lowStock.length}>
          {alerts.lowStock.map((p) => (
            <ProductRow key={p._id} p={p} />
          ))}
        </Section>
      )}

      {alerts.expiringSoon.length > 0 && (
        <Section title="Läuft bald ab" color="orange" icon={<Clock className="h-5 w-5" />} count={alerts.expiringSoon.length}>
          {alerts.expiringSoon.map((p) => (
            <ProductRow key={p._id} p={p} showExpiry />
          ))}
        </Section>
      )}
    </div>
  );
}

function Section({ title, color, icon, count, children }: {
  title: string; color: "red" | "yellow" | "orange"; icon: React.ReactNode; count: number; children: React.ReactNode;
}) {
  const colors = {
    red: "bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400",
    yellow: "bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-400",
    orange: "bg-orange-50 dark:bg-orange-950 border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-400",
  };
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
      <div className={`flex items-center gap-2 px-5 py-3 border-b ${colors[color]}`}>
        {icon}
        <span className="font-semibold">{title}</span>
        <span className="ml-auto text-xs font-medium px-2 py-0.5 rounded-full bg-white/50 dark:bg-black/20">{count}</span>
      </div>
      <div className="divide-y divide-gray-50 dark:divide-gray-800">{children}</div>
    </div>
  );
}

function ProductRow({ p, showExpiry }: { p: AlertProduct; showExpiry?: boolean }) {
  const UNIT_LABELS: Record<string, string> = { piece: "Stück", kg: "kg", g: "g", liter: "Liter", ml: "ml", box: "Karton", pack: "Packung" };
  return (
    <Link href={`/vorrat/${p._id}`} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
      <span className="text-sm font-medium text-gray-900 dark:text-white">{p.name}</span>
      <div className="flex items-center gap-3 text-xs text-gray-500">
        {showExpiry && p.expiryDate && <span>{new Date(p.expiryDate).toLocaleDateString("de-DE")}</span>}
        <span>{p.quantity} {UNIT_LABELS[p.unit] ?? p.unit}</span>
      </div>
    </Link>
  );
}
