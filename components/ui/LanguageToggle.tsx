"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Globe } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Lang } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const LANGS: { code: Lang; label: string; flag: string }[] = [
  { code: "de", label: "Deutsch",    flag: "🇩🇪" },
  { code: "en", label: "English",    flag: "🇬🇧" },
  { code: "ar", label: "العربية",    flag: "🇸🇦" },
  { code: "es", label: "Español",    flag: "🇪🇸" },
  { code: "bg", label: "Български",  flag: "🇧🇬" },
  { code: "pt", label: "Português (BR)", flag: "🇧🇷" },
];

export default function LanguageToggle({ className }: { className?: string }) {
  const { lang, setLang } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const current = LANGS.find((l) => l.code === lang) ?? LANGS[0];

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium
          bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700
          text-gray-700 dark:text-gray-200 transition-colors"
      >
        <Globe className="w-3.5 h-3.5 opacity-60" />
        <span>{current.flag}</span>
        <span className="hidden sm:inline">{current.label}</span>
        <ChevronDown className={cn("w-3 h-3 opacity-50 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 end-0 min-w-[140px] rounded-xl shadow-lg
          bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700
          py-1 overflow-hidden">
          {LANGS.map(({ code, label, flag }) => (
            <button
              key={code}
              onClick={() => { setLang(code); setOpen(false); }}
              className={cn(
                "flex items-center gap-2.5 w-full px-3 py-2 text-xs text-start transition-colors",
                lang === code
                  ? "bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-semibold"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
              )}
            >
              <span className="text-base">{flag}</span>
              <span>{label}</span>
              {lang === code && <span className="ms-auto text-blue-500">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
