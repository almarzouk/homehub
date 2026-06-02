"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu, X, Home, LayoutDashboard, ChefHat, Package, Wallet, LayoutGrid,
  UtensilsCrossed, BarChart3, Settings, ScanLine, Bell, ShoppingCart,
  ArrowLeftRight, ClipboardList, Pill, Gift, FileText, Calendar, Sparkles,
  Truck, Receipt, TrendingUp, PiggyBank, CalendarClock, FileBarChart, Zap,
  Users, MessageCircle, Activity, Car, PawPrint, ChevronDown, ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAlertCount } from "@/hooks/useAlertCount";
import ThemeToggle from "@/components/ui/ThemeToggle";
import LanguageToggle from "@/components/ui/LanguageToggle";
import UserMenu from "./UserMenu";
import { useTranslation } from "@/hooks/useTranslation";
import { useLanguage } from "@/contexts/LanguageContext";

type NavItem = { href: string; labelKey: string; icon: React.ElementType; badge?: boolean };
type NavSection = { id: string; labelKey: string; icon: React.ElementType; color: string; items: NavItem[] };

const sections: NavSection[] = [
  {
    id: "kueche", labelKey: "nav.sections.kueche", icon: ChefHat, color: "text-orange-500",
    items: [
      { href: "/kueche", labelKey: "nav.items.gerichte", icon: UtensilsCrossed },
      { href: "/kueche/statistiken", labelKey: "nav.items.statistiken", icon: BarChart3 },
      { href: "/kueche/einstellungen", labelKey: "nav.items.kochgeraete", icon: Settings },
    ],
  },
  {
    id: "vorrat", labelKey: "nav.sections.vorrat", icon: Package, color: "text-blue-500",
    items: [
      { href: "/vorrat", labelKey: "nav.items.inventar", icon: Package },
      { href: "/scan", labelKey: "nav.items.scannen", icon: ScanLine },
      { href: "/warnungen", labelKey: "nav.items.warnungen", icon: Bell, badge: true },
      { href: "/bewegungen", labelKey: "nav.items.bewegungen", icon: ArrowLeftRight },
      { href: "/einkaufsliste", labelKey: "nav.items.einkaufsliste", icon: ShoppingCart },
    ],
  },
  {
    id: "haushalt", labelKey: "nav.sections.haushalt", icon: ClipboardList, color: "text-cyan-500",
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
    id: "finanzen", labelKey: "nav.sections.finanzen", icon: Wallet, color: "text-emerald-500",
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
    id: "familie", labelKey: "nav.sections.familie", icon: Users, color: "text-pink-500",
    items: [
      { href: "/familie", labelKey: "nav.items.mitglieder", icon: Users },
      { href: "/benachrichtigungen", labelKey: "nav.items.benachrichtigungen", icon: Bell },
      { href: "/familie/termine", labelKey: "nav.items.termine", icon: Calendar },
      { href: "/chat", labelKey: "nav.items.chat", icon: MessageCircle },
      { href: "/fitness", labelKey: "nav.items.fitness", icon: Activity },
      { href: "/einstellungen", labelKey: "nav.items.einstellungen", icon: Settings },
    ],
  },
  {
    id: "fahrzeuge-tiere", labelKey: "nav.sections.fahrzeuge", icon: Car, color: "text-amber-500",
    items: [
      { href: "/fahrzeuge", labelKey: "nav.items.fahrzeugpflege", icon: Car },
      { href: "/haustiere", labelKey: "nav.items.haustiere", icon: PawPrint },
    ],
  },
];

