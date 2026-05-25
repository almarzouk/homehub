import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";
import { connectDB } from "@/lib/db";
import User from "@/models/User";

const secret = new TextEncoder().encode(process.env.AUTH_SECRET!);
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

// Mobiler Login — gibt JWT zurück (kein CSRF)
export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ fehler: "E-Mail und Passwort erforderlich" }, { status: 400, headers: CORS });
    }

    await connectDB();
    const user = await User.findOne({ email: email.toLowerCase().trim() }).lean();

    if (!user) {
      return NextResponse.json({ fehler: "Ungültige Anmeldedaten" }, { status: 401, headers: CORS });
    }

    const u = user as { _id: unknown; name?: string; email: string; password: string; role?: string; householdId?: unknown };
    const valid = await bcrypt.compare(password, u.password);
    if (!valid) {
      return NextResponse.json({ fehler: "Ungültige Anmeldedaten" }, { status: 401, headers: CORS });
    }

    const householdId = u.householdId?.toString() ?? "";

    // JWT für 30 Tage ausstellen — enthält householdId für Manifest-API
    const token = await new SignJWT({
      id: u._id?.toString(),
      email: u.email,
      role: u.role ?? "user",
      householdId,
      mobile: true,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("30d")
      .setIssuedAt()
      .sign(secret);

    return NextResponse.json(
      {
        erfolg: true,
        token,
        benutzer: {
          id: u._id?.toString(),
          name: u.name ?? u.email.split("@")[0],
          email: u.email,
          role: u.role ?? "user",
          householdId,
        },
      },
      { headers: CORS }
    );
  } catch {
    return NextResponse.json({ fehler: "Serverfehler" }, { status: 500, headers: CORS });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}
