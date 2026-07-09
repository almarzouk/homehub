// Finance sub-section feature flags — toggle individual finance pages per household.

export type FinanzSectionKey =
  | "dashboard"
  | "ausgaben"
  | "fixkosten"
  | "sparziele"
  | "monatsplan"
  | "gehalt"
  | "berichte"
  | "investitionen"
  | "benachrichtigungen";

export interface FinanzSectionDefinition {
  key: FinanzSectionKey;
  label_de: string;
  beschreibung_de: string;
  href: string;
  defaultEnabled: boolean;
}

export const FINANZ_SECTION_REGISTRY: FinanzSectionDefinition[] = [
  {
    key: "dashboard",
    label_de: "Übersicht",
    beschreibung_de: "Finanz-Dashboard mit Sparboxen",
    href: "/finanzen/dashboard",
    defaultEnabled: true,
  },
  {
    key: "sparziele",
    label_de: "Sparboxen",
    beschreibung_de: "Ziele wie Reise oder neues Handy — Geld per Klick hinzufügen",
    href: "/finanzen/sparziele",
    defaultEnabled: true,
  },
  {
    key: "ausgaben",
    label_de: "Ausgaben",
    beschreibung_de: "Tägliche Ausgaben erfassen",
    href: "/finanzen/ausgaben",
    defaultEnabled: true,
  },
  {
    key: "fixkosten",
    label_de: "Fixkosten",
    beschreibung_de: "Monatliche feste Ausgaben",
    href: "/finanzen/fixkosten",
    defaultEnabled: true,
  },
  {
    key: "gehalt",
    label_de: "Gehalt",
    beschreibung_de: "Monatliches Einkommen",
    href: "/finanzen/gehalt",
    defaultEnabled: true,
  },
  {
    key: "monatsplan",
    label_de: "Monatsplan",
    beschreibung_de: "Budgetplanung pro Monat",
    href: "/finanzen/monatsplan",
    defaultEnabled: false,
  },
  {
    key: "berichte",
    label_de: "Berichte",
    beschreibung_de: "Ausgabenanalyse und Charts",
    href: "/finanzen/berichte",
    defaultEnabled: false,
  },
  {
    key: "investitionen",
    label_de: "Investitionen",
    beschreibung_de: "Portfolio und Anlagen",
    href: "/finanzen/investitionen",
    defaultEnabled: false,
  },
  {
    key: "benachrichtigungen",
    label_de: "Benachrichtigungen",
    beschreibung_de: "Finanz-Warnungen",
    href: "/finanzen/benachrichtigungen",
    defaultEnabled: false,
  },
];

export const FINANZ_SECTION_MAP = Object.fromEntries(
  FINANZ_SECTION_REGISTRY.map((s) => [s.key, s])
) as Record<FinanzSectionKey, FinanzSectionDefinition>;

export const DEFAULT_FINANZ_SECTIONS: FinanzSectionKey[] =
  FINANZ_SECTION_REGISTRY.filter((s) => s.defaultEnabled).map((s) => s.key);

export function isValidFinanzSectionKey(key: string): key is FinanzSectionKey {
  return key in FINANZ_SECTION_MAP;
}

export function resolveEnabledFinanzSections(enabled?: string[]): FinanzSectionKey[] {
  if (!enabled || enabled.length === 0) {
    return FINANZ_SECTION_REGISTRY.map((s) => s.key);
  }
  return enabled.filter(isValidFinanzSectionKey);
}

export function isFinanzSectionEnabled(
  key: FinanzSectionKey,
  enabled?: string[]
): boolean {
  if (!enabled || enabled.length === 0) return true;
  return enabled.includes(key);
}

/** Quick-add presets for savings boxes */
export const SAVINGS_BOX_TEMPLATES = [
  { name: "Reise", emoji: "✈️", color: "sky", targetAmount: 200000 },
  { name: "Neues Handy", emoji: "📱", color: "violet", targetAmount: 80000 },
  { name: "Notgroschen", emoji: "🛡️", color: "emerald", targetAmount: 300000 },
  { name: "Auto", emoji: "🚗", color: "amber", targetAmount: 500000 },
  { name: "Wohnung", emoji: "🏠", color: "rose", targetAmount: 1000000 },
] as const;

export const QUICK_DEPOSIT_AMOUNTS = [10, 25, 50, 100, 200] as const;
