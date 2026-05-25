"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Package, Search, Image as ImageIcon, X } from "lucide-react";

interface Category { _id: string; name: string; color: string; }
interface Location { _id: string; name: string; icon: string; }

const UNITS = ["piece", "kg", "g", "liter", "ml", "box", "pack"];
const UNIT_LABELS: Record<string, string> = { piece: "Stück", kg: "kg", g: "g", liter: "Liter", ml: "ml", box: "Karton", pack: "Packung" };

export default function NeuesProdukteSeite() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(false);
  const [lookingUp, setLookingUp] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    barcode: "",
    categoryId: "",
    quantity: "1",
    unit: "piece",
    minQuantity: "0",
    expiryDate: "",
    location: "",
    notes: "",
    inShoppingList: false,
    image: "",
  });

  useEffect(() => {
    Promise.all([
      fetch("/api/vorrat/kategorien").then((r) => r.json()),
      fetch("/api/vorrat/lagerorte").then((r) => r.json()),
    ]).then(([cats, locs]) => {
      setCategories(Array.isArray(cats) ? cats : []);
      setLocations(Array.isArray(locs) ? locs : []);
    });
  }, []);

  const lookupBarcode = async () => {
    if (!form.barcode.trim()) return;
    setLookingUp(true);
    try {
      const res = await fetch(`/api/vorrat/barcode?code=${encodeURIComponent(form.barcode.trim())}`);
      const data = await res.json();
      if (data.found && data.product) {
        // Product already exists
        setError(`Produkt „${data.product.name}" existiert bereits im Vorrat.`);
      } else if (data.suggestion) {
        setForm((f) => ({
          ...f,
          name: data.suggestion.name || f.name,
          image: data.suggestion.image || f.image,
        }));
        if (!data.suggestion.name && !data.suggestion.image) {
          setError("Kein Produkt für diesen Barcode gefunden.");
        }
      }
    } catch {
      setError("Barcode-Abfrage fehlgeschlagen.");
    } finally {
      setLookingUp(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { setError("Name ist Pflicht."); return; }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/vorrat/produkte", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          barcode: form.barcode || undefined,
          categoryId: form.categoryId || undefined,
          quantity: parseFloat(form.quantity) || 0,
          unit: form.unit,
          minQuantity: parseFloat(form.minQuantity) || 0,
          expiryDate: form.expiryDate || undefined,
          location: form.location || undefined,
          notes: form.notes || undefined,
          inShoppingList: form.inShoppingList,
          image: form.image || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Fehler beim Speichern."); setLoading(false); return; }
      router.push("/vorrat");
    } catch {
      setError("Netzwerkfehler.");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/vorrat" className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
          <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Neues Produkt</h1>
          <p className="text-sm text-gray-500">Zum Vorrat hinzufügen</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3 text-sm text-red-700 dark:text-red-400">{error}</div>
        )}

        {/* Image Preview */}
        {form.image && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 flex items-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={form.image} alt="Produktbild" className="w-20 h-20 rounded-xl object-contain bg-gray-50 border border-gray-100" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Produktbild gefunden</p>
              <p className="text-xs text-gray-400 mt-0.5 truncate max-w-xs">{form.image}</p>
            </div>
            <button type="button" onClick={() => setForm((f) => ({ ...f, image: "" }))} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
              <X className="h-4 w-4 text-gray-400" />
            </button>
          </div>
        )}

        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 space-y-4">
          <h2 className="font-semibold text-gray-900 dark:text-white">Produktdaten</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Barcode</label>
            <div className="flex gap-2">
              <input type="text" value={form.barcode} onChange={(e) => setForm((f) => ({ ...f, barcode: e.target.value }))}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), lookupBarcode())}
                placeholder="EAN / UPC"
                className="flex-1 px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <button type="button" onClick={lookupBarcode} disabled={!form.barcode.trim() || lookingUp}
                className="flex items-center gap-1.5 px-3 py-2.5 bg-blue-50 dark:bg-blue-950 hover:bg-blue-100 dark:hover:bg-blue-900 disabled:opacity-50 text-blue-600 dark:text-blue-400 rounded-xl text-sm font-medium transition-colors border border-blue-200 dark:border-blue-800">
                {lookingUp ? <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" /> : <Search className="h-4 w-4" />}
                Abrufen
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-1">Barcode eingeben und &quot;Abrufen&quot; klicken, um Produktinfos & Bild automatisch zu laden.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Name *</label>
            <input type="text" required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="z. B. Milch"
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Bild-URL (optional)</label>
            <div className="flex gap-2">
              <input type="url" value={form.image} onChange={(e) => setForm((f) => ({ ...f, image: e.target.value }))}
                placeholder="https://…"
                className="flex-1 px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              {form.image && <div className="flex items-center"><ImageIcon className="h-4 w-4 text-blue-500" /></div>}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Kategorie</label>
            <select value={form.categoryId} onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">— Keine Kategorie —</option>
              {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 space-y-4">
          <h2 className="font-semibold text-gray-900 dark:text-white">Menge & Einheit</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Menge</label>
              <input type="number" min="0" step="0.01" value={form.quantity} onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Einheit</label>
              <select value={form.unit} onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {UNITS.map((u) => <option key={u} value={u}>{UNIT_LABELS[u]}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Mindestmenge (Warnschwelle)</label>
            <input type="number" min="0" step="0.01" value={form.minQuantity} onChange={(e) => setForm((f) => ({ ...f, minQuantity: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 space-y-4">
          <h2 className="font-semibold text-gray-900 dark:text-white">Lagerung</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Lagerort</label>
            <select value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">— Kein Ort —</option>
              {locations.map((l) => <option key={l._id} value={l.name}>{l.icon} {l.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Mindesthaltbarkeitsdatum</label>
            <input type="date" value={form.expiryDate} onChange={(e) => setForm((f) => ({ ...f, expiryDate: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Notizen</label>
            <textarea rows={2} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.inShoppingList} onChange={(e) => setForm((f) => ({ ...f, inShoppingList: e.target.checked }))} className="w-4 h-4 accent-blue-500" />
            <span className="text-sm text-gray-700 dark:text-gray-300">Zur Einkaufsliste hinzufügen</span>
          </label>
        </div>

        <div className="flex gap-3">
          <Link href="/vorrat" className="flex-1 py-2.5 text-center rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            Abbrechen
          </Link>
          <button type="submit" disabled={loading}
            className="flex-1 py-2.5 bg-blue-500 hover:bg-blue-600 disabled:opacity-60 text-white rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2">
            {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Package className="h-4 w-4" />}
            {loading ? "Speichere…" : "Produkt anlegen"}
          </button>
        </div>
      </form>
    </div>
  );
}

