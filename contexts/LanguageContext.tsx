"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import type { Lang } from "@/lib/i18n";

interface LangCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  isRTL: boolean;
}

const LanguageContext = createContext<LangCtx>({
  lang: "de",
  setLang: () => {},
  isRTL: false,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("de");
  const [mounted, setMounted] = useState(false);

  // Restore from localStorage after mount
  useEffect(() => {
    const stored = localStorage.getItem("homehub-lang") as Lang | null;
    if (stored && (stored === "ar" || stored === "de" || stored === "es" || stored === "bg" || stored === "en" || stored === "pt")) {
      setLangState(stored);
    }
    setMounted(true);
  }, []);

  // Sync lang/dir to <html> and persist
  useEffect(() => {
    if (!mounted) return;
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    localStorage.setItem("homehub-lang", lang);
  }, [lang, mounted]);

  const setLang = (l: Lang) => setLangState(l);

  return (
    <LanguageContext.Provider value={{ lang, setLang, isRTL: lang === "ar" }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);
