"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useTranslation } from "@/hooks/useTranslation";
import { useLanguage } from "@/contexts/LanguageContext";
import { Plus, Search, AlertTriangle, Package } from "lucide-react";

interface Product {
  _id: string;
  name: string;
  quantity: number;
  unit: string;
  minQuantity: number;
  barcode?: string;
  expiryDate?: string;
  location?: string;
  image?: string | null;
  categoryId?: { _id: string; name: string; color: string } | null;
}

/** Build Open Food Facts CDN image URL from a barcode (EAN-8, EAN-13, UPC-12) */
function ofnImageUrl(barcode: string): string {
  const b = barcode.replace(/\D/g, "");
  if (b.length <= 8) {
    const p = b.padStart(8, "0");
    return `https://images.openfoodfacts.org/images/products/${p.slice(0,3)}/${p.slice(3,6)}/${p.slice(6)}/front.3.400.jpg`;
  }
  const p = b.padStart(13, "0");
  return `https://images.openfoodfacts.org/images/products/${p.slice(0,3)}/${p.slice(3,6)}/${p.slice(6,9)}/${p.slice(9)}/front.3.400.jpg`;
}

/** Product image: shows stored image, falls back to Open Food Facts CDN, then Package icon */
function ProductImage({ image, barcode, name }: { image?: string | null; barcode?: string; name: string }) {
  const [src, setSrc] = useState<string | null>(image || (barcode ? ofnImageUrl(barcode) : null));
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div className="w-9 h-9 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center flex-shrink-0">
        <Package className="h-4 w-4 text-gray-300 dark:text-gray-600" />
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={name}
      className="w-9 h-9 rounded-lg object-contain bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-0.5 flex-shrink-0"
      onError={() => {
        // If OFN CDN fails, try without the /front.3.400.jpg suffix
        if (src !== image && image) { setSrc(image); }
        else { setFailed(true); }
      }}
    />
  );
}

export default function VorratPage() {
  const { t } = useTranslation();
  const { lang } = useLanguage();
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const limit = 20;

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (search) params.set("search", search);
    const res = await fetch(`/api/vorrat/produkte?${params}`);
    const data = await res.json();
    setProducts(data.products ?? []);
    setTotal(data.total ?? 0);
    setLoading(false);
  }, [search, page]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  const statusColor = (p: Product) => {
    if (p.quantity === 0) return "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400";
    if (p.quantity <= p.minQuantity) return "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400";
    return "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t("vorrat.title")}</h1>
          <p className="text-sm text-gray-500">{total} {t("vorrat.products")}</p>
        </div>
        <div className="flex gap-2">
          <Link href="/warnungen" className="flex items-center gap-1.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 px-3 py-2 rounded-xl text-sm font-medium hover:shadow-sm transition-shadow">
            <AlertTriangle className="h-4 w-4 text-orange-500" />
            {t("vorrat.warnings")}
          </Link>
          <Link href="/vorrat/neu" className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors">
            <Plus className="h-4 w-4" />
            {t("common.add")}
          </Link>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder={t("common.search")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-20">
          <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">{search ? t("vorrat.noProductsFound") : t("vorrat.noProductsYet")}</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800 text-left">
                <th className="px-4 py-3 font-medium text-gray-500">{t("common.name")}</th>
                <th className="px-4 py-3 font-medium text-gray-500 text-right">{t("vorrat.quantity")}</th>
                <th className="px-4 py-3 font-medium text-gray-500 hidden sm:table-cell">{t("common.category")}</th>
                <th className="px-4 py-3 font-medium text-gray-500 hidden md:table-cell">{t("vorrat.location")}</th>
                <th className="px-4 py-3 font-medium text-gray-500 hidden md:table-cell">{t("vorrat.expiryDate")}</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p._id} className="border-b border-gray-50 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="px-4 py-3">
                    <Link href={`/vorrat/${p._id}`} className="flex items-center gap-3">
                      <ProductImage image={p.image} barcode={p.barcode} name={p.name} />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white hover:text-blue-600">{p.name}</p>
                        {p.barcode && <p className="text-xs text-gray-400">{p.barcode}</p>}
                      </div>
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(p)}`}>
                      {p.quantity} {p.unit}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell text-gray-500">
                    {p.categoryId ? (
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.categoryId.color }} />
                        {p.categoryId.name}
                      </span>
                    ) : "—"}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-gray-500">{p.location ?? "—"}</td>
                  <td className="px-4 py-3 hidden md:table-cell text-gray-500">
                    {p.expiryDate ? new Date(p.expiryDate).toLocaleDateString(lang) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 rounded-lg border text-sm disabled:opacity-40">{t("common.previous")}</button>
          <span className="text-sm text-gray-500">{page} / {totalPages}</span>
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1.5 rounded-lg border text-sm disabled:opacity-40">{t("common.next")}</button>
        </div>
      )}
    </div>
  );
}
