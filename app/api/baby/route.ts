import { NextRequest, NextResponse } from "next/server";
import { getApiSession } from "@/lib/api-auth";
import { connectDB } from "@/lib/db";
import BabyEintrag from "@/models/BabyEintrag";
import { z } from "zod";

const schema = z.object({
  typ: z.enum(["stillen","flasche","schlaf","aufwachen","windel","gewicht","groesse","notiz"]),
  zeitpunkt: z.string().optional(),
  menge: z.number().optional(),
  dauer: z.number().optional(),
  seite: z.enum(["links","rechts","beide"]).optional(),
  windel: z.enum(["nass","schmutzig","beides"]).optional(),
  notiz: z.string().optional(),
});

export async function GET(request: NextRequest) {
  const session = await getApiSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const typ = searchParams.get("typ");
    const limit = parseInt(searchParams.get("limit") ?? "100");

    const query: Record<string, unknown> = {};
    const householdId = (session.user as { householdId?: string }).householdId;
    if (householdId) query.householdId = householdId;
    else query.userId = session.user?.id;
    if (typ) query.typ = typ;

    const eintraege = await BabyEintrag.find(query).sort({ zeitpunkt: -1 }).limit(limit).lean();
    return NextResponse.json({ eintraege });
  } catch (e) {
    console.error("GET /api/baby:", e);
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

    const eintrag = await BabyEintrag.create({
      ...data,
      zeitpunkt: data.zeitpunkt ? new Date(data.zeitpunkt) : new Date(),
      userId: session.user?.id,
      ...(householdId ? { householdId } : {}),
    });
    return NextResponse.json({ eintrag }, { status: 201 });
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: e.issues }, { status: 400 });
    console.error("POST /api/baby:", e);
    return NextResponse.json({ error: "Erstellungsfehler" }, { status: 500 });
  }
}
