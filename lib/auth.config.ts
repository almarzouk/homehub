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

      if (!isLoggedIn) return false;

      // Redirect to /setup for users who haven't completed onboarding,
      // but only for page routes (not API calls)
      const onboardingCompleted = (auth?.user as { onboardingCompleted?: boolean })?.onboardingCompleted;
      const needsSetup = onboardingCompleted === false;
      if (needsSetup && !pathname.startsWith("/setup") && !pathname.startsWith("/api/")) {
        return Response.redirect(new URL("/setup", nextUrl.origin));
      }
      // Prevent revisiting /setup after it's already done
      if (!needsSetup && pathname.startsWith("/setup")) {
        return Response.redirect(new URL("/dashboard", nextUrl.origin));
      }

      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role;
        token.householdId = (user as { householdId?: string }).householdId;
        token.onboardingCompleted = (user as { onboardingCompleted?: boolean }).onboardingCompleted;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as { role?: string }).role = token.role as string;
        (session.user as { householdId?: string }).householdId = token.householdId as string | undefined;
        (session.user as { onboardingCompleted?: boolean }).onboardingCompleted = token.onboardingCompleted as boolean | undefined;
      }
      return session;
    },
  },
  providers: [],
};
