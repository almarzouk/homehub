import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { requireSession } from "@/lib/api-auth";
import { connectDB } from "@/lib/db";
import Fixkosten from "@/models/Fixkosten";

type Params = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, { params }: Params) {
  const { error } = await requireSession();
  if (error) return error;

  const { id } = await params;
  if (!mongoose.Types.ObjectId.isValid(id))
    return NextResponse.json({ error: "Ungültige ID" }, { status: 400 });

  await connectDB();
  const body = await request.json();
  const item = await Fixkosten.findByIdAndUpdate(id, { $set: body }, { new: true }).lean();
  if (!item) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
  return NextResponse.json(item);
}

export async function DELETE(_: NextRequest, { params }: Params) {
  const { error } = await requireSession();
  if (error) return error;

  const { id } = await params;
  if (!mongoose.Types.ObjectId.isValid(id))
    return NextResponse.json({ error: "Ungültige ID" }, { status: 400 });

  await connectDB();
  await Fixkosten.findByIdAndDelete(id);
  return NextResponse.json({ ok: true });
}