export default function MobileNav() {
  const pathname = usePathname();
  const alertCount = useAlertCount();
  const { t } = useTranslation();
  const { isRTL } = useLanguage();
  const [open, setOpen] = useState(false);

  const activeSection = sections.find((s) =>
    s.items.some((item) => pathname === item.href || pathname.startsWith(item.href + "/"))
  )?.id ?? null;
  const [openSection, setOpenSection] = useState<string | null>(activeSection);

  // Close drawer on navigation
  useEffect(() => { setOpen(false); }, [pathname]);

  const isActive = (href: string) =>
    href === "/kueche" || href === "/vorrat" ? pathname === href : pathname.startsWith(href);

  return (
    <>
      {/* Top bar — mobile only */}
      <header className="md:hidden fixed top-0 inset-x-0 z-40 h-14 bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-4">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
            <Home className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold text-gray-900 dark:text-white">HomeHub</span>
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href="/benachrichtigungen"
            className="relative p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <Bell className="h-5 w-5" />
            {alertCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            )}
          </Link>
          <LanguageToggle />
          <button
            onClick={() => setOpen(true)}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label={t("nav.navigation")}
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Overlay */}
      {open && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Drawer — slides from right in LTR, from left in RTL */}
      <div
        className={cn(
          "md:hidden fixed top-0 z-50 h-full w-80 max-w-[85vw] bg-white dark:bg-gray-950 shadow-2xl flex flex-col transition-transform duration-300",
          isRTL ? "left-0" : "right-0",
          open
            ? "translate-x-0"
            : isRTL
            ? "-translate-x-full"
            : "translate-x-full"
        )}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <span className="font-bold text-gray-900 dark:text-white text-lg">{t("nav.navigation")}</span>
          <button
            onClick={() => setOpen(false)}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Dashboard link */}
        <div className="px-3 pt-3">
          <Link
            href="/dashboard"
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
              pathname === "/dashboard"
                ? "bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300"
                : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
            )}
          >
            <LayoutDashboard className={cn("h-5 w-5", pathname === "/dashboard" ? "text-indigo-600" : "text-gray-400")} />
            {t("nav.dashboard")}
          </Link>
        </div>

        {/* Sections */}
        <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
          {sections.map((section) => {
            const SectionIcon = section.icon;
            const isThisOpen = openSection === section.id;
            return (
              <div key={section.id}>
                <button
                  onClick={() => setOpenSection(isThisOpen ? null : section.id)}
                  className="flex items-center justify-between w-full px-3 py-2 rounded-lg text-xs font-semibold text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <SectionIcon className={cn("h-4 w-4", section.color)} />
                    {t(section.labelKey)}
                  </div>
                  {isThisOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                </button>
                {isThisOpen && (
                  <ul className="mt-0.5 space-y-0.5 ps-2">
                    {section.items.map(({ href, labelKey, icon: Icon, badge }) => {
                      const active = isActive(href);
                      const showBadge = badge && alertCount > 0;
                      return (
                        <li key={href}>
                          <Link
                            href={href}
                            className={cn(
                              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                              active
                                ? "bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300"
                                : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                            )}
                          >
                            <div className="relative flex-shrink-0">
                              <Icon className={cn("h-4 w-4", active ? "text-blue-600 dark:text-blue-400" : "text-gray-400")} />
                              {showBadge && (
                                <span className="absolute -top-1.5 -end-1.5 flex items-center justify-center min-w-[14px] h-3.5 px-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full">
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
      </div>

      {/* Bottom tab bar — quick access */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800 z-40">
        <ul className="flex items-center justify-around h-16">
          {[
            { href: "/", icon: LayoutDashboard, labelKey: "nav.items.home", exact: true },
            { href: "/kueche", icon: ChefHat, labelKey: "nav.sections.kueche" },
            { href: "/vorrat", icon: Package, labelKey: "nav.sections.vorrat" },
            { href: "/finanzen/dashboard", icon: Wallet, labelKey: "nav.sections.finanzen" },
            { href: "/mehr", icon: LayoutGrid, labelKey: "nav.items.mehr" },
          ].map(({ href, icon: Icon, labelKey, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href);
            return (
              <li key={href} className="flex-1">
                <Link
                  href={href}
                  className={cn(
                    "flex flex-col items-center justify-center gap-0.5 py-2 transition-colors",
                    active ? "text-blue-600 dark:text-blue-400" : "text-gray-400 dark:text-gray-600"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-[10px] font-medium">{t(labelKey)}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
