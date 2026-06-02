"use client";

import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import MobileNav from "./MobileNav";
import SessionProvider from "./SessionProvider";
import PublicNav from "./PublicNav";

// These paths get full public header+footer (no auth required)
const PUBLIC_NAV_PATHS = ["/anmelden", "/registrieren", "/einrichten"];
// These paths have their own complete layout (no wrapper at all)
const BARE_PUBLIC_PATHS = ["/landing"];
// Root `/` is the landing page — it has its own header/footer built in
const ROOT_PUBLIC = "/";
// These paths get SessionProvider only (own layout, no user sidebar)
const STANDALONE_PATHS = ["/admin"];

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isBarePublic = BARE_PUBLIC_PATHS.some((p) => pathname.startsWith(p)) || pathname === ROOT_PUBLIC;
  const isPublicNav = PUBLIC_NAV_PATHS.some((p) => pathname.startsWith(p));
  const isStandalone = STANDALONE_PATHS.some((p) => pathname.startsWith(p));

  if (isBarePublic) {
    return <SessionProvider>{children}</SessionProvider>;
  }

  if (isPublicNav) {
    return <SessionProvider><PublicNav>{children}</PublicNav></SessionProvider>;
  }

  if (isStandalone) {
    return <SessionProvider>{children}</SessionProvider>;
  }

  return (
    <SessionProvider>
      <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
        <Sidebar />
        <main className="flex-1 overflow-y-auto min-w-0 pt-14 md:pt-0">
          <div className="p-4 md:p-8 pb-24 md:pb-8 max-w-7xl w-full mx-auto">
            {children}
          </div>
        </main>
      </div>
      <MobileNav />
    </SessionProvider>
  );
}
