import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Household from "@/models/Household";

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const { name, email, password, householdName, inviteCode } = await request.json();

    // Validate required fields
    if (!name?.trim() || !email?.trim() || !password) {
      return NextResponse.json({ error: "Name, E-Mail und Passwort sind erforderlich." }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: "Passwort muss mindestens 8 Zeichen lang sein." }, { status: 400 });
    }
    if (!householdName?.trim() && !inviteCode?.trim()) {
      return NextResponse.json({ error: "Bitte erstelle einen Haushalt oder gib einen Einladungscode ein." }, { status: 400 });
    }

    // Check if email already exists
    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return NextResponse.json({ error: "Diese E-Mail-Adresse ist bereits registriert." }, { status: 409 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    let household;

    if (inviteCode?.trim()) {
      // Join existing household via invite code
      household = await Household.findOne({ inviteCode: inviteCode.trim().toUpperCase() });
      if (!household) {
        return NextResponse.json({ error: "Ungültiger Einladungscode." }, { status: 404 });
      }
    } else {
      // Create new household (ownerId set after user creation)
      household = new Household({
        name: householdName.trim(),
        ownerId: new mongoose.Types.ObjectId(),
        members: [],
      });
      await household.save();
    }

    // Create user
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role: "user",
      isApproved: false,
      householdId: household._id,
    });

    // If creating new household, set ownerId and add to members
    if (!inviteCode?.trim()) {
      household.ownerId = user._id;
      household.members.push(user._id);
      await household.save();
    } else {
      // Add to existing household members
      household.members.push(user._id);
      await household.save();
    }

    return NextResponse.json({ ok: true, userId: String(user._id) }, { status: 201 });
  } catch (e) {
    console.error("POST /api/registrieren:", e);
    return NextResponse.json({ error: "Registrierungsfehler. Bitte versuche es erneut." }, { status: 500 });
  }
}
