import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const { auth } = NextAuth(authConfig);

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export default async function middleware(req: NextRequest) {
  // OPTIONS-Preflight immer direkt durchlassen
  if (req.method === "OPTIONS") {
    return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
  }

  // Mobile JWT in Authorization-Header prüfen
  const authHeader = req.headers.get("Authorization");
  if (authHeader?.startsWith("Bearer ") && req.nextUrl.pathname.startsWith("/api/")) {
    try {
      const token = authHeader.slice(7);
      const secret = new TextEncoder().encode(process.env.AUTH_SECRET!);
      const { payload } = await jwtVerify(token, secret);
      if (payload.mobile) {
        // Gültiger mobiler Token — Anfrage direkt weiterleiten mit User-Headern
        const requestHeaders = new Headers(req.headers);
        requestHeaders.set("x-mobile-uid", String(payload.id ?? ""));
        requestHeaders.set("x-mobile-email", String(payload.email ?? ""));
        requestHeaders.set("x-mobile-role", String(payload.role ?? "user"));
        requestHeaders.set("x-mobile-householdid", String(payload.householdId ?? ""));
        const res = NextResponse.next({ request: { headers: requestHeaders } });
        Object.entries(CORS_HEADERS).forEach(([k, v]) => res.headers.set(k, v));
        return res;
      }
    } catch {
      // Ungültiger Token → normaler Auth-Flow
    }
  }

  // Normaler NextAuth-Check
  const response = await auth(req as unknown as Parameters<typeof auth>[0]);

  // CORS zu allen API-Antworten hinzufügen
  if (req.nextUrl.pathname.startsWith("/api/")) {
    const res = response ?? NextResponse.next();
    Object.entries(CORS_HEADERS).forEach(([k, v]) => res.headers.set(k, v));
    return res;
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.svg$|.*\\.ico$).*)",
  ],
};
