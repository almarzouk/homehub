"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ScanLine, Camera, CameraOff, Search, X, CheckCircle, AlertCircle, ArrowRight } from "lucide-react";
import Link from "next/link";

type ScanResult = {
  found: boolean;
  product?: { _id: string; name: string; quantity?: number; unit?: string };
  suggestion?: { name: string; barcode: string };
};

declare global {
  interface Window {
    BarcodeDetector?: new (options?: { formats: string[] }) => {
      detect(source: ImageBitmapSource): Promise<{ rawValue: string; format: string }[]>;
    };
  }
}

export default function ScanPage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number>(0);
  // useRef so the tick closure always reads the latest value without stale captures
  const lastScannedRef = useRef<string | null>(null);
  const loadingRef = useRef(false);

  const [mode, setMode] = useState<"camera" | "manual">("camera");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [barcode, setBarcode] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  // UI-only: checked synchronously inside startCamera from window directly
  const [supportsBarcodeDetector, setSupportsBarcodeDetector] = useState(false);

  const stopCamera = () => {
    cancelAnimationFrame(animFrameRef.current);
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
      const data: ScanResult = await res.json();
      setResult(data);
      if (data.found) stopCamera();
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

    // Check support directly from window — not from React state to avoid stale closure
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

      // Throttle: run detection every 300ms instead of every animation frame
      // to reduce CPU usage and avoid flooding
      const tick = () => {
        animFrameRef.current = window.setTimeout(async () => {
          if (!videoRef.current || !streamRef.current) return;
          if (videoRef.current.readyState >= 2) {
            try {
              const barcodes = await detector.detect(videoRef.current);
              if (barcodes.length > 0) {
                await searchBarcode(barcodes[0].rawValue);
              }
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

  // Stop timer-based loop properly
  const stopTick = () => {
    clearTimeout(animFrameRef.current);
    cancelAnimationFrame(animFrameRef.current);
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Barcode scannen</h1>
          <p className="text-sm text-gray-500">Produkt per Kamera oder Barcode suchen</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { setMode("camera"); setResult(null); }}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
              mode === "camera" ? "bg-blue-600 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
            }`}
          >
            <Camera className="h-4 w-4" />
            Kamera
          </button>
          <button
            onClick={() => { setMode("manual"); setResult(null); }}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
              mode === "manual" ? "bg-blue-600 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
            }`}
          >
            <Search className="h-4 w-4" />
            Manuell
          </button>
        </div>
      </div>

      {/* Camera view */}
      {mode === "camera" && (
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
                <Camera className="h-4 w-4" />
                Kamera starten
              </button>
            </div>
          )}
        </div>
      )}

      {/* Detected barcode */}
      {mode === "camera" && barcode && (
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

      {/* Manual input — always visible in manual mode, also shown for camera without BarcodeDetector */}
      {(mode === "manual" || (mode === "camera" && scanning && !supportsBarcodeDetector)) && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 space-y-3">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Barcode manuell eingeben (EAN / UPC)
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && searchBarcode(barcode)}
              placeholder="z. B. 4006381333641"
              className="flex-1 px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus={mode === "manual"}
            />
            <button
              onClick={() => searchBarcode(barcode)}
              disabled={!barcode.trim() || loading}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Search className="h-4 w-4" />}
              Suchen
            </button>
          </div>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className={`rounded-2xl border p-5 ${result.found ? "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800" : "bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800"}`}>
          {result.found && result.product ? (
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-green-800 dark:text-green-200">{result.product.name}</p>
                  {result.product.quantity !== undefined && (
                    <p className="text-sm text-green-600 dark:text-green-400">Bestand: {result.product.quantity} {result.product.unit ?? ""}</p>
                  )}
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Link href={`/vorrat/${result.product._id}`} className="flex items-center gap-1.5 px-3 py-2 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 transition-colors">
                  Produkt ansehen <ArrowRight className="h-3.5 w-3.5" />
                </Link>
                <button onClick={reset} className="px-3 py-2 bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 rounded-xl text-sm border border-gray-200 dark:border-gray-700 hover:bg-gray-50 transition-colors">
                  Neuer Scan
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-amber-800 dark:text-amber-200">Produkt nicht gefunden</p>
                  {result.suggestion?.name && <p className="text-sm text-amber-600 dark:text-amber-400">Vorschlag: {result.suggestion.name}</p>}
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => router.push(`/vorrat/neu?barcode=${encodeURIComponent(barcode)}&name=${encodeURIComponent(result?.suggestion?.name ?? "")}`)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-amber-600 text-white rounded-xl text-sm font-medium hover:bg-amber-700 transition-colors"
                >
                  Neues Produkt anlegen <ArrowRight className="h-3.5 w-3.5" />
                </button>
                <button onClick={reset} className="px-3 py-2 bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 rounded-xl text-sm border border-gray-200 dark:border-gray-700 hover:bg-gray-50 transition-colors">
                  Neuer Scan
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Info */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 space-y-2">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <ScanLine className="h-4 w-4 text-blue-500 flex-shrink-0" />
          <span>Unterstützte Formate: EAN-13, EAN-8, UPC-A, UPC-E, QR, Code128, Code39</span>
        </div>
        {!supportsBarcodeDetector && (
          <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>Automatischer Scan benötigt Chrome oder Edge. Barcode bitte manuell eingeben.</span>
          </div>
        )}
      </div>
    </div>
  );
}
