import { NextRequest, NextResponse } from "next/server";
import { getApiSession } from "@/lib/api-auth";
import { connectDB } from "@/lib/db";
import Medikament from "@/models/Medikament";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1).max(200),
  wirkstoff: z.string().optional(),
  dosierung: z.string().min(1),
  einheit: z.enum(["mg", "ml", "tablette", "kapsel", "tropfen", "sonstiges"]).default("tablette"),
  vorrat: z.number().min(0).default(0),
  mindestvorrat: z.number().min(0).default(5),
  ablaufdatum: z.string().optional(),
  einnahmezeiten: z.array(z.string()).default([]),
  einnahmehinweis: z.string().optional(),
  bild: z.string().optional(),
  erinnerung: z.boolean().default(false),
});

export async function GET() {
  const session = await getApiSession();
  if (!session) return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });

  try {
    await connectDB();
    const householdId = (session.user as { householdId?: string }).householdId;
    const filter = householdId ? { householdId } : { userId: session.user?.id };
    const medikamente = await Medikament.find(filter).sort({ name: 1 }).lean();
    return NextResponse.json({ medikamente });
  } catch (e) {
    console.error("GET /api/medikamente:", e);
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

    const medikament = await Medikament.create({
      ...data,
      ablaufdatum: data.ablaufdatum ? new Date(data.ablaufdatum) : undefined,
      userId: session.user?.id,
      ...((session.user as { householdId?: string }).householdId ? { householdId: (session.user as { householdId?: string }).householdId } : {}),
    });
    return NextResponse.json({ medikament }, { status: 201 });
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: e.issues }, { status: 400 });
    console.error("POST /api/medikamente:", e);
    return NextResponse.json({ error: "Erstellungsfehler" }, { status: 500 });
  }
}
