"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ScanLine, Camera } from "lucide-react";

export default function ScanPage() {
  const router = useRouter();
  const [barcode, setBarcode] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ found: boolean; product?: { _id: string; name: string }; suggestion?: { name: string; barcode: string } } | null>(null);

  const search = async (code: string) => {
    if (!code.trim()) return;
    setLoading(true);
    setResult(null);
    const res = await fetch(`/api/vorrat/barcode?code=${encodeURIComponent(code.trim())}`);
    const data = await res.json();
    setResult(data);
    setLoading(false);
  };

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Barcode scannen</h1>
        <p className="text-sm text-gray-500">Produkt per Barcode suchen</p>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 text-center space-y-4">
        <div className="w-20 h-20 rounded-2xl bg-blue-50 dark:bg-blue-950 flex items-center justify-center mx-auto">
          <Camera className="h-10 w-10 text-blue-500" />
        </div>
        <p className="text-sm text-gray-500">Kamerascan wird in der mobilen App unterstützt.<br />Barcode hier manuell eingeben:</p>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Barcode (EAN / UPC)</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && search(barcode)}
              placeholder="z. B. 4006381333641"
              className="flex-1 px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={() => search(barcode)}
              disabled={loading || !barcode.trim()}
              className="px-4 py-2.5 bg-blue-500 hover:bg-blue-600 disabled:opacity-60 text-white rounded-xl text-sm font-medium transition-colors flex items-center gap-2"
            >
              {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <ScanLine className="h-4 w-4" />}
              Suchen
            </button>
          </div>
        </div>

        {result && (
          <div className={`rounded-xl p-4 ${result.found ? "bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800" : "bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800"}`}>
            {result.found && result.product ? (
              <div>
                <p className="text-sm font-medium text-green-700 dark:text-green-400 mb-2">Produkt gefunden!</p>
                <p className="font-semibold text-gray-900 dark:text-white">{result.product.name}</p>
                <button
                  onClick={() => router.push(`/vorrat/${result.product!._id}`)}
                  className="mt-3 text-sm text-green-700 dark:text-green-400 underline"
                >
                  Zum Produkt →
                </button>
              </div>
            ) : (
              <div>
                <p className="text-sm font-medium text-blue-700 dark:text-blue-400 mb-2">
                  {result.suggestion?.name ? "Vorschlag gefunden:" : "Kein Produkt gefunden."}
                </p>
                {result.suggestion?.name && <p className="font-semibold text-gray-900 dark:text-white">{result.suggestion.name}</p>}
                <button
                  onClick={() => router.push(`/vorrat/neu?barcode=${encodeURIComponent(barcode)}&name=${encodeURIComponent(result.suggestion?.name ?? "")}`)}
                  className="mt-3 text-sm text-blue-700 dark:text-blue-400 underline"
                >
                  Neues Produkt anlegen →
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
