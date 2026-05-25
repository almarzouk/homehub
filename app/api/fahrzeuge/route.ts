import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { connectDB } from "@/lib/db";
import Fahrzeug from "@/models/Fahrzeug";
import { z } from "zod";

const schema = z.object({
  bezeichnung: z.string().min(1).max(100),
  kennzeichen: z.string().max(20).optional(),
  marke: z.string().max(60).optional(),
  modell: z.string().max(60).optional(),
  baujahr: z.number().int().min(1900).max(2100).optional(),
  farbe: z.string().max(40).optional(),
  treibstoff: z.enum(["benzin", "diesel", "elektro", "hybrid", "gas", "sonstige"]).optional(),
  naechsterTuev: z.string().optional(),
  naechsterService: z.string().optional(),
  aktuellerKmStand: z.number().min(0).optional(),
  notizen: z.string().max(1000).optional(),
});

export async function GET(_request: NextRequest) {
  const { error, session } = await requireSession();
  if (error) return error;

  await connectDB();
  const householdId = (session!.user as { householdId?: string }).householdId;
  const items = await Fahrzeug.find(householdId ? { householdId } : {}).sort({ createdAt: -1 }).lean();
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

  const item = await Fahrzeug.create({
    ...parsed.data,
    householdId,
    naechsterTuev: parsed.data.naechsterTuev ? new Date(parsed.data.naechsterTuev) : undefined,
    naechsterService: parsed.data.naechsterService ? new Date(parsed.data.naechsterService) : undefined,
  });
  return NextResponse.json(item, { status: 201 });
}
