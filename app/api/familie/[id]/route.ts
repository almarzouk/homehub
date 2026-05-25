import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { getApiSession } from "@/lib/api-auth";
import User from "@/models/User";
import mongoose from "mongoose";

type Params = { params: Promise<{ id: string }> };

// DELETE — Familienmitglied entfernen
export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await getApiSession();
  if (!session?.user) return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });

  const { id } = await params;

  // Eigenen Account kann man nicht löschen
  if (id === session.user.id) {
    return NextResponse.json({ error: "Du kannst deinen eigenen Account nicht löschen" }, { status: 400 });
  }

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Ungültige ID" }, { status: 400 });
  }

  await connectDB();
  const deleted = await User.findByIdAndDelete(id);
  if (!deleted) return NextResponse.json({ error: "Benutzer nicht gefunden" }, { status: 404 });

  return NextResponse.json({ nachricht: "Familienmitglied entfernt" });
}

// PATCH — Passwort oder Name ändern
export async function PATCH(request: NextRequest, { params }: Params) {
  const session = await getApiSession();
  if (!session?.user) return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });

  const { id } = await params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Ungültige ID" }, { status: 400 });
  }

  await connectDB();
  const body = await request.json();
  const update: Record<string, unknown> = {};

  if (body.name?.trim()) update.name = body.name.trim();
  if (body.role && ["admin", "user"].includes(body.role)) update.role = body.role;
  if (body.password) {
    if (body.password.length < 6) return NextResponse.json({ error: "Passwort zu kurz" }, { status: 400 });
    update.password = await bcrypt.hash(body.password, 12);
  }

  const user = await User.findByIdAndUpdate(id, update, { new: true, select: "-password" });
  if (!user) return NextResponse.json({ error: "Benutzer nicht gefunden" }, { status: 404 });

  return NextResponse.json(user);
}
