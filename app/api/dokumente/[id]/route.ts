import { NextRequest, NextResponse } from "next/server";
import { getApiSession } from "@/lib/api-auth";
import { connectDB } from "@/lib/db";
import Dokument from "@/models/Dokument";
import { z } from "zod";

const updateSchema = z.object({
  titel: z.string().min(1).max(200).optional(),
  kategorie: z.enum(["vertrag", "garantie", "versicherung", "ausweis", "gesundheit", "sonstiges"]).optional(),
  beschreibung: z.string().optional(),
  bild: z.string().optional(),
  ablaufdatum: z.string().optional().nullable(),
});

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getApiSession();
  if (!session) return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });

  const { id } = await params;
  try {
    await connectDB();
    const body = await request.json();
    const data = updateSchema.parse(body);

    const update: Record<string, unknown> = { ...data };
    if (data.ablaufdatum) update.ablaufdatum = new Date(data.ablaufdatum);

    const dokument = await Dokument.findByIdAndUpdate(id, update, { new: true }).lean();
    if (!dokument) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
    return NextResponse.json({ dokument });
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: e.issues }, { status: 400 });
    console.error("PUT /api/dokumente/[id]:", e);
    return NextResponse.json({ error: "Aktualisierungsfehler" }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getApiSession();
  if (!session) return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });

  const { id } = await params;
  try {
    await connectDB();
    await Dokument.findByIdAndDelete(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("DELETE /api/dokumente/[id]:", e);
    return NextResponse.json({ error: "Löschfehler" }, { status: 500 });
  }
}
