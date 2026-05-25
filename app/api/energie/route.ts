import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { connectDB } from "@/lib/db";
import Energie from "@/models/Energie";
import { z } from "zod";

const schema = z.object({
  typ: z.enum(["strom", "gas", "wasser", "heizung", "sonstige"]),
  monat: z.number().int().min(1).max(12),
  jahr: z.number().int().min(2000).max(2100),
  verbrauch: z.number().min(0),
  einheit: z.string().min(1).max(20),
  kosten: z.number().min(0).optional(),
  zaehlerstand: z.number().min(0).optional(),
  notizen: z.string().max(500).optional(),
});

export async function GET(request: NextRequest) {
  const { error, session } = await requireSession();
  if (error) return error;

  await connectDB();
  const householdId = (session!.user as { householdId?: string }).householdId;
  const { searchParams } = new URL(request.url);
  const typ = searchParams.get("typ");
  const jahr = searchParams.get("jahr");

  const filter: Record<string, unknown> = {};
  if (householdId) filter.householdId = householdId;
  if (typ) filter.typ = typ;
  if (jahr) filter.jahr = parseInt(jahr);

  const items = await Energie.find(filter).sort({ jahr: -1, monat: -1 }).lean();
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

  // Upsert: update if same typ/monat/jahr already exists
  const item = await Energie.findOneAndUpdate(
    { householdId, typ: parsed.data.typ, monat: parsed.data.monat, jahr: parsed.data.jahr },
    { $set: { ...parsed.data, householdId } },
    { upsert: true, new: true }
  );
  return NextResponse.json(item, { status: 201 });
}
