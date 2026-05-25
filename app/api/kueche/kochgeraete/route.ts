import { NextRequest, NextResponse } from "next/server";
import { getApiSession } from "@/lib/api-auth";
import { connectDB } from "@/lib/db";
import Kochgeraet from "@/models/Kochgeraet";
import { STANDARD_KOCHGERAETE } from "@/lib/kochgeraet-defaults";
import { z } from "zod";

const programSchema = z.object({
  name: z.string().min(1),
  beschreibung: z.string().optional().default(""),
});

const kochgeraetSchema = z.object({
  name: z.string().min(1).max(60),
  programme: z.array(programSchema).optional().default([]),
  leistungen: z.array(z.string()).optional().default([]),
  icon: z.string().optional().default("pot"),
  hintergrund: z.string().optional().default("#f3f4f6"),
  rand: z.string().optional().default("#d1d5db"),
});

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

export async function GET() {
  const session = await getApiSession();
  if (!session) return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });

  try {
    await connectDB();
    const householdId = (session.user as { householdId?: string }).householdId;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: Record<string, any> = householdId ? { householdId } : {};

    let geraete = await Kochgeraet.find(filter).sort({ name: 1 }).lean();
    if (geraete.length === 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const defaults = STANDARD_KOCHGERAETE.map((g) => ({ ...g, ...(householdId ? { householdId } : {}) })) as any[];
      await Kochgeraet.insertMany(defaults, { ordered: false }).catch(() => null);
      geraete = await Kochgeraet.find(filter).sort({ name: 1 }).lean();
    }

    return NextResponse.json(geraete.map(serialize));
  } catch (e) {
    console.error("GET /api/kueche/kochgeraete:", e);
    return NextResponse.json({ error: "Ladefehler" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getApiSession();
  if (!session) return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });

  try {
    await connectDB();
    const body = await request.json();
    const parsed = kochgeraetSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validierungsfehler", details: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const householdId = (session.user as { householdId?: string }).householdId;
      const existing = await Kochgeraet.findOne({ name: parsed.data.name, ...(householdId ? { householdId } : {}) });
    if (existing) {
      return NextResponse.json({ error: "Ein Gerät mit diesem Namen existiert bereits." }, { status: 409 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const geraet = await Kochgeraet.create({ ...parsed.data, ...(householdId ? { householdId } : {}) } as any);
    return NextResponse.json(serialize(geraet), { status: 201 });
  } catch (e) {
    console.error("POST /api/kueche/kochgeraete:", e);
    return NextResponse.json({ error: "Speicherfehler" }, { status: 500 });
  }
}
