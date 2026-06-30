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
  Sparkles,
  Car,
  PawPrint,
  Zap,
  MessageCircle,
  Dumbbell,
  Package,
  Settings,
  CalendarDays,
  Plane,
  Baby,
  Banknote,
  LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";

interface MehrItem {
  href: string;
  icon: LucideIcon;
  labelKey: string;
  descKey: string;
  color: string;
}

const MEHR_ITEMS: MehrItem[] = [
  { href: "/haushalt", icon: Home, labelKey: "aufgaben", descKey: "haushalt", color: "text-cyan-500 bg-cyan-50 dark:bg-cyan-950" },
  { href: "/medikamente", icon: Pill, labelKey: "medikamente", descKey: "medikamente", color: "text-red-500 bg-red-50 dark:bg-red-950" },
  { href: "/wunschliste", icon: Gift, labelKey: "wunschliste", descKey: "wunschliste", color: "text-pink-500 bg-pink-50 dark:bg-pink-950" },
  { href: "/dokumente", icon: FileText, labelKey: "dokumente", descKey: "dokumente", color: "text-blue-500 bg-blue-50 dark:bg-blue-950" },
  { href: "/einkaufsliste", icon: ShoppingCart, labelKey: "einkaufsliste", descKey: "einkaufsliste", color: "text-green-500 bg-green-50 dark:bg-green-950" },
  { href: "/bewegungen", icon: ArrowLeftRight, labelKey: "bewegungen", descKey: "bewegungen", color: "text-orange-500 bg-orange-50 dark:bg-orange-950" },
  { href: "/familie", icon: Users, labelKey: "mitglieder", descKey: "familie", color: "text-violet-500 bg-violet-50 dark:bg-violet-950" },
  { href: "/kalender", icon: CalendarDays, labelKey: "kalender", descKey: "kalender", color: "text-indigo-500 bg-indigo-50 dark:bg-indigo-950" },
  { href: "/reinigung", icon: Sparkles, labelKey: "reinigung", descKey: "reinigung", color: "text-sky-500 bg-sky-50 dark:bg-sky-950" },
  { href: "/fahrzeuge", icon: Car, labelKey: "fahrzeugpflege", descKey: "fahrzeuge", color: "text-amber-500 bg-amber-50 dark:bg-amber-950" },
  { href: "/haustiere", icon: PawPrint, labelKey: "haustiere", descKey: "haustiere", color: "text-lime-500 bg-lime-50 dark:bg-lime-950" },
  { href: "/energie", icon: Zap, labelKey: "energie", descKey: "energie", color: "text-yellow-500 bg-yellow-50 dark:bg-yellow-950" },
  { href: "/chat", icon: MessageCircle, labelKey: "chat", descKey: "chat", color: "text-purple-500 bg-purple-50 dark:bg-purple-950" },
  { href: "/fitness", icon: Dumbbell, labelKey: "fitness", descKey: "fitness", color: "text-teal-500 bg-teal-50 dark:bg-teal-950" },
  { href: "/lieferungen", icon: Package, labelKey: "lieferungen", descKey: "lieferungen", color: "text-rose-500 bg-rose-50 dark:bg-rose-950" },
  { href: "/einstellungen", icon: Settings, labelKey: "einstellungen", descKey: "einstellungen", color: "text-gray-500 bg-gray-100 dark:bg-gray-800" },
  { href: "/reisecheckliste", icon: Plane, labelKey: "reisecheckliste", descKey: "reisecheckliste", color: "text-sky-500 bg-sky-50 dark:bg-sky-950" },
  { href: "/baby", icon: Baby, labelKey: "baby", descKey: "baby", color: "text-pink-500 bg-pink-50 dark:bg-pink-950" },
  { href: "/reisen", icon: Plane, labelKey: "reisen", descKey: "reisen", color: "text-blue-500 bg-blue-50 dark:bg-blue-950" },
  { href: "/haushaltskasse", icon: Banknote, labelKey: "haushaltskasse", descKey: "haushaltskasse", color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-950" },
];

export default function MehrPage() {
  const { t } = useTranslation();
  // Filter out dokumente — hidden from users for now (code kept for future use)
  const visibleItems = MEHR_ITEMS.filter((item) => item.href !== "/dokumente");
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">{t("nav.items.mehr")}</h1>
      <div className="grid grid-cols-1 gap-3">
        {visibleItems.map((item) => {
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
                <p className="font-semibold text-gray-900 dark:text-white text-sm">{t(`nav.items.${item.labelKey}`)}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{t(`nav.desc.${item.descKey}`)}</p>
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
