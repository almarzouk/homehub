"use client";

import { useEffect, useState, useCallback } from "react";
import { TrendingUp, TrendingDown, Minus, RefreshCw } from "lucide-react";

interface Movement {
  _id: string;
  type: "IN" | "OUT" | "ADJUST";
  quantity: number;
  note?: string;
  createdAt: string;
  productId?: { _id: string; name: string; unit: string } | null;
}

export default function BewegungsPage() {
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/vorrat/bewegungen?limit=100");
    const data = await res.json();
    setMovements(Array.isArray(data) ? data : []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const TypeIcon = ({ type }: { type: string }) => {
    if (type === "IN") return <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-950 flex items-center justify-center"><TrendingUp className="h-4 w-4 text-green-600" /></div>;
    if (type === "OUT") return <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-950 flex items-center justify-center"><TrendingDown className="h-4 w-4 text-red-600" /></div>;
    return <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-950 flex items-center justify-center"><Minus className="h-4 w-4 text-blue-600" /></div>;
  };

  const typeLabel = (t: string) => t === "IN" ? "Eingang" : t === "OUT" ? "Ausgang" : "Anpassung";
  const UNIT_LABELS: Record<string, string> = { piece: "Stück", kg: "kg", g: "g", liter: "Liter", ml: "ml", box: "Karton", pack: "Packung" };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Bewegungen</h1>
          <p className="text-sm text-gray-500">Lagerein- und -ausgänge</p>
        </div>
        <button onClick={load} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500">
          <RefreshCw className="h-5 w-5" />
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : movements.length === 0 ? (
        <div className="text-center py-20 text-gray-500">Noch keine Bewegungen erfasst.</div>
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 divide-y divide-gray-50 dark:divide-gray-800">
          {movements.map((m) => (
            <div key={m._id} className="flex items-center gap-4 px-5 py-3.5">
              <TypeIcon type={m.type} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {m.productId?.name ?? "Unbekanntes Produkt"}
                </p>
                <p className="text-xs text-gray-400">
                  {typeLabel(m.type)} · {new Date(m.createdAt).toLocaleString("de-DE", { dateStyle: "short", timeStyle: "short" })}
                  {m.note ? ` · ${m.note}` : ""}
                </p>
              </div>
              <span className={`text-sm font-semibold ${m.type === "IN" ? "text-green-600" : m.type === "OUT" ? "text-red-600" : "text-blue-600"}`}>
                {m.type === "IN" ? "+" : m.type === "OUT" ? "−" : "±"}{m.quantity} {m.productId ? (UNIT_LABELS[m.productId.unit] ?? m.productId.unit) : ""}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
