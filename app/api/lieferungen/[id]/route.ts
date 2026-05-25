import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { connectDB } from "@/lib/db";
import Lieferung from "@/models/Lieferung";
import { z } from "zod";

const updateSchema = z.object({
  bezeichnung: z.string().min(1).max(200).optional(),
  haendler: z.string().max(100).optional(),
  trackingNummer: z.string().max(100).optional(),
  trackingUrl: z.string().max(500).optional(),
  status: z.enum(["bestellt", "versendet", "unterwegs", "zugestellt", "abgeholt", "problem"]).optional(),
  bestelldatum: z.string().optional(),
  erwarteteAnkunft: z.string().optional(),
  angekommendAm: z.string().optional(),
  empfaenger: z.string().max(60).optional(),
  notizen: z.string().max(500).optional(),
});

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, session } = await requireSession();
  if (error) return error;

  const { id } = await params;
  const body = await request.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Ungültige Daten" }, { status: 400 });

  await connectDB();
  const householdId = (session!.user as { householdId?: string }).householdId;

  const update: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.bestelldatum) update.bestelldatum = new Date(parsed.data.bestelldatum);
  if (parsed.data.erwarteteAnkunft) update.erwarteteAnkunft = new Date(parsed.data.erwarteteAnkunft);
  if (parsed.data.angekommendAm) update.angekommendAm = new Date(parsed.data.angekommendAm);

  const item = await Lieferung.findOneAndUpdate({ _id: id, householdId }, { $set: update }, { new: true });
  if (!item) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
  return NextResponse.json(item);
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, session } = await requireSession();
  if (error) return error;

  const { id } = await params;
  await connectDB();
  const householdId = (session!.user as { householdId?: string }).householdId;
  await Lieferung.findOneAndDelete({ _id: id, householdId });
  return NextResponse.json({ ok: true });
}
