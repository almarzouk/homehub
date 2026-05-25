import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { getApiSession } from "@/lib/api-auth";
import User from "@/models/User";
import Household from "@/models/Household";
import Category from "@/models/Category";
import Location from "@/models/Location";
import Product from "@/models/Product";
import Movement from "@/models/Movement";
import Kochgeraet from "@/models/Kochgeraet";
import Gericht from "@/models/Gericht";
import SalaryConfig from "@/models/SalaryConfig";
import MonthlyPlan from "@/models/MonthlyPlan";
import Expense from "@/models/Expense";
import Investment from "@/models/Investment";
import SavingsGoal from "@/models/SavingsGoal";

// ─────────────────────────────────────────────────────────────────────────────
// VORRAT — aus homestock-app
// ─────────────────────────────────────────────────────────────────────────────

const KATEGORIEN = [
  { name: "Milchprodukte",          color: "#60a5fa" },
  { name: "Fleisch & Wurst",        color: "#f87171" },
  { name: "Obst & Gemüse",          color: "#4ade80" },
  { name: "Brot & Backwaren",       color: "#fbbf24" },
  { name: "Tiefkühlprodukte",       color: "#38bdf8" },
  { name: "Getränke",               color: "#34d399" },
  { name: "Konserven",              color: "#fb923c" },
  { name: "Nudeln & Reis",          color: "#facc15" },
  { name: "Süßwaren & Snacks",      color: "#f472b6" },
  { name: "Gewürze & Saucen",       color: "#a78bfa" },
  { name: "Öl & Fett",              color: "#d97706" },
  { name: "Backzutaten",            color: "#fde68a" },
  { name: "Frühstück & Cerealien",  color: "#86efac" },
  { name: "Hygiene & Pflege",       color: "#67e8f9" },
  { name: "Reinigungsmittel",       color: "#818cf8" },
  { name: "Körperpflege",           color: "#fb7185" },
  { name: "Babyprodukte",           color: "#bbf7d0" },
  { name: "Tierbedarf",             color: "#d4a574" },
  { name: "Haushaltsartikel",       color: "#94a3b8" },
  { name: "Sonstiges",              color: "#cbd5e1" },
];

const LAGERORTE = [
  { name: "Küche",              icon: "restaurant-outline", color: "#f59e0b" },
  { name: "Kühlschrank",        icon: "snow-outline",        color: "#60a5fa" },
  { name: "Tiefkühlschrank",    icon: "cube-outline",        color: "#38bdf8" },
  { name: "Vorratsschrank",     icon: "archive-outline",     color: "#a78bfa" },
  { name: "Lager",              icon: "cube-outline",        color: "#6b7280" },
  { name: "Keller",             icon: "home-outline",        color: "#78716c" },
  { name: "Badezimmer",         icon: "water-outline",       color: "#34d399" },
  { name: "Garage",             icon: "car-outline",         color: "#94a3b8" },
];

// Beispielprodukte (werden nach Seed der Kategorien & Lagerorte eingefügt)
type ProductUnit = "piece" | "kg" | "g" | "liter" | "ml" | "box" | "pack";
type SampleProduct = {
  name: string; quantity: number; unit: ProductUnit; minQuantity: number;
  kategorie: string; lagerort: string; notizen?: string;
  ablaufdatum?: Date; barcode?: string;
};

