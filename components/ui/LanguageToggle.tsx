"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import type { Lang } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const LANGS: { code: Lang; label: string; title: string }[] = [
  { code: "de", label: "DE", title: "Deutsch" },
  { code: "ar", label: "ع",  title: "العربية" },
  { code: "es", label: "ES", title: "Español" },
  { code: "bg", label: "БГ", title: "Български" },
];

export default function LanguageToggle({ className }: { className?: string }) {
  const { lang, setLang } = useLanguage();

  return (
    <div
      className={cn(
        "flex items-center gap-1 p-1 rounded-xl bg-gray-100 dark:bg-gray-800",
        className
      )}
    >
      {LANGS.map(({ code, label, title }) => (
        <button
          key={code}
          onClick={() => setLang(code)}
          title={title}
          className={cn(
            "flex items-center justify-center px-2 py-1 rounded-lg text-xs font-bold tracking-wide transition-all",
            lang === code
              ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
              : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
