import { NextRequest, NextResponse } from "next/server";
import { getApiSession } from "@/lib/api-auth";
import { connectDB } from "@/lib/db";
import Haushaltskasse from "@/models/Haushaltskasse";
import { z } from "zod";

const updateSchema = z.object({
  betrag: z.number().positive().optional(),
  kategorie: z.enum(["lebensmittel","transport","restaurant","kind","kleidung","gesundheit","haushalt","freizeit","sonstiges"]).optional(),
  beschreibung: z.string().min(1).max(300).optional(),
  datum: z.string().optional(),
  bezahltVon: z.string().optional(),
  notiz: z.string().optional(),
});

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getApiSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  try {
    await connectDB();
    const body = await request.json();
    const data = updateSchema.parse(body);
    const update: Record<string, unknown> = { ...data };
    if (data.datum) update.datum = new Date(data.datum);

    const eintrag = await Haushaltskasse.findByIdAndUpdate(id, update, { new: true }).lean();
    if (!eintrag) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
    return NextResponse.json({ eintrag });
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: e.issues }, { status: 400 });
    console.error("PATCH /api/haushaltskasse/[id]:", e);
    return NextResponse.json({ error: "Aktualisierungsfehler" }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getApiSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  try {
    await connectDB();
    await Haushaltskasse.findByIdAndDelete(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("DELETE /api/haushaltskasse/[id]:", e);
    return NextResponse.json({ error: "Löschfehler" }, { status: 500 });
  }
}
