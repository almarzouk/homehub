"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ChefHat,
  Package,
  Wallet,
  LayoutGrid,
} from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/", icon: LayoutDashboard, label: "Home", exact: true },
  { href: "/kueche", icon: ChefHat, label: "Küche" },
  { href: "/vorrat", icon: Package, label: "Vorrat" },
  { href: "/finanzen/dashboard", icon: Wallet, label: "Finanzen" },
  { href: "/mehr", icon: LayoutGrid, label: "Mehr" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800 z-40">
      <ul className="flex items-center justify-around h-16">
        {tabs.map(({ href, icon: Icon, label, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 py-2 transition-colors",
                  active ? "text-blue-600 dark:text-blue-400" : "text-gray-400 dark:text-gray-600 hover:text-gray-600"
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
  );
}
