"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

export default function LanguageToggle({ className }: { className?: string }) {
  const { lang, setLang } = useLanguage();

  return (
    <div
      className={cn(
        "flex items-center gap-1 p-1 rounded-xl bg-gray-100 dark:bg-gray-800",
        className
      )}
    >
      <button
        onClick={() => setLang("de")}
        title="Deutsch"
        className={cn(
          "flex items-center justify-center px-2.5 py-1 rounded-lg text-xs font-bold tracking-wide transition-all",
          lang === "de"
            ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
            : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        )}
      >
        DE
      </button>
      <button
        onClick={() => setLang("ar")}
        title="العربية"
        className={cn(
          "flex items-center justify-center px-2.5 py-1 rounded-lg text-xs font-bold tracking-wide transition-all",
          lang === "ar"
            ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
            : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        )}
      >
        ع
      </button>
    </div>
  );
}
