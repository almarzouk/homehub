"use client";

import { useEffect, useState, useCallback } from "react";
import { CheckCircle, XCircle, AlertTriangle, X, Info } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
  id: string;
  type: ToastType;
  message: string;
  exiting?: boolean;
}

let toastIdCounter = 0;

const TOAST_ICONS = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
} as const;

const TOAST_COLORS = {
  success: "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300",
  error: "bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300",
  warning: "bg-yellow-50 dark:bg-yellow-950/40 border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-300",
  info: "bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300",
} as const;

const TOAST_ICON_COLORS = {
  success: "text-emerald-500",
  error: "text-red-500",
  warning: "text-yellow-500",
  info: "text-blue-500",
} as const;

// Global toast state
let globalAddToast: ((type: ToastType, message: string) => void) | null = null;

export function toast(type: ToastType, message: string) {
  globalAddToast?.(type, message);
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((type: ToastType, message: string) => {
    const id = `toast-${++toastIdCounter}`;
    setToasts((prev) => [...prev, { id, type, message }]);
    // Auto-dismiss after 4s
    setTimeout(() => {
      setToasts((prev) =>
        prev.map((t) => (t.id === id ? { ...t, exiting: true } : t))
      );
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 200);
    }, 4000);
  }, []);

  useEffect(() => {
    globalAddToast = addToast;
    return () => {
      globalAddToast = null;
    };
  }, [addToast]);

  const dismiss = (id: string) => {
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, exiting: true } : t))
    );
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 200);
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-[200] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((t) => {
        const Icon = TOAST_ICONS[t.type];
        return (
          <div
            key={t.id}
            className={cn(
              "pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl border shadow-lg",
              TOAST_COLORS[t.type],
              t.exiting ? "toast-exit" : "toast-enter"
            )}
          >
            <Icon className={cn("h-5 w-5 flex-shrink-0 mt-0.5", TOAST_ICON_COLORS[t.type])} />
            <p className="flex-1 text-sm font-medium">{t.message}</p>
            <button
              onClick={() => dismiss(t.id)}
              className="p-0.5 rounded-md hover:bg-black/5 dark:hover:bg-white/5 transition-colors flex-shrink-0"
            >
              <X className="h-4 w-4 opacity-60" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
