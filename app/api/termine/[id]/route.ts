import { NextRequest, NextResponse } from "next/server";
import { getApiSession } from "@/lib/api-auth";
import { connectDB } from "@/lib/db";
import Termin from "@/models/Termin";
import mongoose from "mongoose";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getApiSession();
  if (!session?.user) return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });

  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) {
    return NextResponse.json({ error: "Ungültige ID" }, { status: 400 });
  }

  await connectDB();
  await Termin.findByIdAndDelete(id);
  return NextResponse.json({ ok: true });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getApiSession();
  if (!session?.user) return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });

  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) {
    return NextResponse.json({ error: "Ungültige ID" }, { status: 400 });
  }

  const body = await request.json();

  await connectDB();
  const updated = await Termin.findByIdAndUpdate(
    id,
    { $set: body },
    { new: true, runValidators: true }
  );

  if (!updated) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
  return NextResponse.json(updated);
}
