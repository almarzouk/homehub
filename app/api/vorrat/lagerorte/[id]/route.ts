import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { getApiSession } from "@/lib/api-auth";
import { connectDB } from "@/lib/db";
import Location from "@/models/Location";
import { z } from "zod";

type RouteParams = { params: Promise<{ id: string }> };

const updateSchema = z.object({
  name: z.string().min(1).max(80).optional(),
  icon: z.string().optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
});

export async function GET(_req: NextRequest, { params }: RouteParams) {
  const session = await getApiSession();
  if (!session) return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  const { id } = await params;
  if (!mongoose.Types.ObjectId.isValid(id)) return NextResponse.json({ error: "Ungültige ID" }, { status: 400 });
  await connectDB();
  const loc = await Location.findById(id).lean();
  if (!loc) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
  return NextResponse.json(loc);
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const session = await getApiSession();
  if (!session) return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  const { id } = await params;
  if (!mongoose.Types.ObjectId.isValid(id)) return NextResponse.json({ error: "Ungültige ID" }, { status: 400 });
  await connectDB();
  const body = await request.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Validierungsfehler" }, { status: 400 });
  const loc = await Location.findByIdAndUpdate(id, { $set: parsed.data }, { new: true });
  if (!loc) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
  return NextResponse.json(loc);
}

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  const session = await getApiSession();
  if (!session) return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  const { id } = await params;
  if (!mongoose.Types.ObjectId.isValid(id)) return NextResponse.json({ error: "Ungültige ID" }, { status: 400 });
  await connectDB();
  const loc = await Location.findByIdAndDelete(id);
  if (!loc) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
  return NextResponse.json({ success: true });
}
