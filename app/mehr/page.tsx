"use client";

import Link from "next/link";
import {
  Home,
  Pill,
  Gift,
  FileText,
  ShoppingCart,
  ArrowLeftRight,
  Users,
  Calendar,
  Sparkles,
  Car,
  PawPrint,
  Zap,
  MessageCircle,
  Dumbbell,
  Package,
  Settings,
  CalendarDays,
  LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MehrItem {
  href: string;
  icon: LucideIcon;
  label: string;
  beschreibung: string;
  color: string;
}

const MEHR_ITEMS: MehrItem[] = [
  { href: "/haushalt", icon: Home, label: "Haushalt", beschreibung: "Aufgaben, Reinigung & Wartung", color: "text-cyan-500 bg-cyan-50 dark:bg-cyan-950" },
  { href: "/medikamente", icon: Pill, label: "Medikamente", beschreibung: "Hausapotheke & Einnahmeplan", color: "text-red-500 bg-red-50 dark:bg-red-950" },
  { href: "/wunschliste", icon: Gift, label: "Wunschliste", beschreibung: "Geschenkideen & Wünsche", color: "text-pink-500 bg-pink-50 dark:bg-pink-950" },
  { href: "/dokumente", icon: FileText, label: "Dokumente", beschreibung: "Wichtige Dateien & Unterlagen", color: "text-blue-500 bg-blue-50 dark:bg-blue-950" },
  { href: "/einkaufsliste", icon: ShoppingCart, label: "Einkaufsrouten", beschreibung: "Optimierte Einkaufslisten", color: "text-green-500 bg-green-50 dark:bg-green-950" },
  { href: "/bewegungen", icon: ArrowLeftRight, label: "Bewegungen", beschreibung: "Lagerbestands-Bewegungen", color: "text-orange-500 bg-orange-50 dark:bg-orange-950" },
  { href: "/familie", icon: Users, label: "Familie", beschreibung: "Haushaltsmitglieder & Aufgaben", color: "text-violet-500 bg-violet-50 dark:bg-violet-950" },
  { href: "/kalender", icon: CalendarDays, label: "Kalender", beschreibung: "Termine & Ereignisse", color: "text-indigo-500 bg-indigo-50 dark:bg-indigo-950" },
  { href: "/reinigung", icon: Sparkles, label: "Reinigung", beschreibung: "Putzpläne & Aufgaben", color: "text-sky-500 bg-sky-50 dark:bg-sky-950" },
  { href: "/fahrzeuge", icon: Car, label: "Fahrzeuge", beschreibung: "TÜV, Service & Wartung", color: "text-amber-500 bg-amber-50 dark:bg-amber-950" },
  { href: "/haustiere", icon: PawPrint, label: "Haustiere", beschreibung: "Futter, Impfungen & Tierarzt", color: "text-lime-500 bg-lime-50 dark:bg-lime-950" },
  { href: "/energie", icon: Zap, label: "Energie", beschreibung: "Strom, Gas & Wasserverbrauch", color: "text-yellow-500 bg-yellow-50 dark:bg-yellow-950" },
  { href: "/chat", icon: MessageCircle, label: "Chat", beschreibung: "Nachrichten im Haushalt", color: "text-purple-500 bg-purple-50 dark:bg-purple-950" },
  { href: "/fitness", icon: Dumbbell, label: "Fitness", beschreibung: "Training & Aktivitäten", color: "text-teal-500 bg-teal-50 dark:bg-teal-950" },
  { href: "/lieferungen", icon: Package, label: "Lieferungen", beschreibung: "Pakete & Sendungsverfolgung", color: "text-rose-500 bg-rose-50 dark:bg-rose-950" },
  { href: "/einstellungen", icon: Settings, label: "Einstellungen", beschreibung: "Haushalt, Kategorien & Berechtigungen", color: "text-gray-500 bg-gray-100 dark:bg-gray-800" },
];

export default function MehrPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Mehr</h1>
      <div className="grid grid-cols-1 gap-3">
        {MEHR_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-4 p-4 rounded-2xl",
                "bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800",
                "hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors",
                "active:scale-[0.98] transition-transform"
              )}
            >
              <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0", item.color)}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-gray-900 dark:text-white text-sm">{item.label}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{item.beschreibung}</p>
              </div>
              <svg className="ml-auto w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
