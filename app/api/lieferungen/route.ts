import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { connectDB } from "@/lib/db";
import Lieferung from "@/models/Lieferung";
import { z } from "zod";

const schema = z.object({
  bezeichnung: z.string().min(1).max(200),
  haendler: z.string().max(100).optional(),
  trackingNummer: z.string().max(100).optional(),
  trackingUrl: z.string().url().max(500).optional().or(z.literal("")),
  status: z.enum(["bestellt", "versendet", "unterwegs", "zugestellt", "abgeholt", "problem"]).default("bestellt"),
  bestelldatum: z.string().optional(),
  erwarteteAnkunft: z.string().optional(),
  empfaenger: z.string().max(60).optional(),
  notizen: z.string().max(500).optional(),
});

export async function GET(_request: NextRequest) {
  const { error, session } = await requireSession();
  if (error) return error;

  await connectDB();
  const householdId = (session!.user as { householdId?: string }).householdId;
  const items = await Lieferung.find(householdId ? { householdId } : {}).sort({ createdAt: -1 }).lean();
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

  const item = await Lieferung.create({
    ...parsed.data,
    householdId,
    bestelldatum: parsed.data.bestelldatum ? new Date(parsed.data.bestelldatum) : undefined,
    erwarteteAnkunft: parsed.data.erwarteteAnkunft ? new Date(parsed.data.erwarteteAnkunft) : undefined,
    trackingUrl: parsed.data.trackingUrl || undefined,
  });
  return NextResponse.json(item, { status: 201 });
}
