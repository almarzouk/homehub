"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  ChefHat,
  UtensilsCrossed,
  BarChart3,
  Settings,
  Package,
  ScanLine,
  Bell,
  TrendingUp,
  ShoppingCart,
  Wallet,
  Receipt,
  PiggyBank,
  CalendarClock,
  FileBarChart,
  Home,
  ChevronDown,
  ChevronRight,
  Users,
  ClipboardList,
  Pill,
  Gift,
  FileText,
  ArrowLeftRight,
  Calendar,
  Car,
  PawPrint,
  Zap,
  MessageCircle,
  Activity,
  Truck,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import UserMenu from "./UserMenu";
import ThemeToggle from "@/components/ui/ThemeToggle";
import LanguageToggle from "@/components/ui/LanguageToggle";
import { useAlertCount } from "@/hooks/useAlertCount";
import { useTranslation } from "@/hooks/useTranslation";

type NavSection = {
  id: string;
  labelKey: string;
  icon: React.ElementType;
  color: string;
  items: {
    href: string;
    labelKey: string;
    icon: React.ElementType;
    badge?: boolean;
  }[];
};

const sections: NavSection[] = [
  {
    id: "kueche",
    labelKey: "nav.sections.kueche",
    icon: ChefHat,
    color: "text-orange-500",
    items: [
      { href: "/kueche", labelKey: "nav.items.gerichte", icon: UtensilsCrossed },
      { href: "/kueche/statistiken", labelKey: "nav.items.statistiken", icon: BarChart3 },
      { href: "/kueche/einstellungen", labelKey: "nav.items.kochgeraete", icon: Settings },
    ],
  },
  {
    id: "vorrat",
    labelKey: "nav.sections.vorrat",
    icon: Package,
    color: "text-blue-500",
    items: [
      { href: "/vorrat", labelKey: "nav.items.inventar", icon: Package },
      { href: "/scan", labelKey: "nav.items.scannen", icon: ScanLine },
      { href: "/warnungen", labelKey: "nav.items.warnungen", icon: Bell, badge: true },
      { href: "/bewegungen", labelKey: "nav.items.bewegungen", icon: ArrowLeftRight },
      { href: "/einkaufsliste", labelKey: "nav.items.einkaufsliste", icon: ShoppingCart },
    ],
  },
  {
    id: "haushalt",
    labelKey: "nav.sections.haushalt",
    icon: ClipboardList,
    color: "text-cyan-500",
    items: [
      { href: "/haushalt", labelKey: "nav.items.aufgaben", icon: ClipboardList },
      { href: "/medikamente", labelKey: "nav.items.medikamente", icon: Pill },
      { href: "/wunschliste", labelKey: "nav.items.wunschliste", icon: Gift },
      { href: "/dokumente", labelKey: "nav.items.dokumente", icon: FileText },
      { href: "/kalender", labelKey: "nav.items.kalender", icon: Calendar },
      { href: "/reinigung", labelKey: "nav.items.reinigung", icon: Sparkles },
      { href: "/lieferungen", labelKey: "nav.items.lieferungen", icon: Truck },
    ],
  },
  {
    id: "finanzen",
    labelKey: "nav.sections.finanzen",
    icon: Wallet,
    color: "text-emerald-500",
    items: [
      { href: "/finanzen/dashboard", labelKey: "nav.items.uebersicht", icon: LayoutDashboard },
      { href: "/finanzen/ausgaben", labelKey: "nav.items.ausgaben", icon: Receipt },
      { href: "/finanzen/investitionen", labelKey: "nav.items.investitionen", icon: TrendingUp },
      { href: "/finanzen/sparziele", labelKey: "nav.items.sparziele", icon: PiggyBank },
      { href: "/finanzen/monatsplan", labelKey: "nav.items.monatsplan", icon: CalendarClock },
      { href: "/finanzen/gehalt", labelKey: "nav.items.gehalt", icon: Wallet },
      { href: "/finanzen/berichte", labelKey: "nav.items.berichte", icon: FileBarChart },
      { href: "/energie", labelKey: "nav.items.energie", icon: Zap },
    ],
  },
  {
    id: "familie",
    labelKey: "nav.sections.familie",
    icon: Users,
    color: "text-pink-500",
    items: [
      { href: "/familie", labelKey: "nav.items.mitglieder", icon: Users },
      { href: "/benachrichtigungen", labelKey: "nav.items.benachrichtigungen", icon: Bell, badge: true },
      { href: "/familie/termine", labelKey: "nav.items.termine", icon: Calendar },
      { href: "/chat", labelKey: "nav.items.chat", icon: MessageCircle },
      { href: "/fitness", labelKey: "nav.items.fitness", icon: Activity },
      { href: "/einstellungen", labelKey: "nav.items.einstellungen", icon: Settings },
    ],
  },
  {
    id: "fahrzeuge-tiere",
    labelKey: "nav.sections.fahrzeuge",
    icon: Car,
    color: "text-amber-500",
    items: [
      { href: "/fahrzeuge", labelKey: "nav.items.fahrzeugpflege", icon: Car },
      { href: "/haustiere", labelKey: "nav.items.haustiere", icon: PawPrint },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const alertCount = useAlertCount();
  const { t } = useTranslation();

  // Determine which section contains the current route
  const activeSection = sections.find((s) =>
    s.items.some((item) => pathname === item.href || pathname.startsWith(item.href + "/"))
  )?.id ?? null;

  const [openSection, setOpenSection] = useState<string | null>(activeSection);

  const toggleSection = (id: string) => {
    setOpenSection((prev) => (prev === id ? null : id));
  };

  const isActive = (href: string) =>
    href === "/kueche" || href === "/vorrat"
      ? pathname === href
      : pathname.startsWith(href);

  return (
    <aside className="hidden md:flex flex-col w-64 h-screen sticky top-0 bg-white dark:bg-gray-950 border-e border-gray-200 dark:border-gray-800 flex-shrink-0 overflow-y-auto">
      {/* Brand */}
      <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-sm">
            <Home className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold text-gray-900 dark:text-white">HomeHub</span>
        </Link>
      </div>

      {/* Dashboard link */}
      <div className="px-3 pt-3">
        <Link
          href="/"
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
            pathname === "/"
              ? "bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300"
              : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
          )}
        >
          <LayoutDashboard className={cn("h-5 w-5", pathname === "/" ? "text-indigo-600" : "text-gray-400")} />
          {t("nav.dashboard")}
        </Link>
      </div>

      {/* Sections */}
      <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
        {sections.map((section) => {
          const SectionIcon = section.icon;

          return (
            <div key={section.id}>
              <button
                onClick={() => toggleSection(section.id)}
                className="flex items-center justify-between w-full px-3 py-2 rounded-lg text-xs font-semibold text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-150"
              >
                <div className="flex items-center gap-2">
                  <SectionIcon className={cn("h-4 w-4", section.color)} />
                  {t(section.labelKey)}
                </div>
                {openSection === section.id ? (
                  <ChevronDown className="h-3.5 w-3.5" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5" />
                )}
              </button>

              {openSection === section.id && (
                <ul className="mt-0.5 space-y-0.5 ps-2">
                  {section.items.map(({ href, labelKey, icon: Icon, badge }) => {
                    const active = isActive(href);
                    const showBadge = badge && alertCount > 0;

                    return (
                      <li key={href}>
                        <Link
                          href={href}
                          className={cn(
                            "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150",
                            active
                              ? "bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300"
                              : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
                          )}
                        >
                          <div className="relative flex-shrink-0">
                            <Icon className={cn("h-4 w-4", active ? "text-blue-600 dark:text-blue-400" : "text-gray-400")} />
                            {showBadge && (
                              <span className="absolute -top-1.5 -end-1.5 flex items-center justify-center min-w-[14px] h-3.5 px-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full leading-none">
                                {alertCount > 99 ? "99+" : alertCount}
                              </span>
                            )}
                          </div>
                          {t(labelKey)}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </nav>

      {/* Language + Theme + User */}
      <div className="px-3 py-3 border-t border-gray-100 dark:border-gray-800 space-y-2">
        <div className="flex items-center justify-between px-3">
          <span className="text-xs text-gray-400">{t("nav.language")}</span>
          <LanguageToggle />
        </div>
        <div className="flex items-center justify-between px-3">
          <span className="text-xs text-gray-400">{t("nav.design")}</span>
          <ThemeToggle />
        </div>
        <UserMenu />
      </div>
    </aside>
  );
}
