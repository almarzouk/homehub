import { NextRequest, NextResponse } from "next/server";
import { getApiSession } from "@/lib/api-auth";
import { connectDB } from "@/lib/db";
import Reise from "@/models/Reise";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  ziel: z.string().min(1).max(200).optional(),
  startDatum: z.string().optional().nullable(),
  endDatum: z.string().optional().nullable(),
  budget: z.number().optional().nullable(),
  waehrung: z.string().optional(),
  teilnehmer: z.string().optional(),
  notizen: z.string().optional(),
  status: z.enum(["geplant","aktiv","abgeschlossen"]).optional(),
  // Checklist operations
  checkItem: z.object({ text: z.string().min(1) }).optional(),
  toggleItem: z.string().optional(),   // item _id to toggle
  deleteItem: z.string().optional(),   // item _id to delete
});

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getApiSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  try {
    await connectDB();
    const body = await request.json();
    const data = updateSchema.parse(body);

    // Add checklist item
    if (data.checkItem) {
      const reise = await Reise.findByIdAndUpdate(
        id,
        { $push: { checkliste: { text: data.checkItem.text, erledigt: false } } },
        { new: true }
      ).lean();
      return NextResponse.json({ reise });
    }
    // Toggle checklist item
    if (data.toggleItem) {
      const reise = await Reise.findById(id);
      if (!reise) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
      const item = reise.checkliste.find((c: { _id: { toString(): string }; erledigt: boolean }) => c._id.toString() === data.toggleItem);
      if (item) item.erledigt = !item.erledigt;
      await reise.save();
      return NextResponse.json({ reise: reise.toJSON() });
    }
    // Delete checklist item
    if (data.deleteItem) {
      const reise = await Reise.findByIdAndUpdate(
        id,
        { $pull: { checkliste: { _id: data.deleteItem } } },
        { new: true }
      ).lean();
      return NextResponse.json({ reise });
    }

    // Update main fields
    const update: Record<string, unknown> = {};
    if (data.name) update.name = data.name;
    if (data.ziel) update.ziel = data.ziel;
    if (data.startDatum !== undefined) update.startDatum = data.startDatum ? new Date(data.startDatum) : null;
    if (data.endDatum !== undefined) update.endDatum = data.endDatum ? new Date(data.endDatum) : null;
    if (data.budget !== undefined) update.budget = data.budget;
    if (data.waehrung) update.waehrung = data.waehrung;
    if (data.teilnehmer !== undefined) update.teilnehmer = data.teilnehmer;
    if (data.notizen !== undefined) update.notizen = data.notizen;
    if (data.status) update.status = data.status;

    const reise = await Reise.findByIdAndUpdate(id, update, { new: true }).lean();
    if (!reise) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
    return NextResponse.json({ reise });
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: e.issues }, { status: 400 });
    console.error("PATCH /api/reisen/[id]:", e);
    return NextResponse.json({ error: "Aktualisierungsfehler" }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getApiSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  try {
    await connectDB();
    await Reise.findByIdAndDelete(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("DELETE /api/reisen/[id]:", e);
    return NextResponse.json({ error: "Löschfehler" }, { status: 500 });
  }
}
