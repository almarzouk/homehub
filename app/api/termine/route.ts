import { NextRequest, NextResponse } from "next/server";
import { getApiSession } from "@/lib/api-auth";
import { connectDB } from "@/lib/db";
import Termin from "@/models/Termin";

export async function GET() {
  const session = await getApiSession();
  if (!session?.user) return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });

  await connectDB();
  const householdId = (session.user as { householdId?: string }).householdId;
  const filter = householdId ? { householdId } : { userId: session.user.id };
  const termine = await Termin.find(filter).sort({ date: 1 }).lean();
  return NextResponse.json(termine);
}

export async function POST(request: NextRequest) {
  const session = await getApiSession();
  if (!session?.user) return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });

  const body = await request.json();
  const { title, description, date, time, location, participants, category, color, reminder } = body;

  if (!title?.trim() || !date) {
    return NextResponse.json({ error: "Titel und Datum sind erforderlich" }, { status: 400 });
  }

  await connectDB();
  const householdId = (session.user as { householdId?: string }).householdId;
  const termin = await Termin.create({
    userId: session.user?.id,
    title: title.trim(),
    description: description?.trim() || undefined,
    date: new Date(date),
    time: time || undefined,
    location: location?.trim() || undefined,
    participants: participants || [],
    category: category || "sonstiges",
    color: color || "#3B82F6",
    reminder: reminder || undefined,
    ...(householdId ? { householdId } : {}),
  });

  return NextResponse.json(termin, { status: 201 });
}
