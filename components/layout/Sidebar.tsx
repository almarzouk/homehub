"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
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
  MessageCircle,
  Activity,
  Truck,
  Sparkles,
  ShieldCheck,
  Plane,
  Baby,
  Banknote,
  Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import UserMenu from "./UserMenu";
import ThemeToggle from "@/components/ui/ThemeToggle";
import LanguageToggle from "@/components/ui/LanguageToggle";
import { useAlertCount } from "@/hooks/useAlertCount";
import { useNotificationCount } from "@/hooks/useNotificationCount";
import { useTranslation } from "@/hooks/useTranslation";
import { useSession } from "next-auth/react";

type NavSection = {
  id: string;
  labelKey: string;
  icon: React.ElementType;
  color: string;
  items: {
    href: string;
    labelKey: string;
    icon: React.ElementType;
    badge?: "alerts" | "notifications";
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
      { href: "/warnungen", labelKey: "nav.items.warnungen", icon: Bell, badge: "alerts" },
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
      { href: "/reisecheckliste", labelKey: "nav.items.reisecheckliste", icon: Plane },
      { href: "/baby", labelKey: "nav.items.baby", icon: Baby },
      { href: "/reisen", labelKey: "nav.items.reisen", icon: Plane },
      { href: "/haushaltskasse", labelKey: "nav.items.haushaltskasse", icon: Banknote },
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
      { href: "/finanzen/fixkosten", labelKey: "nav.items.fixkosten", icon: Lock },
      { href: "/finanzen/sparziele", labelKey: "nav.items.sparziele", icon: PiggyBank },
      { href: "/finanzen/monatsplan", labelKey: "nav.items.monatsplan", icon: CalendarClock },
      { href: "/finanzen/gehalt", labelKey: "nav.items.gehalt", icon: Wallet },
      { href: "/finanzen/berichte", labelKey: "nav.items.berichte", icon: FileBarChart },
    ],
  },
  {
    id: "familie",
    labelKey: "nav.sections.familie",
    icon: Users,
    color: "text-pink-500",
    items: [
      { href: "/familie", labelKey: "nav.items.mitglieder", icon: Users },
      { href: "/benachrichtigungen", labelKey: "nav.items.benachrichtigungen", icon: Bell, badge: "notifications" },
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
  const notificationCount = useNotificationCount();
  const { t } = useTranslation();
  const { data: session } = useSession();
  const isAdmin = (session?.user as { role?: string })?.role === "admin";

  // Determine which section contains the current route
  const activeSection = sections.find((s) =>
    s.items.some((item) => pathname === item.href || pathname.startsWith(item.href + "/"))
  )?.id ?? null;

  const [openSection, setOpenSection] = useState<string | null>(activeSection);

  // Auto-open section on navigation
  useEffect(() => {
    const current = sections.find((s) =>
      s.items.some((item) => pathname === item.href || pathname.startsWith(item.href + "/"))
    )?.id ?? null;
    if (current) setOpenSection(current);
  }, [pathname]);

  const toggleSection = (id: string) => {
    setOpenSection((prev) => (prev === id ? null : id));
  };

  const isActive = (href: string) =>
    href === "/kueche" || href === "/vorrat"
      ? pathname === href
      : pathname.startsWith(href);

  return (
    <aside
      className="hidden md:flex flex-col w-64 h-screen sticky top-0 flex-shrink-0 overflow-y-auto border-e"
      style={{
        background: "var(--sidebar-bg)",
        borderColor: "var(--sidebar-border)",
      }}
    >
      {/* Brand */}
      <div className="px-5 py-4 border-b" style={{ borderColor: "var(--sidebar-border)" }}>
        <Link href="/dashboard" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-sm transition-transform group-hover:scale-105">
            <Home className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-bold" style={{ color: "var(--foreground)" }}>HomeHub</span>
        </Link>
      </div>

      {/* Dashboard link */}
      <div className="px-3 pt-4">
        <Link
          href="/dashboard"
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 btn-press",
            pathname === "/dashboard"
              ? "bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 shadow-sm"
              : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-white"
          )}
        >
          <LayoutDashboard className={cn("h-[18px] w-[18px]", pathname === "/dashboard" ? "text-blue-600 dark:text-blue-400" : "text-gray-400 dark:text-gray-500")} />
          {t("nav.dashboard")}
        </Link>
      </div>

      {/* Sections */}
      <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
        {sections.map((section) => {
          const SectionIcon = section.icon;
          const isOpen = openSection === section.id;

          return (
            <div key={section.id}>
              <button
                onClick={() => toggleSection(section.id)}
                className="flex items-center justify-between w-full px-3 py-[7px] rounded-lg text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all duration-150"
              >
                <div className="flex items-center gap-2">
                  <SectionIcon className={cn("h-3.5 w-3.5", section.color)} />
                  {t(section.labelKey)}
                </div>
                <ChevronDown
                  className={cn(
                    "h-3 w-3 transition-transform duration-200",
                    isOpen ? "rotate-180" : "-rotate-90"
                  )}
                />
              </button>

              {/* Animated collapsible section */}
              <div className="sidebar-section-items" data-open={isOpen}>
                <ul className="mt-0.5 space-y-0.5 ps-2">
                  {section.items.map(({ href, labelKey, icon: Icon, badge }) => {
                    const active = isActive(href);
                    const badgeNum = badge === "alerts" ? alertCount : badge === "notifications" ? notificationCount : 0;
                    const showBadge = badgeNum > 0;

                    return (
                      <li key={href}>
                        <Link
                          href={href}
                          className={cn(
                            "flex items-center gap-3 px-3 py-[7px] rounded-lg text-[13px] font-medium transition-all duration-150 btn-press",
                            active
                              ? "bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 shadow-sm"
                              : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-white"
                          )}
                        >
                          <div className="relative flex-shrink-0">
                            <Icon className={cn("h-4 w-4", active ? "text-blue-600 dark:text-blue-400" : "text-gray-400 dark:text-gray-500")} />
                            {showBadge && (
                              <span className="absolute -top-1.5 -end-1.5 flex items-center justify-center min-w-[14px] h-3.5 px-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full leading-none animate-pulse-dot">
                                {badgeNum > 99 ? "99+" : badgeNum}
                              </span>
                            )}
                          </div>
                          {t(labelKey)}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          );
        })}
      </nav>

      {/* Language + Theme + User */}
      <div className="px-3 py-3 border-t space-y-2" style={{ borderColor: "var(--sidebar-border)" }}>
        {isAdmin && (
          <Link
            href="/admin"
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 btn-press",
              pathname.startsWith("/admin")
                ? "bg-yellow-50 dark:bg-yellow-950/50 text-yellow-700 dark:text-yellow-300"
                : "text-gray-600 dark:text-gray-400 hover:bg-yellow-50 dark:hover:bg-yellow-950/30 hover:text-yellow-700"
            )}
          >
            <ShieldCheck className="h-[18px] w-[18px]" />
            Admin Panel
          </Link>
        )}
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
