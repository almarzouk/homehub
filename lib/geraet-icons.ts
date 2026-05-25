import {
  Microwave,
  Flame,
  CookingPot,
  UtensilsCrossed,
  Gauge,
  type LucideIcon,
} from "lucide-react";

export const STANDARD_ICON = "utensils";

export const GERAET_ICON_OPTIONEN: { schluessel: string; label: string; Icon: LucideIcon }[] = [
  { schluessel: "utensils", label: "Allgemein", Icon: UtensilsCrossed },
  { schluessel: "microwave", label: "Mikrowelle", Icon: Microwave },
  { schluessel: "flame", label: "Ofen / Grill", Icon: Flame },
  { schluessel: "cooking-pot", label: "Topf / Pfanne", Icon: CookingPot },
  { schluessel: "pressure", label: "Schnellkochtopf", Icon: Gauge },
];

const SCHLUESSEL_MAP: Record<string, LucideIcon> = {
  utensils: UtensilsCrossed,
  microwave: Microwave,
  flame: Flame,
  "cooking-pot": CookingPot,
  pressure: Gauge,
  mikrowelle: Microwave,
  backofen: Flame,
  gasofen: Flame,
  grill: Flame,
  kochtopf: CookingPot,
  schnellkochtopf: Gauge,
  pfanne: CookingPot,
};

const EMOJI_ZU_SCHLUESSEL: Record<string, string> = {
  "🫕": "pressure",
  "🍲": "cooking-pot",
  "📡": "microwave",
  "🔥": "flame",
  "🍳": "cooking-pot",
  "♨️": "flame",
  "🍽️": "utensils",
};

export function iconSchluesselNormalisieren(wert: string): string {
  if (!wert) return STANDARD_ICON;
  if (EMOJI_ZU_SCHLUESSEL[wert]) return EMOJI_ZU_SCHLUESSEL[wert];
  if (SCHLUESSEL_MAP[wert.toLowerCase()]) return wert.toLowerCase();
  return STANDARD_ICON;
}

export function iconKomponente(schluessel: string): LucideIcon {
  const normalisiert = iconSchluesselNormalisieren(schluessel);
  return SCHLUESSEL_MAP[normalisiert] ?? UtensilsCrossed;
}