const BEISPIELPRODUKTE: SampleProduct[] = [
  { name: "Vollmilch",            quantity: 2,   unit: "liter",  minQuantity: 1,  kategorie: "Milchprodukte",         lagerort: "Kühlschrank",     barcode: "4001461202426" },
  { name: "Joghurt natur",        quantity: 4,   unit: "piece",  minQuantity: 2,  kategorie: "Milchprodukte",         lagerort: "Kühlschrank"      },
  { name: "Butter",               quantity: 1,   unit: "pack",   minQuantity: 1,  kategorie: "Milchprodukte",         lagerort: "Kühlschrank"      },
  { name: "Käse Gouda",           quantity: 200, unit: "g",      minQuantity: 100,kategorie: "Milchprodukte",         lagerort: "Kühlschrank"      },
  { name: "Hähnchenbrust",        quantity: 500, unit: "g",      minQuantity: 0,  kategorie: "Fleisch & Wurst",       lagerort: "Kühlschrank",     ablaufdatum: new Date(Date.now() + 2 * 86400000) },
  { name: "Hackfleisch gemischt", quantity: 400, unit: "g",      minQuantity: 0,  kategorie: "Fleisch & Wurst",       lagerort: "Tiefkühlschrank"  },
  { name: "Äpfel",                quantity: 6,   unit: "piece",  minQuantity: 3,  kategorie: "Obst & Gemüse",         lagerort: "Küche"            },
  { name: "Bananen",              quantity: 5,   unit: "piece",  minQuantity: 3,  kategorie: "Obst & Gemüse",         lagerort: "Küche"            },
  { name: "Tomaten",              quantity: 4,   unit: "piece",  minQuantity: 2,  kategorie: "Obst & Gemüse",         lagerort: "Küche"            },
  { name: "Kartoffeln",           quantity: 1,   unit: "kg",     minQuantity: 1,  kategorie: "Obst & Gemüse",         lagerort: "Vorratsschrank"   },
  { name: "Zwiebeln",             quantity: 5,   unit: "piece",  minQuantity: 2,  kategorie: "Obst & Gemüse",         lagerort: "Vorratsschrank"   },
  { name: "Toastbrot",            quantity: 1,   unit: "pack",   minQuantity: 1,  kategorie: "Brot & Backwaren",      lagerort: "Küche"            },
  { name: "Brötchen",             quantity: 6,   unit: "piece",  minQuantity: 0,  kategorie: "Brot & Backwaren",      lagerort: "Küche"            },
  { name: "Tiefkühlpizza",        quantity: 2,   unit: "piece",  minQuantity: 1,  kategorie: "Tiefkühlprodukte",      lagerort: "Tiefkühlschrank"  },
  { name: "Pommes Frites",        quantity: 1,   unit: "pack",   minQuantity: 0,  kategorie: "Tiefkühlprodukte",      lagerort: "Tiefkühlschrank"  },
  { name: "Mineralwasser",        quantity: 6,   unit: "liter",  minQuantity: 3,  kategorie: "Getränke",              lagerort: "Lager"            },
  { name: "Orangensaft",          quantity: 1,   unit: "liter",  minQuantity: 1,  kategorie: "Getränke",              lagerort: "Kühlschrank"      },
  { name: "Kaffee",               quantity: 250, unit: "g",      minQuantity: 100,kategorie: "Getränke",              lagerort: "Vorratsschrank"   },
  { name: "Tomaten in Dose",      quantity: 3,   unit: "piece",  minQuantity: 2,  kategorie: "Konserven",             lagerort: "Vorratsschrank"   },
  { name: "Thunfisch in Dose",    quantity: 4,   unit: "piece",  minQuantity: 2,  kategorie: "Konserven",             lagerort: "Vorratsschrank"   },
  { name: "Spaghetti",            quantity: 2,   unit: "pack",   minQuantity: 1,  kategorie: "Nudeln & Reis",         lagerort: "Vorratsschrank"   },
  { name: "Basmati Reis",         quantity: 1,   unit: "kg",     minQuantity: 1,  kategorie: "Nudeln & Reis",         lagerort: "Vorratsschrank"   },
  { name: "Schokolade 70%",       quantity: 2,   unit: "piece",  minQuantity: 1,  kategorie: "Süßwaren & Snacks",     lagerort: "Vorratsschrank"   },
  { name: "Chips Paprika",        quantity: 1,   unit: "pack",   minQuantity: 0,  kategorie: "Süßwaren & Snacks",     lagerort: "Küche"            },
  { name: "Salz",                 quantity: 500, unit: "g",      minQuantity: 100,kategorie: "Gewürze & Saucen",      lagerort: "Küche"            },
  { name: "Pfeffer",              quantity: 50,  unit: "g",      minQuantity: 20, kategorie: "Gewürze & Saucen",      lagerort: "Küche"            },
  { name: "Paprikapulver",        quantity: 50,  unit: "g",      minQuantity: 20, kategorie: "Gewürze & Saucen",      lagerort: "Küche"            },
  { name: "Ketchup",              quantity: 1,   unit: "piece",  minQuantity: 1,  kategorie: "Gewürze & Saucen",      lagerort: "Kühlschrank"      },
  { name: "Sonnenblumenöl",       quantity: 1,   unit: "liter",  minQuantity: 1,  kategorie: "Öl & Fett",             lagerort: "Vorratsschrank"   },
  { name: "Olivenöl",             quantity: 500, unit: "ml",     minQuantity: 200,kategorie: "Öl & Fett",             lagerort: "Küche"            },
  { name: "Mehl Type 405",        quantity: 1,   unit: "kg",     minQuantity: 500,kategorie: "Backzutaten",            lagerort: "Vorratsschrank",  notizen: "Für Brot und Kuchen" },
  { name: "Zucker",               quantity: 500, unit: "g",      minQuantity: 200,kategorie: "Backzutaten",            lagerort: "Vorratsschrank"   },
  { name: "Backpulver",           quantity: 1,   unit: "pack",   minQuantity: 1,  kategorie: "Backzutaten",            lagerort: "Vorratsschrank"   },
  { name: "Haferflocken",         quantity: 500, unit: "g",      minQuantity: 200,kategorie: "Frühstück & Cerealien", lagerort: "Vorratsschrank"   },
  { name: "Müsli",                quantity: 500, unit: "g",      minQuantity: 200,kategorie: "Frühstück & Cerealien", lagerort: "Vorratsschrank"   },
  { name: "Shampoo",              quantity: 1,   unit: "piece",  minQuantity: 1,  kategorie: "Körperpflege",           lagerort: "Badezimmer"       },
  { name: "Zahnpasta",            quantity: 2,   unit: "piece",  minQuantity: 1,  kategorie: "Hygiene & Pflege",       lagerort: "Badezimmer"       },
  { name: "Spülmittel",           quantity: 2,   unit: "piece",  minQuantity: 1,  kategorie: "Reinigungsmittel",       lagerort: "Küche"            },
  { name: "Allzweckreiniger",     quantity: 1,   unit: "piece",  minQuantity: 1,  kategorie: "Reinigungsmittel",       lagerort: "Küche"            },
  { name: "Papiertücher",         quantity: 4,   unit: "pack",   minQuantity: 2,  kategorie: "Haushaltsartikel",       lagerort: "Lager"            },
];

