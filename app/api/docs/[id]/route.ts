import { NextRequest, NextResponse } from "next/server";
import { getApiSession } from "@/lib/api-auth";
import { connectDB } from "@/lib/db";
import DocTab from "@/models/DocTab";
import { z } from "zod";

const updateSchema = z.object({
  title: z.string().min(1).max(120).optional(),
  content: z.string().max(500_000).optional(),
  sortOrder: z.number().int().min(0).optional(),
});

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getApiSession();
  if (!session) return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });

  const { id } = await params;
  try {
    await connectDB();
    const body = await request.json();
    const data = updateSchema.parse(body);

    const tab = await DocTab.findByIdAndUpdate(id, { $set: data }, { new: true }).lean();
    if (!tab) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
    return NextResponse.json({ tab });
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: e.issues }, { status: 400 });
    console.error("PUT /api/docs/[id]:", e);
    return NextResponse.json({ error: "Aktualisierungsfehler" }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getApiSession();
  if (!session) return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });

  const { id } = await params;
  try {
    await connectDB();
    const deleted = await DocTab.findByIdAndDelete(id);
    if (!deleted) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("DELETE /api/docs/[id]:", e);
    return NextResponse.json({ error: "Löschfehler" }, { status: 500 });
  }
}
