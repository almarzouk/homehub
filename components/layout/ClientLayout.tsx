"use client";

import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import BottomNav from "./BottomNav";
import SessionProvider from "./SessionProvider";

const AUTH_PATHS = ["/anmelden", "/einrichten"];

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = AUTH_PATHS.some((p) => pathname.startsWith(p));

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <SessionProvider>
      <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
        <Sidebar />
        <main className="flex-1 overflow-y-auto min-w-0">
          <div className="p-4 md:p-8 pb-24 md:pb-8 max-w-7xl w-full mx-auto">
            {children}
          </div>
        </main>
      </div>
      <BottomNav />
    </SessionProvider>
  );
}
