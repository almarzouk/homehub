// ─── Single source of truth for all navigable modules ────────────────────────
// This file is shared between the manifest API and the admin UI.

export type ModuleKey =
  | "uebersicht"
  | "kueche"
  | "vorrat"
  | "finanzen"
  | "haushalt"
  | "medikamente"
  | "wunschliste"
  | "dokumente"
  | "einkaufsrouten"
  | "bewegungen"
  | "familie"
  | "termine"
  | "kalender"
  | "reinigung"
  | "fahrzeuge"
  | "haustiere"
  | "energie"
  | "chat"
  | "fitness"
  | "lieferungen"
  | "einstellungen";

export interface ModuleDefinition {
  key: ModuleKey;
  label_de: string;
  beschreibung_de: string;
  icon: string; // Ionicons name (same icon set on mobile)
  color: string; // accent hex
  group: "tab" | "mehr";
  defaultEnabled: boolean;
  defaultViewForMembers: boolean;
  defaultEditForMembers: boolean;
}

export const MODULE_REGISTRY: ModuleDefinition[] = [
  {
    key: "uebersicht",
    label_de: "Übersicht",
    beschreibung_de: "Dashboard & Schnellzugriff",
    icon: "home-outline",
    color: "#3B82F6",
    group: "tab",
    defaultEnabled: true,
    defaultViewForMembers: true,
    defaultEditForMembers: true,
  },
  {
    key: "kueche",
    label_de: "Küche",
    beschreibung_de: "Rezepte & Kochgeräte",
    icon: "restaurant-outline",
    color: "#F97316",
    group: "tab",
    defaultEnabled: true,
    defaultViewForMembers: true,
    defaultEditForMembers: true,
  },
  {
    key: "vorrat",
    label_de: "Vorrat",
    beschreibung_de: "Lagerbestand verwalten",
    icon: "cube-outline",
    color: "#10B981",
    group: "tab",
    defaultEnabled: true,
    defaultViewForMembers: true,
    defaultEditForMembers: true,
  },
  {
    key: "finanzen",
    label_de: "Finanzen",
    beschreibung_de: "Ausgaben, Investitionen & Sparpläne",
    icon: "wallet-outline",
    color: "#8B5CF6",
    group: "tab",
    defaultEnabled: true,
    defaultViewForMembers: false,
    defaultEditForMembers: false,
  },
  {
    key: "haushalt",
    label_de: "Haushalt",
    beschreibung_de: "Aufgaben, Reinigung, Wartung",
    icon: "home-outline",
    color: "#06B6D4",
    group: "mehr",
    defaultEnabled: true,
    defaultViewForMembers: true,
    defaultEditForMembers: true,
  },
  {
    key: "medikamente",
    label_de: "Medikamente",
    beschreibung_de: "Vorrat, Dosierungen, Ablaufdaten",
    icon: "medkit-outline",
    color: "#EF4444",
    group: "mehr",
    defaultEnabled: true,
    defaultViewForMembers: true,
    defaultEditForMembers: true,
  },
  {
    key: "wunschliste",
    label_de: "Wunschliste",
    beschreibung_de: "Kaufziele & Wünsche",
    icon: "gift-outline",
    color: "#8B5CF6",
    group: "mehr",
    defaultEnabled: true,
    defaultViewForMembers: true,
    defaultEditForMembers: true,
  },
  {
    key: "dokumente",
    label_de: "Dokumente",
    beschreibung_de: "Verträge, Ausweise, Garantien",
    icon: "documents-outline",
    color: "#3B82F6",
    group: "mehr",
    defaultEnabled: true,
    defaultViewForMembers: true,
    defaultEditForMembers: true,
  },
  {
    key: "einkaufsrouten",
    label_de: "Einkaufsrouten",
    beschreibung_de: "Einkaufsliste nach Gängen sortieren",
    icon: "map-outline",
    color: "#10B981",
    group: "mehr",
    defaultEnabled: true,
    defaultViewForMembers: true,
    defaultEditForMembers: true,
  },
  {
    key: "bewegungen",
    label_de: "Lagerbewegungen",
    beschreibung_de: "Eingang · Ausgang · Bestandsanpassung",
    icon: "swap-horizontal-outline",
    color: "#3B82F6",
    group: "mehr",
    defaultEnabled: true,
    defaultViewForMembers: true,
    defaultEditForMembers: false,
  },
  {
    key: "familie",
    label_de: "Familie",
    beschreibung_de: "Mitglieder & Push-Nachrichten",
    icon: "people-outline",
    color: "#EC4899",
    group: "mehr",
    defaultEnabled: true,
    defaultViewForMembers: true,
    defaultEditForMembers: false,
  },
  {
    key: "termine",
    label_de: "Termine",
    beschreibung_de: "Arzt, Schule, Freizeit & mehr",
    icon: "calendar-outline",
    color: "#F59E0B",
    group: "mehr",
    defaultEnabled: true,
    defaultViewForMembers: true,
    defaultEditForMembers: true,
  },
  {
    key: "kalender",
    label_de: "Kalender",
    beschreibung_de: "Monatsansicht aller Termine",
    icon: "calendar-outline",
    color: "#F59E0B",
    group: "mehr",
    defaultEnabled: true,
    defaultViewForMembers: true,
    defaultEditForMembers: true,
  },
  {
    key: "reinigung",
    label_de: "Reinigungsplan",
    beschreibung_de: "Putzplan, Aufgaben & Häufigkeiten",
    icon: "sparkles-outline",
    color: "#06B6D4",
    group: "mehr",
    defaultEnabled: true,
    defaultViewForMembers: true,
    defaultEditForMembers: true,
  },
  {
    key: "fahrzeuge",
    label_de: "Fahrzeugpflege",
    beschreibung_de: "TÜV, Service & Wartungshistorie",
    icon: "car-outline",
    color: "#F97316",
    group: "mehr",
    defaultEnabled: true,
    defaultViewForMembers: true,
    defaultEditForMembers: true,
  },
  {
    key: "haustiere",
    label_de: "Haustiere",
    beschreibung_de: "Impfungen & Tierarzttermine",
    icon: "paw-outline",
    color: "#10B981",
    group: "mehr",
    defaultEnabled: true,
    defaultViewForMembers: true,
    defaultEditForMembers: true,
  },
  {
    key: "energie",
    label_de: "Energieverbrauch",
    beschreibung_de: "Strom, Gas, Wasser & Heizung",
    icon: "flash-outline",
    color: "#EAB308",
    group: "mehr",
    defaultEnabled: true,
    defaultViewForMembers: true,
    defaultEditForMembers: true,
  },
  {
    key: "chat",
    label_de: "Haushalts-Chat",
    beschreibung_de: "Nachrichten im Haushalt",
    icon: "chatbubbles-outline",
    color: "#6366F1",
    group: "mehr",
    defaultEnabled: true,
    defaultViewForMembers: true,
    defaultEditForMembers: true,
  },
  {
    key: "fitness",
    label_de: "Fitness & Gesundheit",
    beschreibung_de: "Gewicht, Training, Schritte & Schlaf",
    icon: "fitness-outline",
    color: "#8B5CF6",
    group: "mehr",
    defaultEnabled: true,
    defaultViewForMembers: true,
    defaultEditForMembers: true,
  },
  {
    key: "lieferungen",
    label_de: "Lieferungen",
    beschreibung_de: "Pakete & Sendungsverfolgung",
    icon: "cube-outline",
    color: "#3B82F6",
    group: "mehr",
    defaultEnabled: true,
    defaultViewForMembers: true,
    defaultEditForMembers: true,
  },
  {
    key: "einstellungen",
    label_de: "Einstellungen",
    beschreibung_de: "Haushalt, Kategorien & Berechtigungen",
    icon: "settings-outline",
    color: "#6B7280",
    group: "mehr",
    defaultEnabled: true,
    defaultViewForMembers: false,
    defaultEditForMembers: false,
  },
];

export const MODULE_MAP = Object.fromEntries(
  MODULE_REGISTRY.map((m) => [m.key, m])
) as Record<ModuleKey, ModuleDefinition>;

/** Default ordered tab keys shown in the bottom navigation bar */
export const DEFAULT_TABS: ModuleKey[] = [
  "uebersicht",
  "kueche",
  "vorrat",
  "finanzen",
];

/** Default ordered "Mehr" items */
export const DEFAULT_MEHR: ModuleKey[] = [
  "haushalt",
  "medikamente",
  "wunschliste",
  "dokumente",
  "einkaufsrouten",
  "bewegungen",
  "familie",
  "termine",
  "kalender",
  "reinigung",
  "fahrzeuge",
  "haustiere",
  "energie",
  "chat",
  "fitness",
  "lieferungen",
  "einstellungen",
];

export function isValidModuleKey(key: string): key is ModuleKey {
  return key in MODULE_MAP;
}
