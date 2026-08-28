import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { hasValidSetupSecret } from "@/lib/setup-secret";

/**
 * POST /api/einrichten/passwort
 * Reset a user password when x-setup-secret matches SETUP_SECRET env var.
 * Body: { email: string, password?: string }
 */
export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === "production" && !hasValidSetupSecret(request)) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  try {
    await connectDB();
    const { email, password = "Pass321@" } = await request.json();

    if (!email?.trim()) {
      return NextResponse.json({ error: "E-Mail erforderlich" }, { status: 400 });
    }
    if (typeof password !== "string" || password.length < 8) {
      return NextResponse.json({ error: "Passwort mindestens 8 Zeichen" }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return NextResponse.json({ error: "Benutzer nicht gefunden" }, { status: 404 });
    }

    user.password = await bcrypt.hash(password, 12);
    user.isBlocked = false;
    user.isApproved = true;
    if (user.role !== "admin") user.role = "admin";
    await user.save();

    return NextResponse.json({
      ok: true,
      email: normalizedEmail,
      message: "Passwort zurückgesetzt",
    });
  } catch (error) {
    console.error("[Einrichten] passwort reset error:", error);
    return NextResponse.json({ error: "Serverfehler" }, { status: 500 });
  }
}
