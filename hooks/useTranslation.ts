import { useLanguage } from "@/contexts/LanguageContext";
import { translations } from "@/lib/i18n";

// Recursive type-safe key resolution
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function resolve(obj: any, keys: string[]): string {
  let current = obj;
  for (const k of keys) {
    if (current == null || typeof current !== "object") return keys.join(".");
    current = current[k];
  }
  return typeof current === "string" ? current : keys.join(".");
}

export function useTranslation() {
  const { lang } = useLanguage();
  const dict = translations[lang];

  const t = (key: string): string => resolve(dict, key.split("."));

  return { t, lang };
}
