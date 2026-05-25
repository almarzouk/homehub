import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { connectDB } from "@/lib/db";
import { getCurrentMonth } from "@/lib/utils";
import SalaryConfig from "@/models/SalaryConfig";

export async function GET(request: NextRequest) {
  const { error } = await requireSession();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const month = searchParams.get("month") ?? getCurrentMonth();

  await connectDB();
  const config = await SalaryConfig.findOne({ month }).lean();
  return NextResponse.json(config ?? null);
}

export async function POST(request: NextRequest) {
  const { error } = await requireSession();
  if (error) return error;

  try {
    await connectDB();
    const body = await request.json();
    const { amount, currency = "EUR", month, allocations } = body;

    if (!amount || !month || !Array.isArray(allocations)) {
      return NextResponse.json({ error: "Ungültige Daten" }, { status: 400 });
    }

    const config = await SalaryConfig.findOneAndUpdate(
      { month },
      { amount, currency, month, allocations },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean();

    return NextResponse.json(config);
  } catch (e) {
    console.error("POST /api/finanzen/gehalt:", e);
    return NextResponse.json({ error: "Speicherfehler" }, { status: 500 });
  }
}