// ─────────────────────────────────────────────────────────────────────────────
// KUECHE — aus kuch app
// ─────────────────────────────────────────────────────────────────────────────

const KOCHGERAETE = [
  { name: "Schnellkochtopf", programme: ["Druck", "Dampf", "Kochen", "Anbraten"],     leistungen: ["Niedrig", "Medium", "Hoch"],                        icon: "pressure",    hintergrund: "#FFF3E0", rand: "#FF8C00" },
  { name: "Kochtopf",        programme: ["Kochen", "Dämpfen", "Blanchieren"],         leistungen: ["Niedrig", "Medium", "Hoch"],                        icon: "cooking-pot", hintergrund: "#E8F5E9", rand: "#2E7D32" },
  { name: "Mikrowelle",      programme: ["Backen", "Auftauen", "Erwärmen", "Grillen", "Popcorn", "Dampf"], leistungen: ["Niedrig", "Medium", "Hoch", "800W", "900W", "1000W"], icon: "microwave", hintergrund: "#E3F2FD", rand: "#1565C0" },
  { name: "Backofen",        programme: ["Backen", "Grillen", "Umluft", "Oberhitze", "Unterhitze"], leistungen: ["150°C", "180°C", "190°C", "200°C", "220°C"],       icon: "flame",       hintergrund: "#FCE4EC", rand: "#C62828" },
  { name: "Gasofen",         programme: ["Backen", "Grillen", "Umluft", "Oberhitze", "Unterhitze", "Pizza"], leistungen: ["150°C", "180°C", "190°C", "200°C", "220°C", "250°C"], icon: "flame",   hintergrund: "#FFF8E1", rand: "#F57F17" },
  { name: "Pfanne",          programme: ["Braten", "Anbraten", "Schmoren"],           leistungen: ["Niedrig", "Medium", "Hoch"],                        icon: "cooking-pot", hintergrund: "#F3E5F5", rand: "#6A1B9A" },
  { name: "Grill",           programme: ["Grillen", "Direkt", "Indirekt", "Räuchern"],leistungen: ["Niedrig", "Medium", "Hoch"],                        icon: "flame",       hintergrund: "#FBE9E7", rand: "#BF360C" },
];

