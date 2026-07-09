"use client";

import { useEffect, useCallback, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export default function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  size = "md",
  className,
}: ModalProps) {
  const [mounted, setMounted] = useState(false);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    document.body.classList.add("modal-open");
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.classList.remove("modal-open");
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, handleKeyDown]);

  if (!open || !mounted) return null;

  const sizeClass = {
    sm: "sm:max-w-sm",
    md: "sm:max-w-md",
    lg: "sm:max-w-lg",
  }[size];

  const content = (
    <div
      className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center sm:p-4 modal-overlay animate-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" aria-hidden />

      {/* Panel — sits above bottom nav on mobile (mb-16) */}
      <div
        className={cn(
          "modal-panel relative w-full flex flex-col bg-white dark:bg-gray-900 shadow-2xl",
          "rounded-t-3xl sm:rounded-2xl",
          "max-h-[min(78dvh,calc(100dvh-5.5rem))] sm:max-h-[88dvh]",
          "mb-16 sm:mb-0",
          "animate-modal-slide-up",
          sizeClass,
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile drag handle */}
        <div className="sm:hidden flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
        </div>

        {title && (
          <div className="modal-header flex items-center justify-between px-5 py-3 sm:py-4 border-b border-gray-100 dark:border-gray-800 flex-shrink-0 gap-3">
            <div className="font-semibold text-gray-900 dark:text-white text-base min-w-0 flex-1">
              {title}
            </div>
            <button
              onClick={onClose}
              className="p-2.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors flex-shrink-0"
              aria-label="Close"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>
        )}

        <div className="modal-body flex-1 overflow-y-auto overscroll-contain px-5 py-4 min-h-0 touch-pan-y">
          {children}
        </div>

        {footer && (
          <div className="modal-footer flex-shrink-0 px-5 py-4 border-t border-gray-100 dark:border-gray-800 safe-bottom">
            {footer}
          </div>
        )}

        {/* Extra safe padding at bottom on mobile */}
        <div className="sm:hidden h-2 flex-shrink-0" />
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
