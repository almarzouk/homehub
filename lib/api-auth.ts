import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

/**
 * Gibt die Session zurück — entweder aus NextAuth (Web) oder aus dem
 * x-mobile-uid Header, den die Middleware für verifizierte mobile JWTs setzt.
 */
export async function getApiSession() {
  const session = await auth();
  if (session) return session;

  // Mobile JWT via Header (gesetzt von proxy.ts)
  const h = await headers();
  const uid = h.get("x-mobile-uid");
  const email = h.get("x-mobile-email");
  if (uid) {
    return {
      user: {
        id: uid,
        email: email ?? "",
        role: h.get("x-mobile-role") ?? "user",
        householdId: h.get("x-mobile-householdid") ?? undefined,
      },
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    };
  }

  return null;
}

export async function requireSession() {
  const session = await getApiSession();
  if (!session) {
    return {
      session: null,
      error: NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 }),
    };
  }
  return { session, error: null };
}
