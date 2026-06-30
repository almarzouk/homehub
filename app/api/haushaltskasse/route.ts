import { NextRequest, NextResponse } from "next/server";
import { getApiSession } from "@/lib/api-auth";
import { connectDB } from "@/lib/db";
import Haushaltskasse from "@/models/Haushaltskasse";
import { z } from "zod";

const schema = z.object({
  betrag: z.number().positive(),
  kategorie: z.enum(["lebensmittel","transport","restaurant","kind","kleidung","gesundheit","haushalt","freizeit","sonstiges"]).default("sonstiges"),
  beschreibung: z.string().min(1).max(300),
  datum: z.string().optional(),
  bezahltVon: z.string().optional(),
  notiz: z.string().optional(),
});

export async function GET(request: NextRequest) {
  const session = await getApiSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const kategorie = searchParams.get("kategorie");
    const von = searchParams.get("von");
    const bis = searchParams.get("bis");

    const query: Record<string, unknown> = {};
    const householdId = (session.user as { householdId?: string }).householdId;
    if (householdId) query.householdId = householdId;
    else query.userId = session.user?.id;
    if (kategorie) query.kategorie = kategorie;
    if (von || bis) {
      query.datum = {};
      if (von) (query.datum as Record<string, Date>).$gte = new Date(von);
      if (bis) (query.datum as Record<string, Date>).$lte = new Date(bis);
    }

    const eintraege = await Haushaltskasse.find(query).sort({ datum: -1 }).lean();
    const summe = eintraege.reduce((s, e) => s + e.betrag, 0);
    return NextResponse.json({ eintraege, summe });
  } catch (e) {
    console.error("GET /api/haushaltskasse:", e);
    return NextResponse.json({ error: "Ladefehler" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getApiSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await connectDB();
    const body = await request.json();
    const data = schema.parse(body);
    const householdId = (session.user as { householdId?: string }).householdId;

    const eintrag = await Haushaltskasse.create({
      ...data,
      datum: data.datum ? new Date(data.datum) : new Date(),
      userId: session.user?.id,
      ...(householdId ? { householdId } : {}),
    });
    return NextResponse.json({ eintrag }, { status: 201 });
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: e.issues }, { status: 400 });
    console.error("POST /api/haushaltskasse:", e);
    return NextResponse.json({ error: "Erstellungsfehler" }, { status: 500 });
  }
}
