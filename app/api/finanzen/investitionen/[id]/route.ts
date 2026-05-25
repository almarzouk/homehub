import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { requireSession } from "@/lib/api-auth";
import { connectDB } from "@/lib/db";
import Investment from "@/models/Investment";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: RouteParams) {
  const { error } = await requireSession();
  if (error) return error;
  const { id } = await params;
  if (!mongoose.Types.ObjectId.isValid(id)) return NextResponse.json({ error: "Ungültige ID" }, { status: 400 });
  await connectDB();
  const inv = await Investment.findById(id).lean();
  if (!inv) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
  return NextResponse.json(inv);
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { error } = await requireSession();
  if (error) return error;
  const { id } = await params;
  if (!mongoose.Types.ObjectId.isValid(id)) return NextResponse.json({ error: "Ungültige ID" }, { status: 400 });
  await connectDB();
  const body = await request.json();
  const { title, amount, currentValue, type, startDate, note, ticker, shares } = body;
  const inv = await Investment.findByIdAndUpdate(
    id,
    { $set: { title, amount, currentValue, type, startDate: startDate ? new Date(startDate) : undefined, note, ticker, shares } },
    { new: true }
  );
  if (!inv) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
  return NextResponse.json(inv);
}

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  const { error } = await requireSession();
  if (error) return error;
  const { id } = await params;
  if (!mongoose.Types.ObjectId.isValid(id)) return NextResponse.json({ error: "Ungültige ID" }, { status: 400 });
  await connectDB();
  const inv = await Investment.findByIdAndDelete(id);
  if (!inv) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
  return NextResponse.json({ success: true });
}
