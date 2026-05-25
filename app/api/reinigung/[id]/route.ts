import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { connectDB } from "@/lib/db";
import Reinigung from "@/models/Reinigung";
import { z } from "zod";

const updateSchema = z.object({
  bereich: z.string().min(1).max(80).optional(),
  aufgabe: z.string().min(1).max(200).optional(),
  haeufigkeit: z.enum(["taeglich", "woechentlich", "zweiwochentlich", "monatlich", "vierteljaehrlich"]).optional(),
  zugewiesen: z.string().max(60).optional(),
  naechsteFaelligkeit: z.string().optional(),
  letzteErledigung: z.string().optional(),
  erledigt: z.boolean().optional(),
  notizen: z.string().max(500).optional(),
});

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, session } = await requireSession();
  if (error) return error;

  const { id } = await params;
  const body = await request.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Ungültige Daten" }, { status: 400 });

  await connectDB();
  const householdId = (session!.user as { householdId?: string }).householdId;

  const update: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.naechsteFaelligkeit) update.naechsteFaelligkeit = new Date(parsed.data.naechsteFaelligkeit);
  if (parsed.data.letzteErledigung) update.letzteErledigung = new Date(parsed.data.letzteErledigung);

  const item = await Reinigung.findOneAndUpdate(
    { _id: id, householdId },
    { $set: update },
    { new: true }
  );
  if (!item) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
  return NextResponse.json(item);
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, session } = await requireSession();
  if (error) return error;

  const { id } = await params;
  await connectDB();
  const householdId = (session!.user as { householdId?: string }).householdId;

  await Reinigung.findOneAndDelete({ _id: id, householdId });
  return NextResponse.json({ ok: true });
}
