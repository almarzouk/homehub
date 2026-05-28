"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ScanLine, Camera, CameraOff, Search, X,
  CheckCircle, AlertCircle, Plus, Minus, RefreshCw,
  Package, MapPin, ChevronDown, ArrowRight,
} from "lucide-react";
import Link from "next/link";

// ─── Types ───────────────────────────────────────────────────────────────────
type BarcodeResult = {
  found: boolean;
  product?: FoundProduct;
  suggestion?: { name: string; barcode: string; image?: string };
};

type FoundProduct = {
  _id: string;
  name: string;
  quantity: number;
  unit: string;
  minQuantity: number;
  location?: string;
  categoryId?: { _id: string; name: string; color: string };
};

type Category = { _id: string; name: string; color: string };
type Location = { _id: string; name: string; icon?: string };

const UNITS = ["piece", "kg", "g", "liter", "ml", "box", "pack"] as const;
const UNIT_LABELS: Record<string, string> = {
  piece: "Stück", kg: "kg", g: "g", liter: "Liter", ml: "ml", box: "Karton", pack: "Packung",
};

declare global {
  interface Window {
    BarcodeDetector?: new (options?: { formats: string[] }) => {
      detect(source: ImageBitmapSource): Promise<{ rawValue: string; format: string }[]>;
    };
  }
}

