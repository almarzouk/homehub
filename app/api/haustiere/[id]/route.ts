import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { connectDB } from "@/lib/db";
import Haustier from "@/models/Haustier";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(1).max(60).optional(),
  tierart: z.string().min(1).max(40).optional(),
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

const impfungSchema = z.object({
  name: z.string().min(1).max(100),
  datum: z.string(),
  naechsteFaelligkeit: z.string().optional(),
  tierarzt: z.string().max(100).optional(),
});

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, session } = await requireSession();
  if (error) return error;

  const { id } = await params;
  const body = await request.json();
  await connectDB();
  const householdId = (session!.user as { householdId?: string }).householdId;

  if (body.addImpfung) {
    const parsed = impfungSchema.safeParse(body.addImpfung);
    if (!parsed.success) return NextResponse.json({ error: "Ungültige Impfdaten" }, { status: 400 });
    const item = await Haustier.findOneAndUpdate(
      { _id: id, householdId },
      {
        $push: {
          impfungen: {
            ...parsed.data,
            datum: new Date(parsed.data.datum),
            naechsteFaelligkeit: parsed.data.naechsteFaelligkeit ? new Date(parsed.data.naechsteFaelligkeit) : undefined,
          },
        },
      },
      { new: true }
    );
    if (!item) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
    return NextResponse.json(item);
  }

  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Ungültige Daten" }, { status: 400 });

  const update: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.geburtsdatum) update.geburtsdatum = new Date(parsed.data.geburtsdatum);
  if (parsed.data.naechsterTierarztTermin) update.naechsterTierarztTermin = new Date(parsed.data.naechsterTierarztTermin);

  const item = await Haustier.findOneAndUpdate({ _id: id, householdId }, { $set: update }, { new: true });
  if (!item) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
  return NextResponse.json(item);
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, session } = await requireSession();
  if (error) return error;

  const { id } = await params;
  await connectDB();
  const householdId = (session!.user as { householdId?: string }).householdId;
  await Haustier.findOneAndDelete({ _id: id, householdId });
  return NextResponse.json({ ok: true });
}
