import { NextRequest, NextResponse } from "next/server";
import { getApiSession } from "@/lib/api-auth";
import { connectDB } from "@/lib/db";
import Location from "@/models/Location";
import { z } from "zod";

const locationSchema = z.object({
  name: z.string().min(1).max(80),
  icon: z.string().optional().default(""),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#6b7280"),
});

export async function GET() {
  const session = await getApiSession();
  if (!session) return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });

  try {
    await connectDB();
    const householdId = (session.user as { householdId?: string }).householdId;
    const filter = householdId ? { householdId } : {};
    const locations = await Location.find(filter).sort({ name: 1 }).lean();
    return NextResponse.json(locations);
  } catch (e) {
    console.error("GET /api/vorrat/lagerorte:", e);
    return NextResponse.json({ error: "Ladefehler" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getApiSession();
  if (!session) return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });

  try {
    await connectDB();
    const body = await request.json();
    const parsed = locationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validierungsfehler", details: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const existing = await Location.findOne({ name: parsed.data.name, ...((session.user as { householdId?: string }).householdId ? { householdId: (session.user as { householdId?: string }).householdId } : {}) });
    if (existing) return NextResponse.json({ error: "Lagerort existiert bereits." }, { status: 409 });

    const location = await Location.create({
      ...parsed.data,
      ...((session.user as { householdId?: string }).householdId ? { householdId: (session.user as { householdId?: string }).householdId } : {}),
    });
    return NextResponse.json(location, { status: 201 });
  } catch (e) {
    console.error("POST /api/vorrat/lagerorte:", e);
    return NextResponse.json({ error: "Speicherfehler" }, { status: 500 });
  }
}
