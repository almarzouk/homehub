import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { getApiSession } from "@/lib/api-auth";
import { connectDB } from "@/lib/db";
import Expense from "@/models/Expense";

export async function GET(request: NextRequest) {
  const session = await getApiSession();
  if (!session) return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });

  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const monate = Math.min(12, Math.max(1, parseInt(searchParams.get("monate") ?? "6", 10)));

    const jetzt = new Date();
    const startDate = new Date(jetzt.getFullYear(), jetzt.getMonth() - (monate - 1), 1);
    const householdId = (session.user as { householdId?: string }).householdId;
    const hFilter = householdId ? { householdId: new Types.ObjectId(householdId) } : {};

    // Single aggregation instead of N sequential queries
    const agg = await Expense.aggregate([
      { $match: { ...hFilter, date: { $gte: startDate } } },
      {
        $group: {
          _id: { year: { $year: "$date" }, month: { $month: "$date" }, category: "$category" },
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
    ]);

    // Build monthly buckets from aggregation result
    const ergebnis = [];
    for (let i = monate - 1; i >= 0; i--) {
      const d = new Date(jetzt.getFullYear(), jetzt.getMonth() - i, 1);
      const y = d.getFullYear();
      const m = d.getMonth() + 1;
      const rows = agg.filter((r) => r._id.year === y && r._id.month === m);
      const gesamt = rows.reduce((s, r) => s + r.total, 0);
      const anzahl = rows.reduce((s, r) => s + r.count, 0);
      const nachKategorie: Record<string, number> = {};
      for (const r of rows) nachKategorie[r._id.category ?? "Sonstiges"] = r.total;
      ergebnis.push({
        monat: d.toLocaleDateString("de-DE", { month: "short", year: "2-digit" }),
        datum: d.toISOString(),
        gesamt,
        anzahl,
        kategorien: nachKategorie,
      });
    }

    const letzterMonat = ergebnis[ergebnis.length - 1]?.gesamt ?? 0;
    const vorherigMonat = ergebnis[ergebnis.length - 2]?.gesamt ?? 0;
    const trend = vorherigMonat > 0 ? ((letzterMonat - vorherigMonat) / vorherigMonat) * 100 : 0;

    return NextResponse.json({ monate: ergebnis, trend: Math.round(trend) });
  } catch (e) {
    console.error("GET /api/finanzen/charts:", e);
    return NextResponse.json({ error: "Ladefehler" }, { status: 500 });
  }
}
