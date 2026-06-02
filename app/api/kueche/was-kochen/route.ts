import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { connectDB } from "@/lib/db";
import Gericht from "@/models/Gericht";
import Kochgeraet from "@/models/Kochgeraet";
import KIVerlauf from "@/models/KIVerlauf";
import OpenAI from "openai";
import { checkAILimit, incrementAIUsage } from "@/lib/ai-limit";

interface WasKochenBody {
  protein: string[];
  staerke: string[];
  gemuese: string[];
  zeitMinuten: number;
  personen: number;
  extra?: string;
  kueche?: string;   // e.g. "syrisch", "libanesisch", "italienisch", ...
  sprache?: string;  // user's language code: "de", "ar", "en", "es", "bg"
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
  const { protein, staerke, gemuese, zeitMinuten, personen, extra, kueche, sprache } = body;

  await connectDB();

  const householdId = (session!.user as { householdId?: string }).householdId;
  const userId = (session!.user as { id?: string }).id ?? "";

  // Check AI usage limit before calling OpenAI
  const limitResult = await checkAILimit(userId);
  if (!limitResult.allowed) {
    return NextResponse.json(
      {
        error: `KI-Limit erreicht (${limitResult.used}/${limitResult.limit} Anfragen diesen Monat). Bitte warten Sie bis nächsten Monat oder kontaktieren Sie den Administrator.`,
        limitError: true,
        used: limitResult.used,
        limit: limitResult.limit,
      },
      { status: 429 }
    );
  }

  const kochgeraete = await Kochgeraet.find(householdId ? { householdId } : {})
    .select("name")
    .lean();
  const geraeteNamen =
    kochgeraete.map((k) => k.name).join(", ") || "Herd, Ofen";

  const zutatenListe = [
    protein.length > 0 && `Protein: ${protein.join(", ")}`,
    staerke.length > 0 && `Starchy side: ${staerke.join(", ")}`,
    gemuese.length > 0 && `Vegetables: ${gemuese.join(", ")}`,
    extra && `Other: ${extra}`,
  ]
    .filter(Boolean)
    .join("\n");

  // ── Dynamic language & cuisine ───────────────────────────────────────────
  const cuisineLabel = kueche && kueche !== "beliebig" ? kueche : null;
  const cuisineDesc = cuisineLabel
    ? `traditional ${cuisineLabel} cuisine`
    : "a variety of international cuisines (Mediterranean, Middle Eastern, European, Asian, etc.)";

  const langInstructions: Record<string, string> = {
    de: "Antworte NUR als valides JSON. Alle Texte (name, notizen, zutaten) auf Deutsch.",
    ar: "أجب فقط كـ JSON صالح. جميع النصوص (name, notizen, zutaten) باللغة العربية.",
    en: "Reply ONLY as valid JSON. All text (name, notizen, zutaten) in English.",
    es: "Responde SOLO como JSON válido. Todos los textos (name, notizen, zutaten) en español.",
    bg: "Отговори САМО като валиден JSON. Всички текстове (name, notizen, zutaten) на български.",
  };
  const lang = sprache && langInstructions[sprache] ? sprache : "de";
  const langInstruction = langInstructions[lang];

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const prompt = `You are a culinary expert specializing in ${cuisineDesc}. The user has these ingredients at home:

${zutatenListe}
Available time: ${zeitMinuten} minutes
Portions: ${personen} people
Available appliances: ${geraeteNamen}

Create exactly 3 different recipes (inspired by ${cuisineDesc}) using these ingredients.

${langInstruction}
Reply ONLY as a valid JSON array (no markdown, no backticks):
[
  {
    "name": "Recipe name",
    "kochgeraet": "one of the available appliances",
    "programm": "e.g. Fry",
    "leistung": "e.g. Medium heat",
    "zeit": "e.g. 30 minutes",
    "zeitMinuten": 30,
    "portionen": ${personen},
    "schwierigkeit": "einfach|mittel|schwer",
    "zutaten": ["exact amount and ingredient", "..."],
    "notizen": "Full step-by-step instructions. Min. 150 words.",
    "tags": ["${cuisineLabel ?? "international"}", "..."]
  }
]

Important: Use ONLY the ingredients the user specified. Keep cooking time under ${zeitMinuten} minutes.`;

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

  // Increment AI usage counter after successful generation
  await incrementAIUsage(userId);

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
