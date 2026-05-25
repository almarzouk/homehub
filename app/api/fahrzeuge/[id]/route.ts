import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { connectDB } from "@/lib/db";
import Fahrzeug from "@/models/Fahrzeug";
import { z } from "zod";

const updateSchema = z.object({
  bezeichnung: z.string().min(1).max(100).optional(),
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

const wartungSchema = z.object({
  datum: z.string(),
  beschreibung: z.string().min(1).max(300),
  kosten: z.number().min(0).optional(),
  kilometerstand: z.number().min(0).optional(),
  werkstatt: z.string().max(100).optional(),
});

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, session } = await requireSession();
  if (error) return error;

  const { id } = await params;
  await connectDB();
  const householdId = (session!.user as { householdId?: string }).householdId;
  const item = await Fahrzeug.findOne({ _id: id, householdId }).lean();
  if (!item) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
  return NextResponse.json(item);
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, session } = await requireSession();
  if (error) return error;

  const { id } = await params;
  const body = await request.json();
  await connectDB();
  const householdId = (session!.user as { householdId?: string }).householdId;

  // Handle adding a wartung entry
  if (body.addWartung) {
    const parsed = wartungSchema.safeParse(body.addWartung);
    if (!parsed.success) return NextResponse.json({ error: "Ungültige Wartungsdaten" }, { status: 400 });
    const item = await Fahrzeug.findOneAndUpdate(
      { _id: id, householdId },
      { $push: { wartungen: { ...parsed.data, datum: new Date(parsed.data.datum) } } },
      { new: true }
    );
    if (!item) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
    return NextResponse.json(item);
  }

  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Ungültige Daten" }, { status: 400 });

  const update: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.naechsterTuev) update.naechsterTuev = new Date(parsed.data.naechsterTuev);
  if (parsed.data.naechsterService) update.naechsterService = new Date(parsed.data.naechsterService);

  const item = await Fahrzeug.findOneAndUpdate({ _id: id, householdId }, { $set: update }, { new: true });
  if (!item) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
  return NextResponse.json(item);
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, session } = await requireSession();
  if (error) return error;

  const { id } = await params;
  await connectDB();
  const householdId = (session!.user as { householdId?: string }).householdId;
  await Fahrzeug.findOneAndDelete({ _id: id, householdId });
  return NextResponse.json({ ok: true });
}
