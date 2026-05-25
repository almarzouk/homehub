import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { connectDB } from "@/lib/db";
import Haustier from "@/models/Haustier";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1).max(60),
  tierart: z.string().min(1).max(40),
  rasse: z.string().max(60).optional(),
  geschlecht: z.enum(["maennlich", "weiblich", "unbekannt"]).optional(),
  geburtsdatum: z.string().optional(),
  farbe: z.string().max(40).optional(),
  gewicht: z.number().min(0).optional(),
  chipmummer: z.string().max(30).optional(),
  versicherung: z.string().max(100).optional(),
  tierarzt: z.string().max(100).optional(),
  naechsterTierarztTermin: z.string().optional(),
  notizen: z.string().max(1000).optional(),
});

export async function GET(_request: NextRequest) {
  const { error, session } = await requireSession();
  if (error) return error;

  await connectDB();
  const householdId = (session!.user as { householdId?: string }).householdId;
  const items = await Haustier.find(householdId ? { householdId } : {}).sort({ name: 1 }).lean();
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

  const item = await Haustier.create({
    ...parsed.data,
    householdId,
    geburtsdatum: parsed.data.geburtsdatum ? new Date(parsed.data.geburtsdatum) : undefined,
    naechsterTierarztTermin: parsed.data.naechsterTierarztTermin ? new Date(parsed.data.naechsterTierarztTermin) : undefined,
  });
  return NextResponse.json(item, { status: 201 });
}
