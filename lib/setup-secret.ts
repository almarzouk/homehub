import { NextRequest } from "next/server";

export function hasValidSetupSecret(request: NextRequest): boolean {
  const secret = process.env.SETUP_SECRET;
  if (!secret) return false;
  const header = request.headers.get("x-setup-secret");
  return !!header && header === secret;
}
