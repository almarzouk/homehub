import { NextRequest, NextResponse } from "next/server";
import { getApiSession } from "@/lib/api-auth";
import { connectDB } from "@/lib/db";
import BabyEintrag from "@/models/BabyEintrag";
import { z } from "zod";

const updateSchema = z.object({
  typ: z.enum(["stillen","flasche","schlaf","aufwachen","windel","gewicht","groesse","notiz"]).optional(),
  zeitpunkt: z.string().optional(),
  menge: z.number().optional(),
  dauer: z.number().optional(),
  seite: z.enum(["links","rechts","beide"]).optional(),
  windel: z.enum(["nass","schmutzig","beides"]).optional(),
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
    if (data.zeitpunkt) update.zeitpunkt = new Date(data.zeitpunkt);

    const eintrag = await BabyEintrag.findByIdAndUpdate(id, update, { new: true }).lean();
    if (!eintrag) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
    return NextResponse.json({ eintrag });
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: e.issues }, { status: 400 });
    console.error("PATCH /api/baby/[id]:", e);
    return NextResponse.json({ error: "Aktualisierungsfehler" }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getApiSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  try {
    await connectDB();
    await BabyEintrag.findByIdAndDelete(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("DELETE /api/baby/[id]:", e);
    return NextResponse.json({ error: "Löschfehler" }, { status: 500 });
  }
}
