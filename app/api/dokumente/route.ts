import { NextRequest, NextResponse } from "next/server";
import { getApiSession } from "@/lib/api-auth";
import { connectDB } from "@/lib/db";
import Dokument from "@/models/Dokument";
import { z } from "zod";

const schema = z.object({
  titel: z.string().min(1).max(200),
  kategorie: z.enum(["vertrag", "garantie", "versicherung", "ausweis", "gesundheit", "sonstiges"]).default("sonstiges"),
  beschreibung: z.string().optional(),
  bild: z.string().min(1),
  ablaufdatum: z.string().optional(),
});

export async function GET() {
  const session = await getApiSession();
  if (!session) return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });

  try {
    await connectDB();
    const householdId = (session.user as { householdId?: string }).householdId;
    const filter = householdId ? { householdId } : { userId: session.user?.id };
    const dokumente = await Dokument.find(filter).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ dokumente });
  } catch (e) {
    console.error("GET /api/dokumente:", e);
    return NextResponse.json({ error: "Ladefehler" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getApiSession();
  if (!session) return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });

  try {
    await connectDB();
    const body = await request.json();
    const data = schema.parse(body);

    const dokument = await Dokument.create({
      ...data,
      ablaufdatum: data.ablaufdatum ? new Date(data.ablaufdatum) : undefined,
      userId: session.user?.id,
      ...((session.user as { householdId?: string }).householdId ? { householdId: (session.user as { householdId?: string }).householdId } : {}),
    });
    return NextResponse.json({ dokument }, { status: 201 });
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: e.issues }, { status: 400 });
    console.error("POST /api/dokumente:", e);
    return NextResponse.json({ error: "Erstellungsfehler" }, { status: 500 });
  }
}
