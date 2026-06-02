import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { connectDB } from "@/lib/db";
import Gericht from "@/models/Gericht";
import Kochgeraet from "@/models/Kochgeraet";
import KIVerlauf from "@/models/KIVerlauf";
import OpenAI from "openai";

interface WasKochenBody {
  protein: string[];
  staerke: string[];
  gemuese: string[];
  zeitMinuten: number;
  personen: number;
  extra?: string;
}

// GET — load last cached "Was kochen?" result
export async function GET() {
  const { session, error } = await requireSession();
  if (error) return error;

  await connectDB();

  const householdId = (session!.user as { householdId?: string }).householdId;
  const userId = (session!.user as { id?: string }).id;

  const filter = householdId
    ? { householdId, typ: "was-kochen" }
    : { userId, typ: "was-kochen" };

  const letztes = await KIVerlauf.findOne(filter)
    .sort({ createdAt: -1 })
    .lean();

  if (!letztes) return NextResponse.json({ cached: null });

  return NextResponse.json({
    cached: {
      _id: letztes._id?.toString(),
      titel: letztes.titel,
      eingabe: letztes.eingabe,
      rezepte: letztes.ergebnis,
      tokenGeschaetzt: letztes.tokenGeschaetzt,
      createdAt: letztes.createdAt,
    },
  });
}

// POST — generate new recipes (and save to cache)
export async function POST(req: NextRequest) {
  const { session, error } = await requireSession();
  if (error) return error;

  if (
    !process.env.OPENAI_API_KEY ||
    process.env.OPENAI_API_KEY.startsWith("sk-placeholder")
  ) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY nicht konfiguriert." },
      { status: 503 }
    );
  }

  const body: WasKochenBody = await req.json();
  const { protein, staerke, gemuese, zeitMinuten, personen, extra } = body;

  await connectDB();

  const householdId = (session!.user as { householdId?: string }).householdId;
  const userId = (session!.user as { id?: string }).id;

  const kochgeraete = await Kochgeraet.find(householdId ? { householdId } : {})
    .select("name")
    .lean();
  const geraeteNamen =
    kochgeraete.map((k) => k.name).join(", ") || "Herd, Ofen";

  const zutatenListe = [
    protein.length > 0 && `Protein: ${protein.join(", ")}`,
    staerke.length > 0 && `Sättigungsbeilage: ${staerke.join(", ")}`,
    gemuese.length > 0 && `Gemüse: ${gemuese.join(", ")}`,
    extra && `Sonstiges: ${extra}`,
  ]
    .filter(Boolean)
    .join("\n");

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const prompt = `Du bist ein syrisch-libanesischer Kochexperte. Der Benutzer hat folgende Zutaten zu Hause:

${zutatenListe}
Verfügbare Zeit: ${zeitMinuten} Minuten
Portionen: ${personen} Personen
Verfügbare Kochgeräte: ${geraeteNamen}

Erstelle genau 3 verschiedene traditionelle syrische oder libanesische Gerichte, die man mit diesen Zutaten kochen kann.

Antworte NUR als valides JSON-Array (keine Markdown-Blöcke):
[
  {
    "name": "Gerichtname auf Deutsch",
    "kochgeraet": "eines der verfügbaren Geräte",
    "programm": "z.B. Braten",
    "leistung": "z.B. Mittlere Hitze",
    "zeit": "z.B. 30 Minuten",
    "zeitMinuten": 30,
    "portionen": ${personen},
    "schwierigkeit": "einfach|mittel|schwer",
    "zutaten": ["genaue Mengenangabe und Zutat", "..."],
    "notizen": "Vollständige Schritt-für-Schritt Anleitung auf Deutsch. Min. 150 Wörter.",
    "tags": ["syrisch", "..."]
  }
]

Wichtig: Verwende NUR die Zutaten, die der Benutzer angegeben hat. Halte die Kochzeit unter ${zeitMinuten} Minuten.`;

  let rezepte: unknown[];
  let tokenVerbraucht = 0;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.8,
      max_tokens: 3000,
    });

    tokenVerbraucht = completion.usage?.total_tokens ?? 0;
    const content = completion.choices[0].message.content ?? "[]";
    const cleaned = content
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();
    rezepte = JSON.parse(cleaned);
  } catch (e: unknown) {
    console.error("WasKochen AI error:", e);
    const apiError = e as { status?: number; code?: string };
    if (apiError?.status === 429 || apiError?.code === "insufficient_quota") {
      return NextResponse.json(
        {
          error:
            "OpenAI-Kontingent erschöpft. Bitte Konto unter platform.openai.com/settings/billing aufladen.",
        },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { error: "KI-Generierung fehlgeschlagen." },
      { status: 500 }
    );
  }

  if (!Array.isArray(rezepte) || rezepte.length === 0) {
    return NextResponse.json(
      { error: "Keine Rezepte generiert." },
      { status: 500 }
    );
  }

  const result = rezepte.slice(0, 3);

  // Build a readable title from inputs
  const titel = [
    ...(protein.length > 0 ? protein.slice(0, 2) : []),
    ...(staerke.length > 0 ? staerke.slice(0, 1) : []),
  ].join(", ") || "Zutaten-Suche";

  // Save to cache
  await KIVerlauf.create({
    typ: "was-kochen",
    titel,
    eingabe: { protein, staerke, gemuese, zeitMinuten, personen, extra },
    ergebnis: result,
    tokenGeschaetzt: tokenVerbraucht,
    ...(householdId ? { householdId } : { userId }),
  });

  return NextResponse.json({ rezepte: result, tokenVerbraucht });
}

// PUT — save a single generated recipe to Gerichte collection
export async function PUT(req: NextRequest) {
  const { session, error } = await requireSession();
  if (error) return error;

  await connectDB();

  const householdId = (session!.user as { householdId?: string }).householdId;
  const body = await req.json();

  const saved = await Gericht.create({
    name: body.name ?? "Unbekannt",
    kochgeraet: body.kochgeraet ?? "Herd",
    programm: body.programm ?? "",
    leistung: body.leistung ?? "",
    zeit: body.zeit ?? "",
    zeitMinuten:
      typeof body.zeitMinuten === "number" ? body.zeitMinuten : undefined,
    portionen: typeof body.portionen === "number" ? body.portionen : 4,
    schwierigkeit: ["einfach", "mittel", "schwer"].includes(
      body.schwierigkeit ?? ""
    )
      ? (body.schwierigkeit as "einfach" | "mittel" | "schwer")
      : "mittel",
    zutaten: Array.isArray(body.zutaten) ? body.zutaten : [],
    notizen: body.notizen ?? "",
    tags: ["was-kochen", ...(Array.isArray(body.tags) ? body.tags : [])],
    favorit: false,
    gekochtAnzahl: 0,
    ...(householdId ? { householdId } : {}),
  });

  return NextResponse.json({ _id: saved._id.toString() });
}
