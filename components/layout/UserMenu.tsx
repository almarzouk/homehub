"use client";

import { useSession, signOut } from "next-auth/react";
import { LogOut, Settings, Users } from "lucide-react";
import { useState } from "react";
import Link from "next/link";

export default function UserMenu() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);

  if (!session?.user) return null;

  const initials = session.user.name
    ? session.user.name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "??";

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors w-full text-left"
      >
        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">
            {session.user.name}
          </p>
          <p className="text-xs text-gray-400 truncate">{session.user.email}</p>
        </div>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute bottom-full left-0 right-0 mb-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-20 py-1">
            <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-800">
              <p className="text-xs text-gray-500">Angemeldet als</p>
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">
                {session.user.email}
              </p>
            </div>
            <Link
              href="/familie"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <Users className="h-4 w-4" />
              Familie
            </Link>
            <Link
              href="/einstellungen"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <Settings className="h-4 w-4" />
              Einstellungen
            </Link>
            <div className="border-t border-gray-100 dark:border-gray-800 mt-1 pt-1">
              <button
                onClick={() => signOut({ callbackUrl: "/anmelden" })}
                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Abmelden
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
