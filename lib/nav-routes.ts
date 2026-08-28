// Central route → module mapping for feature-flag filtering across the app.

import type { ModuleKey } from "./modules";
import type { FinanzSectionKey } from "./finanzen-sections";

export interface RouteModuleMapping {
  href: string;
  moduleKey: ModuleKey;
  /** Finance sub-section key (only for /finanzen/* routes) */
  finanzSection?: FinanzSectionKey;
}

/** Maps every navigable route to its parent module */
export const ROUTE_MODULE_MAP: RouteModuleMapping[] = [
  // Tabs
  { href: "/dashboard", moduleKey: "uebersicht" },
  { href: "/", moduleKey: "uebersicht" },
  { href: "/kueche", moduleKey: "kueche" },
  { href: "/vorrat", moduleKey: "vorrat" },
  { href: "/finanzen", moduleKey: "finanzen" },
  { href: "/mehr", moduleKey: "uebersicht" },

  // Küche
  { href: "/kueche/statistiken", moduleKey: "kueche" },
  { href: "/kueche/einstellungen", moduleKey: "kueche" },
  { href: "/kueche/wochenplan", moduleKey: "kueche" },
  { href: "/kueche/was-kochen", moduleKey: "kueche" },

  // Vorrat
  { href: "/scan", moduleKey: "vorrat" },
  { href: "/warnungen", moduleKey: "vorrat" },
  { href: "/bewegungen", moduleKey: "bewegungen" },
  { href: "/einkaufsliste", moduleKey: "einkaufsrouten" },
  { href: "/vorrat/warnungen", moduleKey: "vorrat" },

  // Haushalt
  { href: "/haushalt", moduleKey: "haushalt" },
  { href: "/medikamente", moduleKey: "medikamente" },
  { href: "/wunschliste", moduleKey: "wunschliste" },
  { href: "/dokumente", moduleKey: "dokumente" },
  { href: "/docs", moduleKey: "docs" },
  { href: "/kalender", moduleKey: "kalender" },
  { href: "/reinigung", moduleKey: "reinigung" },
  { href: "/reisecheckliste", moduleKey: "haushalt" },
  { href: "/baby", moduleKey: "haushalt" },
  { href: "/reisen", moduleKey: "haushalt" },
  { href: "/haushaltskasse", moduleKey: "haushalt" },

  // Finanzen
  { href: "/finanzen/dashboard", moduleKey: "finanzen", finanzSection: "dashboard" },
  { href: "/finanzen/ausgaben", moduleKey: "finanzen", finanzSection: "ausgaben" },
  { href: "/finanzen/fixkosten", moduleKey: "finanzen", finanzSection: "fixkosten" },
  { href: "/finanzen/sparziele", moduleKey: "finanzen", finanzSection: "sparziele" },
  { href: "/finanzen/monatsplan", moduleKey: "finanzen", finanzSection: "monatsplan" },
  { href: "/finanzen/gehalt", moduleKey: "finanzen", finanzSection: "gehalt" },
  { href: "/finanzen/berichte", moduleKey: "finanzen", finanzSection: "berichte" },
  { href: "/finanzen/investitionen", moduleKey: "finanzen", finanzSection: "investitionen" },
  { href: "/finanzen/benachrichtigungen", moduleKey: "finanzen", finanzSection: "benachrichtigungen" },

  // Familie
  { href: "/familie", moduleKey: "familie" },
  { href: "/benachrichtigungen", moduleKey: "familie" },
  { href: "/familie/termine", moduleKey: "termine" },
  { href: "/chat", moduleKey: "chat" },
  { href: "/fitness", moduleKey: "fitness" },
  { href: "/einstellungen", moduleKey: "einstellungen" },
  { href: "/einstellungen/module", moduleKey: "einstellungen" },
  { href: "/einstellungen/finanzen", moduleKey: "einstellungen" },
  { href: "/einstellungen/mitglieder", moduleKey: "einstellungen" },

  // Fahrzeuge & Haustiere
  { href: "/fahrzeuge", moduleKey: "fahrzeuge" },
  { href: "/haustiere", moduleKey: "haustiere" },
  { href: "/energie", moduleKey: "energie" },
  { href: "/lieferungen", moduleKey: "lieferungen" },
];

export function getModuleForRoute(href: string): ModuleKey | null {
  const sorted = [...ROUTE_MODULE_MAP].sort((a, b) => b.href.length - a.href.length);
  const match = sorted.find(
    (r) => href === r.href || href.startsWith(r.href + "/")
  );
  return match?.moduleKey ?? null;
}

export function getFinanzSectionForRoute(href: string): FinanzSectionKey | null {
  const sorted = [...ROUTE_MODULE_MAP]
    .filter((r) => r.finanzSection)
    .sort((a, b) => b.href.length - a.href.length);
  const match = sorted.find(
    (r) => href === r.href || href.startsWith(r.href + "/")
  );
  return match?.finanzSection ?? null;
}
