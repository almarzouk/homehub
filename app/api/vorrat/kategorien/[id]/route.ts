import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { getApiSession } from "@/lib/api-auth";
import { connectDB } from "@/lib/db";
import Category from "@/models/Category";
import { z } from "zod";

type RouteParams = { params: Promise<{ id: string }> };

const updateSchema = z.object({
  name: z.string().min(1).max(80).optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
});

export async function GET(_req: NextRequest, { params }: RouteParams) {
  const session = await getApiSession();
  if (!session) return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  const { id } = await params;
  if (!mongoose.Types.ObjectId.isValid(id)) return NextResponse.json({ error: "Ungültige ID" }, { status: 400 });
  await connectDB();
  const cat = await Category.findById(id).lean();
  if (!cat) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
  return NextResponse.json(cat);
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
  const cat = await Category.findByIdAndUpdate(id, { $set: parsed.data }, { new: true });
  if (!cat) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
  return NextResponse.json(cat);
}

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  const session = await getApiSession();
  if (!session) return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  const { id } = await params;
  if (!mongoose.Types.ObjectId.isValid(id)) return NextResponse.json({ error: "Ungültige ID" }, { status: 400 });
  await connectDB();
  const cat = await Category.findByIdAndDelete(id);
  if (!cat) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
  return NextResponse.json({ success: true });
}
