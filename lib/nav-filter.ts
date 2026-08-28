// Shared nav section definitions with module keys for feature-flag filtering.

import type { ModuleKey } from "./modules";
import type { FinanzSectionKey } from "./finanzen-sections";

export interface NavItemDef {
  href: string;
  labelKey: string;
  icon: string;
  moduleKey: ModuleKey;
  finanzSection?: FinanzSectionKey;
  badge?: "alerts" | "notifications";
}

export interface NavSectionDef {
  id: string;
  labelKey: string;
  icon: string;
  color: string;
  moduleKey: ModuleKey;
  items: NavItemDef[];
}

/** Route prefix → module key for "Mehr" page items */
export const MEHR_MODULE_MAP: Record<string, ModuleKey> = {
  "/haushalt": "haushalt",
  "/medikamente": "medikamente",
  "/wunschliste": "wunschliste",
  "/dokumente": "dokumente",
  "/docs": "docs",
  "/einkaufsliste": "einkaufsrouten",
  "/bewegungen": "bewegungen",
  "/familie": "familie",
  "/kalender": "kalender",
  "/reinigung": "reinigung",
  "/fahrzeuge": "fahrzeuge",
  "/haustiere": "haustiere",
  "/energie": "energie",
  "/chat": "chat",
  "/fitness": "fitness",
  "/lieferungen": "lieferungen",
  "/einstellungen": "einstellungen",
  "/reisecheckliste": "haushalt",
  "/baby": "haushalt",
  "/reisen": "haushalt",
  "/haushaltskasse": "haushalt",
};

export function filterNavItem(
  item: { href: string; finanzSection?: FinanzSectionKey; moduleKey?: ModuleKey },
  isModuleEnabled: (key: ModuleKey) => boolean,
  isFinanzSectionEnabled: (key: FinanzSectionKey) => boolean,
  moduleKey?: ModuleKey
): boolean {
  const mod = moduleKey ?? item.moduleKey;
  if (mod && !isModuleEnabled(mod)) return false;
  if (item.finanzSection && !isFinanzSectionEnabled(item.finanzSection)) return false;
  return true;
}
