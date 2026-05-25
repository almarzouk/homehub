import { NextRequest, NextResponse } from "next/server";
import { getApiSession } from "@/lib/api-auth";
import { connectDB } from "@/lib/db";
import Wunsch from "@/models/Wunsch";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  beschreibung: z.string().optional(),
  preis: z.number().min(0).optional(),
  prioritaet: z.enum(["hoch", "mittel", "niedrig"]).optional(),
  kategorie: z.string().optional(),
  link: z.string().optional(),
  bild: z.string().optional().nullable(),
  gekauft: z.boolean().optional(),
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
    if (data.gekauft === true) update.gekauftAm = new Date();

    const wunsch = await Wunsch.findByIdAndUpdate(id, update, { new: true }).lean();
    if (!wunsch) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
    return NextResponse.json({ wunsch });
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: e.issues }, { status: 400 });
    console.error("PUT /api/wunschliste/[id]:", e);
    return NextResponse.json({ error: "Aktualisierungsfehler" }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getApiSession();
  if (!session) return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });

  const { id } = await params;
  try {
    await connectDB();
    await Wunsch.findByIdAndDelete(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("DELETE /api/wunschliste/[id]:", e);
    return NextResponse.json({ error: "Löschfehler" }, { status: 500 });
  }
}
