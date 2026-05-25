import { NextRequest, NextResponse } from "next/server";
import { getApiSession } from "@/lib/api-auth";
import { connectDB } from "@/lib/db";
import Gericht from "@/models/Gericht";
import Kochgeraet from "@/models/Kochgeraet";
import { regexEscape } from "@/lib/regex-escape";
import { z } from "zod";

const SORTIER_MAP: Record<string, Record<string, 1 | -1>> = {
  name: { name: 1 },
  "name-desc": { name: -1 },
  neueste: { erstelltAm: -1, name: 1 },
  aelteste: { erstelltAm: 1, name: 1 },
  zeit: { zeitMinuten: 1, name: 1 },
  "zuletzt-gekocht": { zuletztGekocht: -1, name: 1 },
  "oft-gekocht": { gekochtAnzahl: -1, name: 1 },
};

const gerichtSchema = z.object({
  name: z.string().min(1).max(120),
  kochgeraet: z.string().min(1),
  programm: z.string().optional().default(""),
  leistung: z.string().optional().default(""),
  zeit: z.string().optional().default(""),
  zeitMinuten: z.number().int().min(0).optional(),
  portionen: z.number().int().min(1).optional(),
  schwierigkeit: z.enum(["einfach", "mittel", "schwer"]).optional(),
  zutaten: z.array(z.string()).optional().default([]),
  tags: z.array(z.string()).optional().default([]),
  notizen: z.string().optional().default(""),
  rezeptUrl: z.string().url().optional().or(z.literal("")),
  favorit: z.boolean().optional().default(false),
});

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

export async function GET(request: NextRequest) {
  const session = await getApiSession();
  if (!session) return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });

  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const suche = searchParams.get("suche")?.trim();
    const geraet = searchParams.get("geraet")?.trim();
    const nurFavoriten = searchParams.get("favoriten") === "1";
    const tagsParam = searchParams.get("tags")?.trim();
    const sortierung = searchParams.get("sortierung") ?? "name";

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: Record<string, any> = {};
    const householdId = (session.user as { householdId?: string }).householdId;
    if (householdId) filter.householdId = householdId;
    if (geraet && geraet !== "Alle") filter.kochgeraet = geraet;
    if (nurFavoriten) filter.favorit = true;
    if (tagsParam) {
      const tags = tagsParam.split(",").map((t) => t.trim()).filter(Boolean);
      if (tags.length) filter.tags = { $all: tags };
    }
    if (suche) {
      const regex = new RegExp(regexEscape(suche), "i");
      filter.$or = [
        { name: regex }, { kochgeraet: regex }, { programm: regex },
        { leistung: regex }, { notizen: regex }, { zutaten: regex }, { tags: regex },
      ];
    }

    const sortSpec = SORTIER_MAP[sortierung] ?? SORTIER_MAP.name;
    const gerichte = await Gericht.find(filter).sort(sortSpec).lean();
    return NextResponse.json(gerichte.map(serialize));
  } catch (e) {
    console.error("GET /api/kueche/gerichte:", e);
    return NextResponse.json({ error: "Ladefehler" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getApiSession();
  if (!session) return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });

  try {
    await connectDB();

    const body = await request.json();
    const parsed = gerichtSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validierungsfehler", details: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const geraetExists = await Kochgeraet.exists({ name: parsed.data.kochgeraet });
    if (!geraetExists) {
      return NextResponse.json({ error: "Unbekanntes Kochgerät. Bitte in den Einstellungen anlegen." }, { status: 400 });
    }

    const gericht = await Gericht.create({
      ...parsed.data,
      ...((session.user as { householdId?: string }).householdId ? { householdId: (session.user as { householdId?: string }).householdId } : {}),
    });
    return NextResponse.json(serialize(gericht), { status: 201 });
  } catch (e) {
    console.error("POST /api/kueche/gerichte:", e);
    return NextResponse.json({ error: "Speicherfehler" }, { status: 500 });
  }
}
