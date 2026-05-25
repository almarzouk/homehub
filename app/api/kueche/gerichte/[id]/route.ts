import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { getApiSession } from "@/lib/api-auth";
import { connectDB } from "@/lib/db";
import Gericht from "@/models/Gericht";
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
    kochgeraet: doc.kochgeraet,
    programm: doc.programm ?? "",
    leistung: doc.leistung ?? "",
    zeit: doc.zeit ?? "",
    zeitMinuten: typeof doc.zeitMinuten === "number" ? doc.zeitMinuten : undefined,
    portionen: typeof doc.portionen === "number" ? doc.portionen : undefined,
    schwierigkeit: doc.schwierigkeit ?? undefined,
    zutaten: Array.isArray(doc.zutaten) ? doc.zutaten : [],
    tags: Array.isArray(doc.tags) ? doc.tags : [],
    notizen: doc.notizen ?? "",
    rezeptUrl: doc.rezeptUrl ?? "",
    favorit: Boolean(doc.favorit),
    gekochtAnzahl: typeof doc.gekochtAnzahl === "number" ? doc.gekochtAnzahl : 0,
    zuletztGekocht: doc.zuletztGekocht?.toISOString?.() ?? doc.zuletztGekocht ?? null,
    erstelltAm: doc.erstelltAm?.toISOString?.() ?? doc.erstelltAm,
    aktualisiertAm: doc.aktualisiertAm?.toISOString?.() ?? doc.aktualisiertAm,
  };
}

const updateSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  kochgeraet: z.string().min(1).optional(),
  programm: z.string().optional(),
  leistung: z.string().optional(),
  zeit: z.string().optional(),
  zeitMinuten: z.number().int().min(0).optional(),
  portionen: z.number().int().min(1).optional(),
  schwierigkeit: z.enum(["einfach", "mittel", "schwer"]).optional(),
  zutaten: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  notizen: z.string().optional(),
  rezeptUrl: z.string().url().optional().or(z.literal("")),
  favorit: z.boolean().optional(),
});

export async function GET(_req: NextRequest, { params }: RouteParams) {
  const session = await getApiSession();
  if (!session) return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });

  const { id } = await params;
  if (!validId(id)) return NextResponse.json({ error: "Ungültige ID" }, { status: 400 });

  try {
    await connectDB();
    const gericht = await Gericht.findById(id).lean();
    if (!gericht) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
    return NextResponse.json(serialize(gericht));
  } catch (e) {
    console.error("GET /api/kueche/gerichte/[id]:", e);
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
    if (parsed.data.kochgeraet) {
      const exists = await Kochgeraet.exists({ name: parsed.data.kochgeraet });
      if (!exists) return NextResponse.json({ error: "Unbekanntes Kochgerät." }, { status: 400 });
    }
    const gericht = await Gericht.findByIdAndUpdate(id, { $set: parsed.data }, { new: true, runValidators: true }).lean();
    if (!gericht) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
    return NextResponse.json(serialize(gericht));
  } catch (e) {
    console.error("PUT /api/kueche/gerichte/[id]:", e);
    return NextResponse.json({ error: "Aktualisierungsfehler" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const session = await getApiSession();
  if (!session) return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });

  const { id } = await params;
  if (!validId(id)) return NextResponse.json({ error: "Ungültige ID" }, { status: 400 });

  try {
    await connectDB();
    const body = await request.json().catch(() => ({}));
    const aktion = body?.aktion;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let update: Record<string, any> | null = null;

    if (aktion === "favorit-umschalten") {
      const aktuell = await Gericht.findById(id).select("favorit").lean();
      if (!aktuell) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
      update = { $set: { favorit: !(aktuell as { favorit?: boolean }).favorit } };
    } else if (aktion === "favorit-setzen") {
      update = { $set: { favorit: Boolean(body.wert) } };
    } else if (aktion === "als-gekocht-markieren") {
      update = { $inc: { gekochtAnzahl: 1 }, $set: { zuletztGekocht: new Date() } };
    } else {
      return NextResponse.json({ error: "Unbekannte Aktion" }, { status: 400 });
    }

    const gericht = await Gericht.findByIdAndUpdate(id, update, { new: true }).lean();
    if (!gericht) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
    return NextResponse.json(serialize(gericht));
  } catch (e) {
    console.error("PATCH /api/kueche/gerichte/[id]:", e);
    return NextResponse.json({ error: "Aktionsfehler" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  const session = await getApiSession();
  if (!session) return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });

  const { id } = await params;
  if (!validId(id)) return NextResponse.json({ error: "Ungültige ID" }, { status: 400 });

  try {
    await connectDB();
    const gericht = await Gericht.findByIdAndDelete(id).lean();
    if (!gericht) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("DELETE /api/kueche/gerichte/[id]:", e);
    return NextResponse.json({ error: "Löschfehler" }, { status: 500 });
  }
}
