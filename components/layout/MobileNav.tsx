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
import UserMenu from "./UserMenu";

type NavItem = { href: string; label: string; icon: React.ElementType; badge?: boolean };
type NavSection = { id: string; label: string; icon: React.ElementType; color: string; items: NavItem[] };

const sections: NavSection[] = [
  {
    id: "kueche", label: "Küche", icon: ChefHat, color: "text-orange-500",
    items: [
      { href: "/kueche", label: "Gerichte", icon: UtensilsCrossed },
      { href: "/kueche/statistiken", label: "Statistiken", icon: BarChart3 },
      { href: "/kueche/einstellungen", label: "Kochgeräte", icon: Settings },
    ],
  },
  {
    id: "vorrat", label: "Vorrat", icon: Package, color: "text-blue-500",
    items: [
      { href: "/vorrat", label: "Inventar", icon: Package },
      { href: "/scan", label: "Scannen", icon: ScanLine },
      { href: "/warnungen", label: "Warnungen", icon: Bell, badge: true },
      { href: "/bewegungen", label: "Bewegungen", icon: ArrowLeftRight },
      { href: "/einkaufsliste", label: "Einkaufsliste", icon: ShoppingCart },
    ],
  },
  {
    id: "haushalt", label: "Haushalt", icon: ClipboardList, color: "text-cyan-500",
    items: [
      { href: "/haushalt", label: "Aufgaben", icon: ClipboardList },
      { href: "/medikamente", label: "Medikamente", icon: Pill },
      { href: "/wunschliste", label: "Wunschliste", icon: Gift },
      { href: "/dokumente", label: "Dokumente", icon: FileText },
      { href: "/kalender", label: "Kalender", icon: Calendar },
      { href: "/reinigung", label: "Reinigungsplan", icon: Sparkles },
      { href: "/lieferungen", label: "Lieferungen", icon: Truck },
    ],
  },
  {
    id: "finanzen", label: "Finanzen", icon: Wallet, color: "text-emerald-500",
    items: [
      { href: "/finanzen/dashboard", label: "Übersicht", icon: LayoutDashboard },
      { href: "/finanzen/ausgaben", label: "Ausgaben", icon: Receipt },
      { href: "/finanzen/investitionen", label: "Investitionen", icon: TrendingUp },
      { href: "/finanzen/sparziele", label: "Sparziele", icon: PiggyBank },
      { href: "/finanzen/monatsplan", label: "Monatsplan", icon: CalendarClock },
      { href: "/finanzen/gehalt", label: "Gehalt", icon: Wallet },
      { href: "/finanzen/berichte", label: "Berichte", icon: FileBarChart },
      { href: "/energie", label: "Energieverbrauch", icon: Zap },
    ],
  },
  {
    id: "familie", label: "Familie", icon: Users, color: "text-pink-500",
    items: [
      { href: "/familie", label: "Mitglieder", icon: Users },
      { href: "/benachrichtigungen", label: "Benachrichtigungen", icon: Bell },
      { href: "/familie/termine", label: "Termine", icon: Calendar },
      { href: "/chat", label: "Haushalts-Chat", icon: MessageCircle },
      { href: "/fitness", label: "Fitness", icon: Activity },
      { href: "/einstellungen", label: "Einstellungen", icon: Settings },
    ],
  },
  {
    id: "fahrzeuge-tiere", label: "Fahrzeuge & Haustiere", icon: Car, color: "text-amber-500",
    items: [
      { href: "/fahrzeuge", label: "Fahrzeugpflege", icon: Car },
      { href: "/haustiere", label: "Haustiere", icon: PawPrint },
    ],
  },
];

export default function MobileNav() {
  const pathname = usePathname();
  const alertCount = useAlertCount();
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
        <Link href="/" className="flex items-center gap-2">
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
          <button
            onClick={() => setOpen(true)}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label="Menü öffnen"
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

      {/* Drawer */}
      <div
        className={cn(
          "md:hidden fixed top-0 right-0 z-50 h-full w-80 max-w-[85vw] bg-white dark:bg-gray-950 shadow-2xl flex flex-col transition-transform duration-300",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <span className="font-bold text-gray-900 dark:text-white text-lg">Navigation</span>
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
            href="/"
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
              pathname === "/"
                ? "bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300"
                : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
            )}
          >
            <LayoutDashboard className={cn("h-5 w-5", pathname === "/" ? "text-indigo-600" : "text-gray-400")} />
            Dashboard
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
                  className="flex items-center justify-between w-full px-3 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <SectionIcon className={cn("h-4 w-4", section.color)} />
                    {section.label}
                  </div>
                  {isThisOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                </button>
                {isThisOpen && (
                  <ul className="mt-0.5 space-y-0.5 pl-2">
                    {section.items.map(({ href, label, icon: Icon, badge }) => {
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
                                <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center min-w-[14px] h-3.5 px-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full">
                                  {alertCount > 99 ? "99+" : alertCount}
                                </span>
                              )}
                            </div>
                            {label}
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

        {/* Theme + User */}
        <div className="px-3 py-3 border-t border-gray-100 dark:border-gray-800 space-y-2">
          <div className="flex items-center justify-between px-3">
            <span className="text-xs text-gray-400">Design</span>
            <ThemeToggle />
          </div>
          <UserMenu />
        </div>
      </div>

      {/* Bottom tab bar — quick access */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800 z-40">
        <ul className="flex items-center justify-around h-16">
          {[
            { href: "/", icon: LayoutDashboard, label: "Home", exact: true },
            { href: "/kueche", icon: ChefHat, label: "Küche" },
            { href: "/vorrat", icon: Package, label: "Vorrat" },
            { href: "/finanzen/dashboard", icon: Wallet, label: "Finanzen" },
            { href: "/mehr", icon: LayoutGrid, label: "Mehr" },
          ].map(({ href, icon: Icon, label, exact }) => {
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
                  <span className="text-[10px] font-medium">{label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
