"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useTranslation } from "@/hooks/useTranslation";
import { ShoppingCart, RefreshCw, Plus } from "lucide-react";

interface Product {
  _id: string;
  name: string;
  quantity: number;
  unit: string;
  minQuantity: number;
  categoryId?: { _id: string; name: string; color: string } | null;
}

const UNIT_LABELS: Record<string, string> = { piece: "Stück", kg: "kg", g: "g", liter: "Liter", ml: "ml", box: "Karton", pack: "Packung" };

export default function EinkaufslistePage() {
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/vorrat/einkaufsliste");
    const data = await res.json();
    setItems(Array.isArray(data) ? data : data.items ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const autoAdd = async () => {
    setAdding(true);
    await fetch("/api/vorrat/einkaufsliste", { method: "POST" });
    await load();
    setAdding(false);
  };

  const removeFromList = async (id: string) => {
    await fetch(`/api/vorrat/produkte/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inShoppingList: false }),
    });
    setItems((prev) => prev.filter((p) => p._id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Einkaufsliste</h1>
          <p className="text-sm text-gray-500">{items.length} Artikel</p>
        </div>
        <div className="flex gap-2">
          <button onClick={autoAdd} disabled={adding}
            className="flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 rounded-xl text-sm hover:shadow-sm transition-all disabled:opacity-60">
            <Plus className="h-4 w-4" />
            Niedrige Bestände
          </button>
          <button onClick={load} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500">
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : items.length === 0 ? (
        <div className="text-center py-20">
          <ShoppingCart className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 mb-4">Die Einkaufsliste ist leer.</p>
          <button onClick={autoAdd} className="px-4 py-2 bg-blue-500 text-white rounded-xl text-sm font-medium hover:bg-blue-600 transition-colors">
            Niedrige Bestände hinzufügen
          </button>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 divide-y divide-gray-50 dark:divide-gray-800">
          {items.map((p) => (
            <div key={p._id} className="flex items-center gap-4 px-5 py-3.5">
              <div className="flex-1 min-w-0">
                <Link href={`/vorrat/${p._id}`} className="text-sm font-medium text-gray-900 dark:text-white hover:text-blue-600 truncate block">
                  {p.name}
                </Link>
                <p className="text-xs text-gray-400">
                  Noch: {p.quantity} {UNIT_LABELS[p.unit] ?? p.unit} · Min: {p.minQuantity}
                  {p.categoryId && ` · ${p.categoryId.name}`}
                </p>
              </div>
              <button onClick={() => removeFromList(p._id)}
                className="text-xs px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors">
                Entfernen
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
