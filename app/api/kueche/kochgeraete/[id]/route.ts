import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { getApiSession } from "@/lib/api-auth";
import { connectDB } from "@/lib/db";
import Kochgeraet from "@/models/Kochgeraet";
import { z } from "zod";

type RouteParams = { params: Promise<{ id: string }> };

function validId(id: string) {
  return mongoose.Types.ObjectId.isValid(id);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function serialize(doc: any) {
  return {
    _id: doc._id.toString(),
    name: doc.name,
    programme: Array.isArray(doc.programme) ? doc.programme : [],
    leistungen: Array.isArray(doc.leistungen) ? doc.leistungen : [],
    icon: doc.icon ?? "pot",
    hintergrund: doc.hintergrund ?? "#f3f4f6",
    rand: doc.rand ?? "#d1d5db",
  };
}

const updateSchema = z.object({
  name: z.string().min(1).max(60).optional(),
  programme: z.array(z.string().min(1).max(80)).optional(),
  leistungen: z.array(z.string()).optional(),
  icon: z.string().optional(),
  hintergrund: z.string().optional(),
  rand: z.string().optional(),
});

export async function GET(_req: NextRequest, { params }: RouteParams) {
  const session = await getApiSession();
  if (!session) return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });

  const { id } = await params;
  if (!validId(id)) return NextResponse.json({ error: "Ungültige ID" }, { status: 400 });

  try {
    await connectDB();
    const geraet = await Kochgeraet.findById(id).lean();
    if (!geraet) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
    return NextResponse.json(serialize(geraet));
  } catch (e) {
    console.error("GET /api/kueche/kochgeraete/[id]:", e);
    return NextResponse.json({ error: "Ladefehler" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const session = await getApiSession();
  if (!session) return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });

  const { id } = await params;
  if (!validId(id)) return NextResponse.json({ error: "Ungültige ID" }, { status: 400 });

  try {
    await connectDB();
    const body = await request.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validierungsfehler", details: parsed.error.flatten().fieldErrors }, { status: 400 });
    }
    if (parsed.data.name) {
      const existing = await Kochgeraet.findOne({ name: parsed.data.name, _id: { $ne: new mongoose.Types.ObjectId(id) } });
      if (existing) return NextResponse.json({ error: "Name bereits vergeben." }, { status: 409 });
    }
    const geraet = await Kochgeraet.findByIdAndUpdate(id, { $set: parsed.data }, { new: true, runValidators: true }).lean();
    if (!geraet) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
    return NextResponse.json(serialize(geraet));
  } catch (e) {
    console.error("PUT /api/kueche/kochgeraete/[id]:", e);
    return NextResponse.json({ error: "Aktualisierungsfehler" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  const session = await getApiSession();
  if (!session) return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });

  const { id } = await params;
  if (!validId(id)) return NextResponse.json({ error: "Ungültige ID" }, { status: 400 });

  try {
    await connectDB();
    const geraet = await Kochgeraet.findByIdAndDelete(id).lean();
    if (!geraet) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("DELETE /api/kueche/kochgeraete/[id]:", e);
    return NextResponse.json({ error: "Löschfehler" }, { status: 500 });
  }
}
