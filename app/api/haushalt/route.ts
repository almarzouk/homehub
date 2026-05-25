import { NextRequest, NextResponse } from "next/server";
import { getApiSession } from "@/lib/api-auth";
import { connectDB } from "@/lib/db";
import HaushaltAufgabe from "@/models/HaushaltAufgabe";
import { z } from "zod";

const schema = z.object({
  titel: z.string().min(1).max(200),
  beschreibung: z.string().optional(),
  kategorie: z.enum(["reinigung", "wartung", "einkauf", "sonstiges"]).default("sonstiges"),
  prioritaet: z.enum(["hoch", "mittel", "niedrig"]).default("mittel"),
  erledigt: z.boolean().default(false),
  wiederholung: z.enum(["taeglich", "woechentlich", "monatlich", "nein"]).default("nein"),
  faelligAm: z.string().optional(),
});

export async function GET(request: NextRequest) {
  const session = await getApiSession();
  if (!session) return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });

  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const erledigt = searchParams.get("erledigt");
    const kategorie = searchParams.get("kategorie");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: Record<string, any> = {};
    const householdId = (session.user as { householdId?: string }).householdId;
    if (householdId) query.householdId = householdId;
    if (erledigt === "true") query.erledigt = true;
    if (erledigt === "false") query.erledigt = false;
    if (kategorie) query.kategorie = kategorie;

    const aufgaben = await HaushaltAufgabe.find(query).sort({ faelligAm: 1, prioritaet: 1, createdAt: -1 }).lean();
    return NextResponse.json({ aufgaben });
  } catch (e) {
    console.error("GET /api/haushalt:", e);
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

    const aufgabe = await HaushaltAufgabe.create({
      ...data,
      faelligAm: data.faelligAm ? new Date(data.faelligAm) : undefined,
      userId: session.user?.id,
      ...((session.user as { householdId?: string }).householdId ? { householdId: (session.user as { householdId?: string }).householdId } : {}),
    });
    return NextResponse.json({ aufgabe }, { status: 201 });
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: e.issues }, { status: 400 });
    console.error("POST /api/haushalt:", e);
    return NextResponse.json({ error: "Erstellungsfehler" }, { status: 500 });
  }
}
