import type { NextAuthConfig } from "next-auth";

export const authConfig: NextAuthConfig = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/anmelden",
    error: "/anmelden",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const pathname = nextUrl.pathname;

      const publicPaths = [
        "/landing",
        "/anmelden",
        "/registrieren",
        "/einrichten",
        "/api/auth",
        "/api/einrichten",
        "/api/registrieren",
        "/api/seed",
        "/api/vorrat/suche",
        "/api/mobile",
      ];
      // Root `/` is the public landing page
      if (pathname === "/") return true;
      if (publicPaths.some((p) => pathname.startsWith(p))) return true;

      return isLoggedIn;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role;
        token.householdId = (user as { householdId?: string }).householdId;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as { role?: string }).role = token.role as string;
        (session.user as { householdId?: string }).householdId = token.householdId as string | undefined;
      }
      return session;
    },
  },
  providers: [],
};
