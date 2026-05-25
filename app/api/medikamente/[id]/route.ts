import { NextRequest, NextResponse } from "next/server";
import { getApiSession } from "@/lib/api-auth";
import { connectDB } from "@/lib/db";
import Medikament from "@/models/Medikament";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  wirkstoff: z.string().optional(),
  dosierung: z.string().optional(),
  einheit: z.enum(["mg", "ml", "tablette", "kapsel", "tropfen", "sonstiges"]).optional(),
  vorrat: z.number().min(0).optional(),
  mindestvorrat: z.number().min(0).optional(),
  ablaufdatum: z.string().optional().nullable(),
  einnahmezeiten: z.array(z.string()).optional(),
  einnahmehinweis: z.string().optional(),
  bild: z.string().optional().nullable(),
  erinnerung: z.boolean().optional(),
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

    const medikament = await Medikament.findByIdAndUpdate(id, update, { new: true }).lean();
    if (!medikament) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
    return NextResponse.json({ medikament });
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: e.issues }, { status: 400 });
    console.error("PUT /api/medikamente/[id]:", e);
    return NextResponse.json({ error: "Aktualisierungsfehler" }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getApiSession();
  if (!session) return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });

  const { id } = await params;
  try {
    await connectDB();
    await Medikament.findByIdAndDelete(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("DELETE /api/medikamente/[id]:", e);
    return NextResponse.json({ error: "Löschfehler" }, { status: 500 });
  }
}
