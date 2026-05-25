import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Household from "@/models/Household";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    await connectDB();
    const count = await User.countDocuments();
    return NextResponse.json({ hasUsers: count > 0 });
  } catch {
    return NextResponse.json({ error: "Datenbankfehler" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await connectDB();

    const count = await User.countDocuments();
    if (count > 0) {
      return NextResponse.json(
        { error: "Ein Benutzer existiert bereits." },
        { status: 400 }
      );
    }

    const { name, email, password, householdName } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, E-Mail und Passwort sind erforderlich." },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Passwort muss mindestens 6 Zeichen haben." },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user first
    const user = await User.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password: hashedPassword,
      role: "admin",
    });

    // Create household for first user
    const hName = householdName?.trim() || `${name.trim()}s Haushalt`;
    const household = await Household.create({
      name: hName,
      ownerId: user._id,
      members: [user._id],
    });

    // Link user to household
    await User.findByIdAndUpdate(user._id, { householdId: household._id });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Einrichten] POST error:", error);
    return NextResponse.json({ error: "Serverfehler" }, { status: 500 });
  }
}
