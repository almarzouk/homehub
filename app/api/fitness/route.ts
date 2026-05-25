import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { connectDB } from "@/lib/db";
import FitnessEintrag from "@/models/FitnessEintrag";
import { z } from "zod";

const schema = z.object({
  typ: z.enum(["gewicht", "training", "schritte", "schlaf", "sonstige"]),
  datum: z.string(),
  wert: z.number().min(0),
  einheit: z.string().min(1).max(20),
  dauer: z.number().min(0).optional(),
  notizen: z.string().max(500).optional(),
});

export async function GET(request: NextRequest) {
  const { error, session } = await requireSession();
  if (error) return error;

  await connectDB();
  const householdId = (session!.user as { householdId?: string }).householdId;
  const user = session!.user as { id?: string; householdId?: string };
  const { searchParams } = new URL(request.url);
  const typ = searchParams.get("typ");

  const filter: Record<string, unknown> = {};
  if (householdId) filter.householdId = householdId;
  if (user.id) filter.userId = user.id;
  if (typ) filter.typ = typ;

  const items = await FitnessEintrag.find(filter).sort({ datum: -1 }).limit(100).lean();
  return NextResponse.json(items);
}

export async function POST(request: NextRequest) {
  const { error, session } = await requireSession();
  if (error) return error;

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Ungültige Daten" }, { status: 400 });

  await connectDB();
  const householdId = (session!.user as { householdId?: string }).householdId;
  const user = session!.user as { id?: string; name?: string; householdId?: string };

  const item = await FitnessEintrag.create({
    ...parsed.data,
    householdId,
    userId: user.id,
    userName: user.name ?? "Unbekannt",
    datum: new Date(parsed.data.datum),
  });
  return NextResponse.json(item, { status: 201 });
}
