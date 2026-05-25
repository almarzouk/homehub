import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { getApiSession } from "@/lib/api-auth";
import User from "@/models/User";
import Household from "@/models/Household";

// GET — alle Familienmitglieder abrufen (scoped to household)
export async function GET() {
  const session = await getApiSession();
  if (!session?.user) return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });

  await connectDB();
  const householdId = (session.user as { householdId?: string }).householdId;
  const filter = householdId ? { householdId } : { _id: session.user.id };
  const users = await User.find(filter, { password: 0 }).sort({ createdAt: 1 }).lean();
  return NextResponse.json(users);
}

// POST — neues Familienmitglied erstellen
export async function POST(request: NextRequest) {
  const session = await getApiSession();
  if (!session?.user) return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });

  const { name, email, password, role } = await request.json();

  if (!name?.trim() || !email?.trim() || !password?.trim()) {
    return NextResponse.json({ error: "Name, E-Mail und Passwort sind erforderlich" }, { status: 400 });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return NextResponse.json({ error: "Ungültige E-Mail-Adresse" }, { status: 400 });
  }

  if (password.length < 6) {
    return NextResponse.json({ error: "Passwort muss mindestens 6 Zeichen haben" }, { status: 400 });
  }

  await connectDB();

  const exists = await User.findOne({ email: email.trim().toLowerCase() });
  if (exists) {
    return NextResponse.json({ error: "Diese E-Mail-Adresse ist bereits registriert" }, { status: 409 });
  }

  const hashed = await bcrypt.hash(password, 12);
  const householdId = (session.user as { householdId?: string }).householdId;

  const user = await User.create({
    name: name.trim(),
    email: email.trim().toLowerCase(),
    password: hashed,
    role: role === "admin" ? "admin" : "user",
    ...(householdId ? { householdId } : {}),
  });

  // Also add the new user to the Household.members array
  if (householdId) {
    await Household.updateOne(
      { _id: householdId },
      { $addToSet: { members: user._id } }
    );
  }

  return NextResponse.json(
    { _id: user._id, name: user.name, email: user.email, role: user.role, createdAt: user.createdAt },
    { status: 201 }
  );
}
