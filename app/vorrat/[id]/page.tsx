"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Edit3, Trash2, Check, ShoppingCart } from "lucide-react";

interface Product {
  _id: string;
  name: string;
  barcode?: string;
  categoryId?: { _id: string; name: string; color: string } | null;
  quantity: number;
  unit: string;
  minQuantity: number;
  expiryDate?: string;
  location?: string;
  notes?: string;
  inShoppingList?: boolean;
}
interface Category { _id: string; name: string; color: string; }
interface Location { _id: string; name: string; icon: string; }

import { useTranslation } from "@/hooks/useTranslation";
import { useLanguage } from "@/contexts/LanguageContext";

const UNIT_KEYS = ["piece", "kg", "g", "liter", "ml", "box", "pack"] as const;

export default function ProduktDetailSeite() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const { lang } = useLanguage();
  const unitLabel = (u: string) => ["piece","box","pack","liter"].includes(u) ? t(`vorrat.units.${u === "liter" ? "liter" : u === "piece" ? "piece" : u === "box" ? "box" : "pack"}`) : u;
  const [product, setProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "", barcode: "", categoryId: "", quantity: "0",
    unit: "piece", minQuantity: "0", expiryDate: "", location: "", notes: "", inShoppingList: false,
  });

  const load = useCallback(async () => {
    setLoading(true);
    const [pRes, cRes, lRes] = await Promise.all([
      fetch(`/api/vorrat/produkte/${id}`),
      fetch("/api/vorrat/kategorien"),
      fetch("/api/vorrat/lagerorte"),
    ]);
    if (!pRes.ok) { router.replace("/vorrat"); return; }
    const p = await pRes.json();
    const c = await cRes.json();
    const l = await lRes.json();
    setProduct(p);
    setCategories(Array.isArray(c) ? c : []);
    setLocations(Array.isArray(l) ? l : []);
    setLoading(false);
  }, [id, router]);

  useEffect(() => { load(); }, [load]);

  const startEdit = () => {
    if (!product) return;
    setForm({
      name: product.name,
      barcode: product.barcode ?? "",
      categoryId: product.categoryId?._id ?? "",
      quantity: product.quantity.toString(),
      unit: product.unit,
      minQuantity: product.minQuantity.toString(),
      expiryDate: product.expiryDate ? product.expiryDate.slice(0, 10) : "",
      location: product.location ?? "",
      notes: product.notes ?? "",
      inShoppingList: product.inShoppingList ?? false,
    });
    setEditing(true);
  };

  const saveEdit = async () => {
    setSaving(true);
    setError("");
    const res = await fetch(`/api/vorrat/produkte/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        barcode: form.barcode || undefined,
        categoryId: form.categoryId || undefined,
        quantity: parseFloat(form.quantity) || 0,
        unit: form.unit,
        minQuantity: parseFloat(form.minQuantity) || 0,
        expiryDate: form.expiryDate || null,
        location: form.location || undefined,
        notes: form.notes || undefined,
        inShoppingList: form.inShoppingList,
      }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error || t("common.error")); setSaving(false); return; }
    setProduct(data);
    setEditing(false);
    setSaving(false);
  };

  const deleteProduct = async () => {
    if (!confirm(t("common.confirm") + "?")) return;
    await fetch(`/api/vorrat/produkte/${id}`, { method: "DELETE" });
    router.push("/vorrat");
  };

  const toggleShoppingList = async () => {
    const res = await fetch(`/api/vorrat/produkte/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inShoppingList: !product?.inShoppingList }),
    });
    const data = await res.json();
    if (res.ok) setProduct(data);
  };

  if (loading) return <div className="flex justify-center py-32"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>;
  if (!product) return null;

  const statusColor = product.quantity === 0 ? "bg-red-100 text-red-700" : product.quantity <= product.minQuantity ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700";

  if (editing) {
    return (
      <div className="max-w-2xl mx-auto space-y-5">
        <div className="flex items-center gap-3">
          <button onClick={() => setEditing(false)} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800"><ArrowLeft className="h-5 w-5" /></button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t("common.edit")} {t("vorrat.title")}</h1>
        </div>
        {error && <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">{error}</div>}

        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">{t("common.name")} *</label>
            <input type="text" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Barcode</label>
            <input type="text" value={form.barcode} onChange={(e) => setForm((f) => ({ ...f, barcode: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">{t("common.category")}</label>
            <select value={form.categoryId} onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">— {t("common.all")} —</option>
              {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1.5">{t("vorrat.quantity")}</label>
              <input type="number" min="0" step="0.01" value={form.quantity} onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">{t("vorrat.unit")}</label>
              <select value={form.unit} onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {UNIT_KEYS.map((u) => <option key={u} value={u}>{unitLabel(u)}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">{t("vorrat.minQuantity")}</label>
            <input type="number" min="0" step="0.01" value={form.minQuantity} onChange={(e) => setForm((f) => ({ ...f, minQuantity: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">{t("vorrat.location")}</label>
            <select value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">—</option>
              {locations.map((l) => <option key={l._id} value={l.name}>{l.icon} {l.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">{t("vorrat.expiryDate")}</label>
            <input type="date" value={form.expiryDate} onChange={(e) => setForm((f) => ({ ...f, expiryDate: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">{t("common.note")}</label>
            <textarea rows={2} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.inShoppingList} onChange={(e) => setForm((f) => ({ ...f, inShoppingList: e.target.checked }))} className="w-4 h-4 accent-blue-500" />
            <span className="text-sm">{t("vorrat.shopping.title")}</span>
          </label>
        </div>

        <div className="flex gap-3">
          <button onClick={() => setEditing(false)} className="flex-1 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">{t("common.cancel")}</button>
          <button onClick={saveEdit} disabled={saving} className="flex-1 py-2.5 bg-blue-500 hover:bg-blue-600 disabled:opacity-60 text-white rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2">
            {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Check className="h-4 w-4" />}
            {saving ? t("haushalt.saving") : t("common.save")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <Link href="/vorrat" className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800"><ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" /></Link>
        <div className="flex items-center gap-2">
          <button onClick={startEdit} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400"><Edit3 className="h-5 w-5" /></button>
          <button onClick={deleteProduct} className="p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-950 text-red-500"><Trash2 className="h-5 w-5" /></button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{product.name}</h1>
        {product.barcode && <p className="text-xs text-gray-400 mb-3">{product.barcode}</p>}
        <div className="flex items-center gap-3">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColor}`}>
            {product.quantity} {unitLabel(product.unit)}
          </span>
          {product.categoryId && (
            <span className="flex items-center gap-1.5 text-sm text-gray-500">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: product.categoryId.color }} />
              {product.categoryId.name}
            </span>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800">
        <div className="px-5 py-3 flex justify-between text-sm">
          <span className="text-gray-500">{t("vorrat.minQuantity")}</span>
          <span className="font-medium">{product.minQuantity} {unitLabel(product.unit)}</span>
        </div>
        {product.location && (
          <div className="px-5 py-3 flex justify-between text-sm">
            <span className="text-gray-500">{t("vorrat.location")}</span>
            <span className="font-medium">{product.location}</span>
          </div>
        )}
        {product.expiryDate && (
          <div className="px-5 py-3 flex justify-between text-sm">
            <span className="text-gray-500">{t("vorrat.expiryDate")}</span>
            <span className="font-medium">{new Date(product.expiryDate).toLocaleDateString(lang)}</span>
          </div>
        )}
        {product.notes && (
          <div className="px-5 py-3 text-sm">
            <span className="text-gray-500">{t("common.note")}</span>
            <p className="mt-1 text-gray-700 dark:text-gray-300">{product.notes}</p>
          </div>
        )}
      </div>

      <button onClick={toggleShoppingList}
        className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-colors border ${product.inShoppingList ? "bg-blue-50 dark:bg-blue-950 border-blue-300 text-blue-700 dark:text-blue-300" : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-blue-300 hover:text-blue-600"}`}>
        <ShoppingCart className="h-4 w-4" />
        {product.inShoppingList ? t("vorrat.shopping.remove") : t("vorrat.shopping.addLowStock")}
      </button>
    </div>
  );
}
