import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { connectDB } from "@/lib/db";
import Gericht from "@/models/Gericht";
import Kochgeraet from "@/models/Kochgeraet";
import KIVerlauf from "@/models/KIVerlauf";
import OpenAI from "openai";

// Cache: regenerate only once per week per household
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

function getWeekKey() {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const week = Math.ceil(
    ((now.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7
  );
  return `${now.getFullYear()}-W${week}`;
}

export async function GET() {
  const { session, error } = await requireSession();
  if (error) return error;

  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.startsWith("sk-placeholder")) {
    return NextResponse.json({ error: "OPENAI_API_KEY nicht konfiguriert." }, { status: 503 });
  }

  await connectDB();

  const householdId = (session!.user as { householdId?: string }).householdId;
  const weekKey = getWeekKey();

  // Return cached plan if already generated this week
  const existing = await Gericht.find({
    ...(householdId ? { householdId } : {}),
    tags: { $all: ["ki-vorschlag", weekKey] },
  })
    .sort({ erstelltAm: 1 })
    .limit(7)
    .lean();

  if (existing.length === 7) {
    return NextResponse.json({ weekKey, gerichte: existing.map(serialize) });
  }

  // Generate new plan with OpenAI
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  // Get available cooking devices for context
  const kochgeraete = await Kochgeraet.find(householdId ? { householdId } : {})
    .select("name")
    .lean();
  const geraeteNamen = kochgeraete.map((k) => k.name).join(", ") || "Herd, Ofen";

  const prompt = `Du bist ein syrisch-libanesischer Kochexperte. Erstelle einen Wochenplan mit genau 7 traditionellen syrischen oder libanesischen Gerichten.

Verfügbare Kochgeräte: ${geraeteNamen}

Gib die Antwort als valides JSON-Array zurück (keine Markdown-Codeblöcke, nur reines JSON):
[
  {
    "name": "Gerichtname auf Deutsch (syrisch/libanesisch)",
    "kochgeraet": "eines der verfügbaren Geräte",
    "programm": "z.B. Kochen, Braten, Backen",
    "leistung": "z.B. Mittlere Hitze",
    "zeit": "z.B. 45 Minuten",
    "zeitMinuten": 45,
    "portionen": 4,
    "schwierigkeit": "einfach|mittel|schwer",
    "zutaten": ["500g Hackfleisch", "2 Zwiebeln", "..."],
    "notizen": "Ausführliche Zubereitungsanleitung Schritt für Schritt auf Deutsch. Mindestens 200 Wörter mit allen Details zum Kochen.",
    "tags": ["syrisch", "traditionell"]
  }
]

Wichtig:
- Gerichte müssen authentisch syrisch oder libanesisch sein
- notizen muss eine vollständige Schritt-für-Schritt Anleitung enthalten
- Verschiedene Gerichte für jeden Tag (keine Wiederholungen)
- Beispiele: Kibbeh, Mansaf, Fattoush, Hummus-Teller, Falafel, Musakhan, Maqluba, Tabouleh-Platte, Shawarma, Kabab, Fatteh, Baklava...`;

  let tokenVerbraucht = 0;
  let gerichteData: Array<{
    name: string;
    kochgeraet: string;
    programm?: string;
    leistung?: string;
    zeit?: string;
    zeitMinuten?: number;
    portionen?: number;
    schwierigkeit?: string;
    zutaten?: string[];
    notizen?: string;
    tags?: string[];
  }>;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.8,
      max_tokens: 4000,
    });

    tokenVerbraucht = completion.usage?.total_tokens ?? 0;
    const content = completion.choices[0].message.content ?? "[]";
    // Strip markdown code fences if present
    const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    gerichteData = JSON.parse(cleaned);
  } catch (e: unknown) {
    console.error("OpenAI Wochenplan error:", e);
    const apiError = e as { status?: number; code?: string };
    if (apiError?.status === 429 || apiError?.code === "insufficient_quota") {
      return NextResponse.json(
        { error: "OpenAI-Kontingent erschöpft. Bitte laden Sie Ihr OpenAI-Konto unter platform.openai.com/settings/billing auf." },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: "KI-Generierung fehlgeschlagen. Bitte später versuchen." }, { status: 500 });
  }

  if (!Array.isArray(gerichteData) || gerichteData.length === 0) {
    return NextResponse.json({ error: "Ungültige KI-Antwort." }, { status: 500 });
  }

  // Save first 7 to database
  const toSave = gerichteData.slice(0, 7).map((g) => ({
    name: g.name ?? "Unbekanntes Gericht",
    kochgeraet: g.kochgeraet ?? geraeteNamen.split(",")[0]?.trim() ?? "Herd",
    programm: g.programm ?? "",
    leistung: g.leistung ?? "",
    zeit: g.zeit ?? "",
    zeitMinuten: typeof g.zeitMinuten === "number" ? g.zeitMinuten : undefined,
    portionen: typeof g.portionen === "number" ? g.portionen : 4,
    schwierigkeit: ["einfach", "mittel", "schwer"].includes(g.schwierigkeit ?? "")
      ? (g.schwierigkeit as "einfach" | "mittel" | "schwer")
      : "mittel",
    zutaten: Array.isArray(g.zutaten) ? g.zutaten : [],
    notizen: g.notizen ?? "",
    tags: ["ki-vorschlag", weekKey, ...(Array.isArray(g.tags) ? g.tags : [])],
    favorit: false,
    gekochtAnzahl: 0,
    ...(householdId ? { householdId } : {}),
  }));

  const saved = await Gericht.insertMany(toSave);

  // Save to KI cache log
  const userId = (session!.user as { id?: string }).id;
  await KIVerlauf.create({
    typ: "wochenplan",
    titel: `Wochenplan ${weekKey}`,
    eingabe: { weekKey, geraete: geraeteNamen },
    ergebnis: saved.map(serialize),
    tokenGeschaetzt: tokenVerbraucht,
    ...(householdId ? { householdId } : { userId }),
  });

  return NextResponse.json({
    weekKey,
    gerichte: saved.map(serialize),
    generated: true,
  });
}

// DELETE: remove this week's AI plan so it can be regenerated
export async function DELETE() {
  const { session, error } = await requireSession();
  if (error) return error;

  await connectDB();

  const householdId = (session!.user as { householdId?: string }).householdId;
  const weekKey = getWeekKey();

  await Gericht.deleteMany({
    ...(householdId ? { householdId } : {}),
    tags: { $all: ["ki-vorschlag", weekKey] },
  });

  return NextResponse.json({ ok: true });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function serialize(doc: any) {
  return {
    _id: doc._id?.toString() ?? doc._id,
    name: doc.name,
    kochgeraet: doc.kochgeraet,
    programm: doc.programm ?? "",
    leistung: doc.leistung ?? "",
    zeit: doc.zeit ?? "",
    zeitMinuten: doc.zeitMinuten,
    portionen: doc.portionen,
    schwierigkeit: doc.schwierigkeit,
    zutaten: doc.zutaten ?? [],
    notizen: doc.notizen ?? "",
    tags: doc.tags ?? [],
    favorit: Boolean(doc.favorit),
    gekochtAnzahl: doc.gekochtAnzahl ?? 0,
  };
}
