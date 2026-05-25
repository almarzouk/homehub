import { NextRequest, NextResponse } from "next/server";
import { getApiSession } from "@/lib/api-auth";
import { connectDB } from "@/lib/db";
import HaushaltAufgabe from "@/models/HaushaltAufgabe";
import { z } from "zod";

const updateSchema = z.object({
  titel: z.string().min(1).max(200).optional(),
  beschreibung: z.string().optional(),
  kategorie: z.enum(["reinigung", "wartung", "einkauf", "sonstiges"]).optional(),
  prioritaet: z.enum(["hoch", "mittel", "niedrig"]).optional(),
  erledigt: z.boolean().optional(),
  wiederholung: z.enum(["taeglich", "woechentlich", "monatlich", "nein"]).optional(),
  faelligAm: z.string().optional().nullable(),
});

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getApiSession();
  if (!session) return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });

  const { id } = await params;
  try {
    await connectDB();
    const body = await request.json();
    const data = updateSchema.parse(body);

    const update: Record<string, unknown> = { ...data };
    if (data.erledigt === true) update.erledigtAm = new Date();
    if (data.erledigt === false) update.erledigtAm = null;
    if (data.faelligAm) update.faelligAm = new Date(data.faelligAm);

    const aufgabe = await HaushaltAufgabe.findByIdAndUpdate(id, update, { new: true }).lean();
    if (!aufgabe) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
    return NextResponse.json({ aufgabe });
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: e.issues }, { status: 400 });
    console.error("PATCH /api/haushalt/[id]:", e);
    return NextResponse.json({ error: "Aktualisierungsfehler" }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getApiSession();
  if (!session) return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });

  const { id } = await params;
  try {
    await connectDB();
    await HaushaltAufgabe.findByIdAndDelete(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("DELETE /api/haushalt/[id]:", e);
    return NextResponse.json({ error: "Löschfehler" }, { status: 500 });
  }
}