const GERICHTE = [
  {
    name: "Gefüllte Paprika",
    kochgeraet: "Schnellkochtopf", programm: "Druck", leistung: "Hoch",
    zeit: "15 Minuten", zeitMinuten: 15, schwierigkeit: "mittel" as const,
    zutaten: ["Paprika", "Hackfleisch", "Reis", "Tomaten", "Zwiebeln", "Knoblauch", "Paprikapulver", "Salz", "Pfeffer"],
    tags: ["gemüse", "hauptgericht", "traditionell"], portionen: 4,
    notizen: "Paprika oben abschneiden, aushöhlen, füllen und 15 Min. unter Druck garen.",
    favorit: true,
  },
  {
    name: "Mais gekocht",
    kochgeraet: "Schnellkochtopf", programm: "Druck", leistung: "Medium",
    zeit: "10 Minuten", zeitMinuten: 10, schwierigkeit: "einfach" as const,
    zutaten: ["Maiskolben", "Salz", "Butter"],
    tags: ["beilage", "schnell", "vegetarisch"], portionen: 2,
    notizen: "Wasser mit Salz aufkochen, Mais hinzugeben, 10 Min. unter Druck.",
  },
  {
    name: "Kokosnussbällchen",
    kochgeraet: "Mikrowelle", programm: "Backen", leistung: "190°C",
    zeit: "25 Minuten", zeitMinuten: 25, schwierigkeit: "mittel" as const,
    zutaten: ["Kokosflocken", "Kondensmilch", "Vanille", "Zucker"],
    tags: ["süß", "dessert", "schnell"], portionen: 20,
    notizen: "Alle Zutaten mischen, kleine Bällchen formen, 25 Min. im Backofen backen.",
  },
  {
    name: "Weinblätter gefüllt",
    kochgeraet: "Kochtopf", programm: "Kochen", leistung: "Niedrig",
    zeit: "50 Minuten", zeitMinuten: 50, schwierigkeit: "schwer" as const,
    zutaten: ["Weinblätter", "Reis", "Hackfleisch", "Petersilie", "Zitrone", "Olivenöl", "Salz", "Pfeffer", "Kurkuma"],
    tags: ["traditionell", "arabisch", "hauptgericht"], portionen: 6,
    notizen: "Weinblätter kurz in heißem Wasser weichen. Füllung zubereiten, einrollen, und 50 Min. bei niedriger Hitze köcheln.",
    favorit: true,
  },
  {
    name: "Hähnchen mit Reis",
    kochgeraet: "Schnellkochtopf", programm: "Druck", leistung: "Hoch",
    zeit: "30 Minuten", zeitMinuten: 30, schwierigkeit: "mittel" as const,
    zutaten: ["Hähnchen", "Basmati Reis", "Zwiebeln", "Kardamom", "Zimt", "Lorbeer", "Salz", "Pfeffer"],
    tags: ["hauptgericht", "arabisch", "reis"], portionen: 4,
    notizen: "Hähnchen anbraten, Gewürze hinzufügen, Reis dazu und 30 Min. unter Druck garen.",
    favorit: true,
  },
  {
    name: "Spaghetti Bolognese",
    kochgeraet: "Kochtopf", programm: "Köcheln", leistung: "Medium",
    zeit: "40 Minuten", zeitMinuten: 40, schwierigkeit: "einfach" as const,
    zutaten: ["Spaghetti", "Hackfleisch", "Tomaten", "Zwiebeln", "Knoblauch", "Olivenöl", "Oregano", "Salz", "Pfeffer"],
    tags: ["pasta", "hauptgericht", "schnell"], portionen: 4,
    notizen: "Bolognese-Sauce 30 Min. köcheln lassen, Spaghetti al dente kochen.",
  },
  {
    name: "Ofenkartoffeln",
    kochgeraet: "Backofen", programm: "Backen", leistung: "200°C",
    zeit: "45 Minuten", zeitMinuten: 45, schwierigkeit: "einfach" as const,
    zutaten: ["Kartoffeln", "Olivenöl", "Rosmarin", "Knoblauch", "Salz", "Pfeffer"],
    tags: ["beilage", "vegetarisch", "ofen"], portionen: 4,
    notizen: "Kartoffeln würfeln, würzen, 45 Min. bei 200°C backen.",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// FINANZEN — aus finance-os
// ─────────────────────────────────────────────────────────────────────────────

const USER_SALARY      = 260000; // €2.600
const USER_RENT        =  97500; // €975
const USER_ELECTRICITY =   5700; // €57
const USER_PHONE       =   6500; // €65
const USER_INVESTMENT  =  70000; // €700
const USER_SAVINGS     =  20000; // €200

function getCurrentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// SEED HANDLER
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  // Admin-only: only the seeded admin account or NODE_ENV=development may run this
  if (process.env.NODE_ENV === "production") {
    const session = await getApiSession();
    if (!session) return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
    const role = (session.user as { role?: string }).role;
    if (role !== "admin") return NextResponse.json({ error: "Nur Admins" }, { status: 403 });
  }

  try {
    const force = new URL(request.url).searchParams.get("force") === "true";
    await connectDB();

    const report: Record<string, unknown> = {};

    // ── 1. Benutzer (Admin) + Haushalt ───────────────────────────────────
    const email = "jumaa.almarzouk@gmail.com";
    const password = "Pass321@";
    const existingUser = await User.findOne({ email }).lean();
    let adminUserId: import("mongoose").Types.ObjectId | undefined;

    if (force || !existingUser) {
      // Preserve householdId if user already exists
      const existingHouseholdId = existingUser?.householdId;
      await User.deleteOne({ email });
      const hashed = await bcrypt.hash(password, 12);
      const newUser = await User.create({
        name: "Jumaa Al-Marzouk", email, password: hashed, role: "admin",
        householdId: existingHouseholdId,
      });
      adminUserId = newUser._id as import("mongoose").Types.ObjectId;
      report.benutzer = "erstellt";
    } else {
      adminUserId = existingUser._id as import("mongoose").Types.ObjectId;
      report.benutzer = "bereits vorhanden";
    }

    // Ensure admin has a household
    const adminUser = await User.findById(adminUserId).lean();
    if (!adminUser?.householdId) {
      // Create a household for the admin
      const hh = await Household.create({
        name: "Jumaa Al-Marzouk",
        ownerId: adminUserId,
        members: [adminUserId],
      });
      await User.findByIdAndUpdate(adminUserId, { householdId: hh._id });
      report.haushalt = "erstellt";
    } else {
      // Ensure admin is in the household members list
      await Household.updateOne(
        { _id: adminUser.householdId, members: { $ne: adminUserId } },
        { $push: { members: adminUserId } }
      );
      report.haushalt = "vorhanden";
    }

    // ── 2. Vorrat: Kategorien ──────────────────────────────────────────────
    let katNeu = 0, katVorhanden = 0;
    for (const k of KATEGORIEN) {
      const exists = await Category.findOne({ name: k.name });
      if (!exists) { await Category.create(k); katNeu++; }
      else katVorhanden++;
    }
    report.kategorien = `${katNeu} neu, ${katVorhanden} vorhanden`;

    // ── 3. Vorrat: Lagerorte ───────────────────────────────────────────────
    let locNeu = 0, locVorhanden = 0;
    const lagerortMap: Record<string, string> = {};
    for (const l of LAGERORTE) {
      let doc = await Location.findOne({ name: l.name });
      if (!doc) { doc = await Location.create(l); locNeu++; }
      else locVorhanden++;
      lagerortMap[l.name] = String(doc._id);
    }
    report.lagerorte = `${locNeu} neu, ${locVorhanden} vorhanden`;

    // ── 4. Vorrat: Produkte ────────────────────────────────────────────────
    const katMap: Record<string, string> = {};
    const allKats = await Category.find({}).lean();
    allKats.forEach((c: { name: string; _id: unknown }) => { katMap[c.name] = String(c._id); });

    const allLocs = await Location.find({}).lean();
    const locMap: Record<string, string> = {};
    allLocs.forEach((l: { name: string; _id: unknown }) => { locMap[l.name] = String(l._id); });

    let prodNeu = 0, prodVorhanden = 0;
    for (const p of BEISPIELPRODUKTE) {
      const exists = await Product.findOne({ name: p.name });
      if (exists && !force) { prodVorhanden++; continue; }
      if (exists && force) await Product.deleteOne({ name: p.name });

      await Product.create({
        name:          p.name,
        barcode:       p.barcode,
        categoryId:    katMap[p.kategorie] ?? undefined,
        quantity:      p.quantity,
        unit:          p.unit,
        minQuantity:   p.minQuantity,
        location:      locMap[p.lagerort] ?? undefined,
        expiryDate:    p.ablaufdatum,
        notes:         p.notizen,
        inShoppingList: false,
      });
      prodNeu++;
    }
    report.produkte = `${prodNeu} neu, ${prodVorhanden} vorhanden`;

    // ── 5. Kueche: Kochgeräte ──────────────────────────────────────────────
    let geraetNeu = 0, geraetVorhanden = 0;
    for (const g of KOCHGERAETE) {
      const exists = await Kochgeraet.findOne({ name: g.name } as Record<string, unknown>);
      if (!exists) { await Kochgeraet.create(g); geraetNeu++; }
      else geraetVorhanden++;
    }
    report.kochgeraete = `${geraetNeu} neu, ${geraetVorhanden} vorhanden`;

    // ── 6. Kueche: Gerichte ────────────────────────────────────────────────
    let gerichtNeu = 0, gerichtVorhanden = 0;
    for (const g of GERICHTE) {
      const exists = await Gericht.findOne({ name: g.name });
      if (exists && !force) { gerichtVorhanden++; continue; }
      if (exists && force) await Gericht.deleteOne({ name: g.name });
      await Gericht.create({ ...g, gekochtAnzahl: 0, zuletztGekocht: null });
      gerichtNeu++;
    }
    report.gerichte = `${gerichtNeu} neu, ${gerichtVorhanden} vorhanden`;

    // ── 7. Finanzen: Gehaltsconfig ─────────────────────────────────────────
    const month = getCurrentMonth();
    const [year, mo] = month.split("-").map(Number);

    const salaryExists = await SalaryConfig.findOne({ month });
    if (!salaryExists || force) {
      await SalaryConfig.findOneAndUpdate(
        { month },
        {
          amount: USER_SALARY, currency: "EUR", month,
          allocations: [
            { label: "Miete",         amount: USER_RENT,        category: "fixed"      },
            { label: "Strom",         amount: USER_ELECTRICITY, category: "fixed"      },
            { label: "Handy",         amount: USER_PHONE,       category: "fixed"      },
            { label: "ETF-Sparplan",  amount: USER_INVESTMENT,  category: "investment" },
            { label: "Notfallfonds",  amount: USER_SAVINGS,     category: "savings"    },
          ],
        },
        { upsert: true }
      );
      report.gehalt = "konfiguriert";
    } else {
      report.gehalt = "bereits vorhanden";
    }

    // ── 8. Finanzen: Monatsplan ────────────────────────────────────────────
    const planExists = await MonthlyPlan.findOne({});
    if (!planExists || force) {
      if (force) await MonthlyPlan.deleteMany({});
      await MonthlyPlan.create({
        isActive: true,
        salaryAmount: USER_SALARY,
        currency: "EUR",
        fixedItems: [
          { id: "rent",              amount: USER_RENT,        dayOfMonth: 1,  enabled: true  },
          { id: "electricity",       amount: USER_ELECTRICITY, dayOfMonth: 8,  enabled: true  },
          { id: "phone_bill",        amount: USER_PHONE,       dayOfMonth: 5,  enabled: true  },
          { id: "phone_installment", amount: 0,                dayOfMonth: 15, enabled: false },
          { id: "investment",        amount: USER_INVESTMENT,  dayOfMonth: 1,  enabled: true  },
        ],
        emergencyFund: { monthlyDeposit: USER_SAVINGS, balance: 0, dayOfMonth: 1, enabled: true },
        allocations: [],
        recurringExpenses: [],
        lastExecutedMonth: month,
      });
      report.monatsplan = "erstellt";
    } else {
      report.monatsplan = "bereits vorhanden";
    }

    // ── 9. Finanzen: Ausgaben (Demo) ───────────────────────────────────────
    const expenseCount = await Expense.countDocuments({ date: { $gte: new Date(year, mo - 1, 1), $lt: new Date(year, mo, 1) } });
    if (expenseCount === 0 || force) {
      if (force) await Expense.deleteMany({ date: { $gte: new Date(year, mo - 1, 1), $lt: new Date(year, mo, 1) } });
      const demoAusgaben = [
        { title: "Supermarkt",        amount: 8500,            category: "lebensmittel", type: "necessary"   as const, day: 3  },
        { title: "ÖPNV Monatsticket", amount: 4900,            category: "transport",    type: "necessary"   as const, day: 1  },
        { title: "Netflix",           amount: 1599,            category: "unterhaltung", type: "unnecessary" as const, day: 12 },
        { title: "Strom",             amount: USER_ELECTRICITY,category: "nebenkosten",  type: "necessary"   as const, day: 8  },
        { title: "Restaurant",        amount: 3200,            category: "essen",        type: "unnecessary" as const, day: 15 },
        { title: "Miete",             amount: USER_RENT,       category: "nebenkosten",  type: "necessary"   as const, day: 1  },
        { title: "Handyrechnung",     amount: USER_PHONE,      category: "nebenkosten",  type: "necessary"   as const, day: 5  },
        { title: "Drogerie",          amount: 2800,            category: "haushalt",     type: "necessary"   as const, day: 10 },
        { title: "Online Shopping",   amount: 5500,            category: "sonstiges",    type: "unnecessary" as const, day: 18 },
      ];
      for (const e of demoAusgaben) {
        await Expense.create({ title: e.title, amount: e.amount, category: e.category, type: e.type, date: new Date(year, mo - 1, e.day), isWarning: e.type === "unnecessary" });
      }
      report.ausgaben = `${demoAusgaben.length} Demo-Ausgaben erstellt`;
    } else {
      report.ausgaben = `${expenseCount} Ausgaben bereits vorhanden`;
    }

    // ── 10. Finanzen: Investment ───────────────────────────────────────────
    const invExists = await Investment.findOne({ title: "msci_world" });
    if (!invExists || force) {
      if (force && invExists) await Investment.deleteOne({ title: "msci_world" });
      await Investment.create({
        title: "msci_world",
        amount: USER_INVESTMENT,
        currentValue: USER_INVESTMENT,
        type: "ETF",
        startDate: new Date(year, mo - 1, 1),
        note: "Monatlicher ETF-Sparplan (MSCI World)",
        ticker: "IWDA",
        shares: 2.5,
        priceEur: 28000,
      });
      report.investment = "erstellt";
    } else {
      report.investment = "bereits vorhanden";
    }

    // ── 11. Finanzen: Sparziel ─────────────────────────────────────────────
    const goalExists = await SavingsGoal.findOne({ isPrimary: true });
    if (!goalExists || force) {
      if (force && goalExists) await SavingsGoal.deleteOne({ isPrimary: true });
      await SavingsGoal.create({
        name: "Notfallfonds",
        emoji: "🛡️",
        targetAmount: 500000, // €5.000
        currentBalance: 0,
        monthlyDeposit: USER_SAVINGS,
        currency: "EUR",
        isPrimary: true,
        isActive: true,
        color: "amber",
      });
      report.sparziel = "Notfallfonds erstellt (Ziel: €5.000)";
    } else {
      report.sparziel = "bereits vorhanden";
    }

    // ── 12. Bewegungen (Demo) ──────────────────────────────────────────────
    const movCount = await Movement.countDocuments();
    if (movCount === 0 || force) {
      if (force) await Movement.deleteMany({});

      // Bestehende Produkte laden um realistische Bewegungen zu erstellen
      const products = await Product.find({}).limit(15).lean();
      const demoMovements: { productId: unknown; type: "IN"|"OUT"|"ADJUST"; quantity: number; previousQuantity: number; newQuantity: number; note?: string; createdAt: Date }[] = [];

      const daysAgo = (d: number) => new Date(Date.now() - d * 86400000);

      // Je Produkt 2-3 Bewegungen simulieren
      const movDefs: { nameMatch: string; type: "IN"|"OUT"|"ADJUST"; qty: number; note: string; daysBack: number }[] = [
        { nameMatch: "Vollmilch",         type: "IN",     qty: 2,   note: "Wocheneinkauf",     daysBack: 14 },
        { nameMatch: "Vollmilch",         type: "OUT",    qty: 1,   note: "",                  daysBack: 7  },
        { nameMatch: "Spaghetti",         type: "IN",     qty: 3,   note: "Supermarkt",        daysBack: 20 },
        { nameMatch: "Spaghetti",         type: "OUT",    qty: 1,   note: "Abendessen",        daysBack: 10 },
        { nameMatch: "Basmati Reis",      type: "IN",     qty: 2,   note: "Großeinkauf",       daysBack: 25 },
        { nameMatch: "Basmati Reis",      type: "OUT",    qty: 1,   note: "Hähnchen mit Reis", daysBack: 5  },
        { nameMatch: "Olivenöl",          type: "IN",     qty: 500, note: "Neuer Vorrat",      daysBack: 30 },
        { nameMatch: "Olivenöl",          type: "OUT",    qty: 100, note: "Kochen",            daysBack: 15 },
        { nameMatch: "Tomaten in Dose",   type: "IN",     qty: 6,   note: "Wocheneinkauf",     daysBack: 18 },
        { nameMatch: "Tomaten in Dose",   type: "OUT",    qty: 2,   note: "Bolognese",         daysBack: 8  },
        { nameMatch: "Hähnchenbrust",     type: "IN",     qty: 600, note: "Frisch gekauft",    daysBack: 3  },
        { nameMatch: "Mineralwasser",     type: "IN",     qty: 12,  note: "Wocheneinkauf",     daysBack: 12 },
        { nameMatch: "Mineralwasser",     type: "OUT",    qty: 6,   note: "Verbraucht",        daysBack: 4  },
        { nameMatch: "Haferflocken",      type: "IN",     qty: 500, note: "Supermarkt",        daysBack: 22 },
        { nameMatch: "Haferflocken",      type: "OUT",    qty: 200, note: "Frühstück",         daysBack: 6  },
        { nameMatch: "Zucker",            type: "IN",     qty: 1000,note: "Neukauf",           daysBack: 40 },
        { nameMatch: "Zucker",            type: "OUT",    qty: 200, note: "Backen",            daysBack: 20 },
        { nameMatch: "Zucker",            type: "ADJUST", qty: 300, note: "Inventur",          daysBack: 2  },
        { nameMatch: "Mehl Type 405",     type: "IN",     qty: 1000,note: "Großeinkauf",       daysBack: 35 },
        { nameMatch: "Mehl Type 405",     type: "OUT",    qty: 250, note: "Brot gebacken",     daysBack: 10 },
        { nameMatch: "Butter",            type: "IN",     qty: 2,   note: "Einkauf",           daysBack: 9  },
        { nameMatch: "Butter",            type: "OUT",    qty: 1,   note: "Verbraucht",        daysBack: 3  },
        { nameMatch: "Joghurt natur",     type: "IN",     qty: 4,   note: "Wocheneinkauf",     daysBack: 7  },
        { nameMatch: "Kaffee",            type: "IN",     qty: 500, note: "Neukauf",           daysBack: 16 },
        { nameMatch: "Kaffee",            type: "OUT",    qty: 125, note: "Verbraucht",        daysBack: 3  },
      ];

      for (const def of movDefs) {
        const prod = products.find((p) => (p as { name: string }).name.includes(def.nameMatch.split(" ")[0]));
        if (!prod) continue;
        const prevQty = (prod as { quantity: number }).quantity;
        demoMovements.push({
          productId: (prod as { _id: unknown })._id,
          type: def.type,
          quantity: def.qty,
          previousQuantity: prevQty,
          newQuantity: def.type === "IN" ? prevQty + def.qty : def.type === "OUT" ? Math.max(0, prevQty - def.qty) : def.qty,
          note: def.note || undefined,
          createdAt: daysAgo(def.daysBack),
        });
      }

      if (demoMovements.length > 0) await Movement.insertMany(demoMovements);
      report.bewegungen = `${demoMovements.length} Demo-Bewegungen erstellt`;
    } else {
      report.bewegungen = `${movCount} Bewegungen bereits vorhanden`;
    }

    // ── 13. Einkaufsliste ──────────────────────────────────────────────────
    const shoppingCount = await Product.countDocuments({ inShoppingList: true });
    if (shoppingCount === 0 || force) {
      // Einige Produkte auf die Einkaufsliste setzen (niedrige Bestände oder manuell)
      const shoppingItems = [
        "Vollmilch", "Joghurt natur", "Butter", "Toastbrot", "Äpfel",
        "Mineralwasser", "Kaffee", "Tomaten", "Hähnchenbrust",
      ];
      let listCount = 0;
      for (const name of shoppingItems) {
        const updated = await Product.updateOne(
          { name: { $regex: name.split(" ")[0], $options: "i" } },
          { $set: { inShoppingList: true } }
        );
        if (updated.matchedCount > 0) listCount++;
      }
      report.einkaufsliste = `${listCount} Produkte auf die Einkaufsliste gesetzt`;
    } else {
      report.einkaufsliste = `${shoppingCount} Artikel bereits in der Einkaufsliste`;
    }

    return NextResponse.json({
      erfolg: true,
      nachricht: "Seed abgeschlossen! Alle Daten wurden in die Datenbank eingefügt.",
      details: report,
    });
  } catch (error) {
    console.error("[Seed] Fehler:", error);
    return NextResponse.json(
      { erfolg: false, fehler: error instanceof Error ? error.message : "Unbekannter Fehler" },
      { status: 500 }
    );
  }
}

export async function GET() {
  await connectDB();
  const [users, kategorien, lagerorte, produkte, kochgeraete, gerichte, ausgaben, investitionen, sparziele, bewegungen, einkaufsliste] = await Promise.all([
    User.countDocuments(),
    Category.countDocuments(),
    Location.countDocuments(),
    Product.countDocuments(),
    Kochgeraet.countDocuments(),
    Gericht.countDocuments(),
    Expense.countDocuments(),
    Investment.countDocuments(),
    SavingsGoal.countDocuments(),
    Movement.countDocuments(),
    Product.countDocuments({ inShoppingList: true }),
  ]);
  return NextResponse.json({
    status: "bereit",
    datenbank: { users, kategorien, lagerorte, produkte, kochgeraete, gerichte, ausgaben, investitionen, sparziele, bewegungen, einkaufsliste },
    anleitung: "POST /api/seed — Seed ausführen | POST /api/seed?force=true — Seed erzwingen (überschreibt vorhandene Daten)",
  });
}
