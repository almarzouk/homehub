"use client";

import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import MobileNav from "./MobileNav";
import SessionProvider from "./SessionProvider";
import PublicNav from "./PublicNav";
import { ToastContainer } from "@/components/ui/Toast";

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

  return (
    <>
      <ToastContainer />
      <SessionProvider>
        {isBarePublic && children}
        {isPublicNav && <PublicNav>{children}</PublicNav>}
        {isStandalone && children}
        {!isBarePublic && !isPublicNav && !isStandalone && (
          <div className="flex h-screen overflow-hidden" style={{ background: "var(--background)" }}>
            <Sidebar />
            <main className="flex-1 overflow-y-auto min-w-0 pt-14 md:pt-0">
              <div className="p-4 md:p-6 lg:p-8 pb-24 md:pb-8 max-w-7xl w-full mx-auto">
                <div className="page-transition">{children}</div>
              </div>
            </main>
          </div>
        )}
        {!isBarePublic && !isPublicNav && !isStandalone && <MobileNav />}
      </SessionProvider>
    </>
  );
}
