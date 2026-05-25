import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { connectDB } from "@/lib/db";
import Reinigung from "@/models/Reinigung";
import { z } from "zod";

const schema = z.object({
  bereich: z.string().min(1).max(80),
  aufgabe: z.string().min(1).max(200),
  haeufigkeit: z.enum(["taeglich", "woechentlich", "zweiwochentlich", "monatlich", "vierteljaehrlich"]).default("woechentlich"),
  zugewiesen: z.string().max(60).optional(),
  naechsteFaelligkeit: z.string().optional(),
  notizen: z.string().max(500).optional(),
});

export async function GET(request: NextRequest) {
  const { error, session } = await requireSession();
  if (error) return error;

  await connectDB();
  const householdId = (session!.user as { householdId?: string }).householdId;
  const { searchParams } = new URL(request.url);
  const bereich = searchParams.get("bereich");

  const filter: Record<string, unknown> = {};
  if (householdId) filter.householdId = householdId;
  if (bereich) filter.bereich = bereich;

  const items = await Reinigung.find(filter).sort({ naechsteFaelligkeit: 1, createdAt: -1 }).lean();
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

  const item = await Reinigung.create({
    ...parsed.data,
    householdId,
    naechsteFaelligkeit: parsed.data.naechsteFaelligkeit ? new Date(parsed.data.naechsteFaelligkeit) : undefined,
  });
  return NextResponse.json(item, { status: 201 });
}
