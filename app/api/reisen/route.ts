import { NextRequest, NextResponse } from "next/server";
import { getApiSession } from "@/lib/api-auth";
import { connectDB } from "@/lib/db";
import Reise from "@/models/Reise";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1).max(200),
  ziel: z.string().min(1).max(200),
  startDatum: z.string().optional(),
  endDatum: z.string().optional(),
  budget: z.number().optional(),
  waehrung: z.string().default("EUR"),
  teilnehmer: z.string().optional(),
  notizen: z.string().optional(),
  status: z.enum(["geplant","aktiv","abgeschlossen"]).default("geplant"),
});

export async function GET(request: NextRequest) {
  const session = await getApiSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const query: Record<string, unknown> = {};
    const householdId = (session.user as { householdId?: string }).householdId;
    if (householdId) query.householdId = householdId;
    else query.userId = session.user?.id;
    if (status) query.status = status;

    const reisen = await Reise.find(query).sort({ startDatum: 1, createdAt: -1 }).lean();
    return NextResponse.json({ reisen });
  } catch (e) {
    console.error("GET /api/reisen:", e);
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

    const reise = await Reise.create({
      ...data,
      startDatum: data.startDatum ? new Date(data.startDatum) : undefined,
      endDatum: data.endDatum ? new Date(data.endDatum) : undefined,
      userId: session.user?.id,
      ...(householdId ? { householdId } : {}),
    });
    return NextResponse.json({ reise }, { status: 201 });
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: e.issues }, { status: 400 });
    console.error("POST /api/reisen:", e);
    return NextResponse.json({ error: "Erstellungsfehler" }, { status: 500 });
  }
}