// ─── Movement panel (product found) ─────────────────────────────────────────
function MovementPanel({ product, onNewScan }: { product: FoundProduct; onNewScan: () => void }) {
  const router = useRouter();
  const [type, setType] = useState<"IN" | "OUT" | "ADJUST">("IN");
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [newQty, setNewQty] = useState<number | null>(null);

  const submit = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/vorrat/bewegungen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product._id, type, quantity: qty, note: note || undefined }),
      });
      if (res.ok) {
        const mv = await res.json();
        setNewQty(mv.newQuantity ?? null);
        setDone(true);
      }
    } finally {
      setSaving(false);
    }
  };

  if (done) {
    return (
      <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-3">
          <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400 flex-shrink-0" />
          <div>
            <p className="font-semibold text-green-800 dark:text-green-200">Bewegung gespeichert</p>
            {newQty !== null && (
              <p className="text-sm text-green-600 dark:text-green-400">
                Neuer Bestand: <strong>{newQty} {UNIT_LABELS[product.unit] ?? product.unit}</strong>
              </p>
            )}
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link href={`/vorrat/${product._id}`} className="flex items-center gap-1.5 px-3 py-2 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 transition-colors">
            Produkt ansehen <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <button onClick={onNewScan} className="px-3 py-2 bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 rounded-xl text-sm border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            Neuer Scan
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
      {/* Product header */}
      <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950 flex items-center justify-center flex-shrink-0">
            <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="font-semibold text-gray-900 dark:text-white">{product.name}</p>
            <p className="text-sm text-gray-500">
              Bestand: <strong>{product.quantity}</strong> {UNIT_LABELS[product.unit] ?? product.unit}
              {product.location && <span className="ml-2 text-gray-400">· {product.location}</span>}
            </p>
          </div>
        </div>
        <Link href={`/vorrat/${product._id}`} className="text-xs text-blue-500 hover:underline whitespace-nowrap flex-shrink-0">
          Details
        </Link>
      </div>

      {/* Movement form */}
      <div className="p-4 space-y-4">
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Lagerbewegung buchen</p>

        {/* Type selector */}
        <div className="grid grid-cols-3 gap-2">
          {(["IN", "OUT", "ADJUST"] as const).map((t) => {
            const label = t === "IN" ? "Eingang" : t === "OUT" ? "Ausgang" : "Korrektur";
            const active = type === t;
            const color = t === "IN" ? "bg-green-600 text-white" : t === "OUT" ? "bg-red-600 text-white" : "bg-orange-500 text-white";
            const inactive = "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700";
            return (
              <button key={t} onClick={() => setType(t)} className={`py-2 rounded-xl text-sm font-medium transition-colors ${active ? color : inactive}`}>
                {label}
              </button>
            );
          })}
        </div>

        {/* Quantity */}
        <div className="space-y-1.5">
          <label className="text-sm text-gray-600 dark:text-gray-400">
            {type === "ADJUST" ? "Neuer Bestand" : "Menge"}
          </label>
          <div className="flex items-center gap-3">
            <button onClick={() => setQty(Math.max(0, qty - 1))} className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
              <Minus className="h-4 w-4" />
            </button>
            <input
              type="number"
              min={0}
              value={qty}
              onChange={(e) => setQty(Math.max(0, Number(e.target.value)))}
              className="flex-1 text-center px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-lg font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button onClick={() => setQty(qty + 1)} className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
              <Plus className="h-4 w-4" />
            </button>
            <span className="text-sm text-gray-500 w-12">{UNIT_LABELS[product.unit] ?? product.unit}</span>
          </div>
        </div>

        {/* Quick qty buttons */}
        <div className="flex gap-2 flex-wrap">
          {[1, 2, 3, 5, 10].map((n) => (
            <button key={n} onClick={() => setQty(n)} className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${qty === n ? "bg-blue-600 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"}`}>
              {n}
            </button>
          ))}
        </div>

        {/* Note */}
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Notiz (optional)"
          className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        {/* Submit */}
        <div className="flex gap-2">
          <button
            onClick={submit}
            disabled={saving || qty <= 0}
            className={`flex-1 py-2.5 rounded-xl text-white font-medium text-sm transition-colors disabled:opacity-50 ${
              type === "IN" ? "bg-green-600 hover:bg-green-700" : type === "OUT" ? "bg-red-600 hover:bg-red-700" : "bg-orange-500 hover:bg-orange-600"
            }`}
          >
            {saving ? "Speichern..." : type === "IN" ? "Eingang buchen" : type === "OUT" ? "Ausgang buchen" : "Bestand korrigieren"}
          </button>
          <button onClick={onNewScan} className="px-3 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── New product form (product not found) ────────────────────────────────────
function NewProductForm({ barcode, suggestedName, suggestedImage, onNewScan }: {
  barcode: string;
  suggestedName: string;
  suggestedImage?: string;
  onNewScan: () => void;
}) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: suggestedName,
    barcode,
    quantity: 1,
    unit: "piece",
    minQuantity: 1,
    location: "",
    categoryId: "",
    expiryDate: "",
    notes: "",
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<{ _id: string; name: string } | null>(null);

  useEffect(() => {
    fetch("/api/vorrat/kategorien").then((r) => r.json()).then(setCategories).catch(() => {});
    fetch("/api/vorrat/lagerorte").then((r) => r.json()).then(setLocations).catch(() => {});
  }, []);

  const set = (k: string, v: string | number) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.name.trim()) { setError("Name ist erforderlich."); return; }
    setSaving(true);
    setError(null);
    try {
      const body = {
        ...form,
        quantity: Number(form.quantity),
        minQuantity: Number(form.minQuantity),
        categoryId: form.categoryId || undefined,
        location: form.location || undefined,
        expiryDate: form.expiryDate || undefined,
        notes: form.notes || undefined,
        barcode: form.barcode || undefined,
        image: suggestedImage || undefined,
      };
      const res = await fetch("/api/vorrat/produkte", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? "Fehler beim Speichern.");
        return;
      }
      const product = await res.json();
      setCreated({ _id: product._id, name: product.name });
    } finally {
      setSaving(false);
    }
  };

  if (created) {
    return (
      <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-3">
          <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400 flex-shrink-0" />
          <div>
            <p className="font-semibold text-green-800 dark:text-green-200">Produkt gespeichert</p>
            <p className="text-sm text-green-600 dark:text-green-400">{created.name}</p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link href={`/vorrat/${created._id}`} className="flex items-center gap-1.5 px-3 py-2 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 transition-colors">
            Produkt ansehen <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <button onClick={onNewScan} className="px-3 py-2 bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 rounded-xl text-sm border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            Neuer Scan
          </button>
        </div>
      </div>
    );
  }

  const field = "w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center gap-3">
        <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0" />
        <div>
          <p className="font-semibold text-gray-900 dark:text-white">Produkt nicht gefunden</p>
          <p className="text-xs text-gray-500">Barcode: <span className="font-mono">{barcode}</span></p>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {suggestedImage && (
          <img src={suggestedImage} alt="Produktbild" className="w-24 h-24 object-contain rounded-xl border border-gray-200 dark:border-gray-700 mx-auto" />
        )}

        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Neues Produkt anlegen</p>

        {/* Name */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Name *</label>
          <input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Produktname" className={field} autoFocus />
        </div>

        {/* Quantity + Unit */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Menge</label>
            <div className="flex items-center gap-2">
              <button onClick={() => set("quantity", Math.max(0, Number(form.quantity) - 1))} className="w-8 h-9 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-sm">
                <Minus className="h-3.5 w-3.5" />
              </button>
              <input type="number" min={0} value={form.quantity} onChange={(e) => set("quantity", e.target.value)} className="flex-1 px-2 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <button onClick={() => set("quantity", Number(form.quantity) + 1)} className="w-8 h-9 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-sm">
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Einheit</label>
            <div className="relative">
              <select value={form.unit} onChange={(e) => set("unit", e.target.value)} className={`${field} appearance-none pr-8`}>
                {UNITS.map((u) => <option key={u} value={u}>{UNIT_LABELS[u]}</option>)}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Min quantity */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Mindestbestand (Warnschwelle)</label>
          <input type="number" min={0} value={form.minQuantity} onChange={(e) => set("minQuantity", e.target.value)} className={field} />
        </div>

        {/* Location */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-gray-600 dark:text-gray-400 flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" /> Lagerort
          </label>
          <div className="relative">
            <select value={form.location} onChange={(e) => set("location", e.target.value)} className={`${field} appearance-none pr-8`}>
              <option value="">-- kein Lagerort --</option>
              {locations.map((l) => <option key={l._id} value={l.name}>{l.icon ? `${l.icon} ` : ""}{l.name}</option>)}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Category */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Kategorie</label>
          <div className="relative">
            <select value={form.categoryId} onChange={(e) => set("categoryId", e.target.value)} className={`${field} appearance-none pr-8`}>
              <option value="">-- keine Kategorie --</option>
              {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Expiry */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Mindesthaltbarkeitsdatum</label>
          <input type="date" value={form.expiryDate} onChange={(e) => set("expiryDate", e.target.value)} className={field} />
        </div>

        {/* Notes */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Notizen</label>
          <input value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Optional" className={field} />
        </div>

        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

        <div className="flex gap-2 pt-1">
          <button onClick={submit} disabled={saving || !form.name.trim()} className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white font-medium text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors">
            {saving ? "Speichern..." : "Produkt speichern"}
          </button>
          <button onClick={onNewScan} className="px-3 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main scan page ───────────────────────────────────────────────────────────
export default function ScanPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number>(0);
  const lastScannedRef = useRef<string | null>(null);
  const loadingRef = useRef(false);

  const [mode, setMode] = useState<"camera" | "manual">("camera");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [barcode, setBarcode] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BarcodeResult | null>(null);
  const [supportsBarcodeDetector, setSupportsBarcodeDetector] = useState(false);

  const stopTick = () => { clearTimeout(animFrameRef.current); cancelAnimationFrame(animFrameRef.current); };

  const stopCamera = () => {
    stopTick();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setScanning(false);
  };

  const searchBarcode = async (code: string) => {
    if (!code.trim() || code === lastScannedRef.current || loadingRef.current) return;
    lastScannedRef.current = code;
    loadingRef.current = true;
    setLoading(true);
    setBarcode(code);
    setResult(null);
    try {
      const res = await fetch(`/api/vorrat/barcode?code=${encodeURIComponent(code.trim())}`);
      const data: BarcodeResult = await res.json();
      setResult(data);
      stopCamera(); // always stop camera after scan result — user takes action below
    } catch {
      setResult(null);
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  };

  const startCamera = async () => {
    setCameraError(null);
    setResult(null);
    lastScannedRef.current = null;
    loadingRef.current = false;

    const hasBarcodeDetector = typeof window !== "undefined" && "BarcodeDetector" in window;
    setSupportsBarcodeDetector(hasBarcodeDetector);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setScanning(true);

      if (!hasBarcodeDetector) return;

      const detector = new window.BarcodeDetector!({
        formats: ["ean_13", "ean_8", "upc_a", "upc_e", "qr_code", "code_128", "code_39", "itf", "data_matrix"],
      });

      const tick = () => {
        animFrameRef.current = window.setTimeout(async () => {
          if (!videoRef.current || !streamRef.current) return;
          if (videoRef.current.readyState >= 2) {
            try {
              const barcodes = await detector.detect(videoRef.current);
              if (barcodes.length > 0) await searchBarcode(barcodes[0].rawValue);
            } catch { /* ignore per-frame errors */ }
          }
          tick();
        }, 300);
      };
      tick();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      setCameraError(
        msg.includes("Permission") || msg.includes("NotAllowed")
          ? "Kamerazugriff verweigert. Bitte in den Browser-Einstellungen erlauben."
          : "Kamera konnte nicht gestartet werden."
      );
      setMode("manual");
    }
  };

  useEffect(() => {
    if (mode === "camera") startCamera();
    else { stopTick(); stopCamera(); }
    return () => { stopTick(); stopCamera(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const reset = () => {
    setResult(null);
    setBarcode("");
    lastScannedRef.current = null;
    loadingRef.current = false;
    if (mode === "camera") startCamera();
  };

  return (
    <div className="max-w-lg mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Barcode scannen</h1>
          <p className="text-sm text-gray-500">Produkt suchen, buchen oder anlegen</p>
        </div>
        <div className="flex gap-2">
          {(["camera", "manual"] as const).map((m) => (
            <button key={m} onClick={() => { setMode(m); setResult(null); }}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                mode === m ? "bg-blue-600 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}
            >
              {m === "camera" ? <Camera className="h-4 w-4" /> : <Search className="h-4 w-4" />}
              {m === "camera" ? "Kamera" : "Manuell"}
            </button>
          ))}
        </div>
      </div>

      {/* Camera */}
      {mode === "camera" && !result && (
        <div className="relative bg-black rounded-2xl overflow-hidden" style={{ aspectRatio: "4/3" }}>
          <video ref={videoRef} className="w-full h-full object-cover" playsInline muted autoPlay />
          {scanning && (
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <div className="relative w-56 h-56">
                <div className="absolute inset-0 border-2 border-white/30 rounded-2xl" />
                {(["top-0 left-0 border-t-2 border-l-2 rounded-tl-lg", "top-0 right-0 border-t-2 border-r-2 rounded-tr-lg", "bottom-0 left-0 border-b-2 border-l-2 rounded-bl-lg", "bottom-0 right-0 border-b-2 border-r-2 rounded-br-lg"] as const).map((cls, i) => (
                  <div key={i} className={`absolute w-6 h-6 border-white ${cls}`} />
                ))}
                <div className="absolute left-2 right-2 top-1/2 h-0.5 bg-blue-400/80 animate-pulse" />
              </div>
              <p className="absolute bottom-4 text-white/70 text-sm text-center px-4">
                {supportsBarcodeDetector ? "Barcode in den Rahmen halten" : "Kamera aktiv — Barcode unten eingeben"}
              </p>
            </div>
          )}
          {loading && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <div className="animate-spin h-8 w-8 border-2 border-white border-t-transparent rounded-full" />
            </div>
          )}
          {cameraError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gray-900 p-6 text-center">
              <CameraOff className="h-10 w-10 text-gray-400" />
              <p className="text-sm text-gray-400">{cameraError}</p>
            </div>
          )}
          {scanning && (
            <button onClick={stopCamera} className="absolute top-3 right-3 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors">
              <X className="h-4 w-4" />
            </button>
          )}
          {!scanning && !cameraError && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
              <button onClick={startCamera} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors">
                <Camera className="h-4 w-4" /> Kamera starten
              </button>
            </div>
          )}
        </div>
      )}

      {/* Detected barcode strip (camera mode, no result yet) */}
      {mode === "camera" && barcode && !result && (
        <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-xl px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-xs text-blue-500 font-medium">Erkannter Barcode</p>
            <p className="text-sm font-mono font-semibold text-blue-800 dark:text-blue-200">{barcode}</p>
          </div>
          <button onClick={() => searchBarcode(barcode)} disabled={loading} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">
            Suchen
          </button>
        </div>
      )}

      {/* Manual input */}
      {(mode === "manual" || (mode === "camera" && scanning && !supportsBarcodeDetector)) && !result && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 space-y-3">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Barcode manuell eingeben (EAN / UPC)</label>
          <div className="flex gap-2">
            <input
              type="text" value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && searchBarcode(barcode)}
              placeholder="z. B. 4006381333641"
              className="flex-1 px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus={mode === "manual"}
            />
            <button onClick={() => searchBarcode(barcode)} disabled={!barcode.trim() || loading}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Search className="h-4 w-4" />}
              Suchen
            </button>
          </div>
        </div>
      )}

      {/* ── Action panel after scan ── */}
      {result && result.found && result.product && (
        <MovementPanel product={result.product as FoundProduct} onNewScan={reset} />
      )}

      {result && !result.found && (
        <NewProductForm
          barcode={barcode}
          suggestedName={result.suggestion?.name ?? ""}
          suggestedImage={result.suggestion?.image}
          onNewScan={reset}
        />
      )}

      {/* Info footer */}
      {!result && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 space-y-2">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <ScanLine className="h-4 w-4 text-blue-500 flex-shrink-0" />
            <span>Unterstützte Formate: EAN-13, EAN-8, UPC-A, UPC-E, QR, Code128, Code39</span>
          </div>
          {!supportsBarcodeDetector && mode === "camera" && (
            <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>Automatischer Scan benötigt Chrome oder Edge. Barcode bitte manuell eingeben.</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
