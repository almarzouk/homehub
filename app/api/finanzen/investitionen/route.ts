import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { connectDB } from "@/lib/db";
import Investment from "@/models/Investment";

export async function GET() {
  const { error, session } = await requireSession();
  if (error) return error;

  await connectDB();
  const householdId = (session!.user as { householdId?: string }).householdId;
  const filter = householdId ? { householdId } : {};
  const investments = await Investment.find(filter).sort({ createdAt: -1 }).lean();
  return NextResponse.json(investments);
}

export async function POST(request: NextRequest) {
  const { error, session } = await requireSession();
  if (error) return error;

  try {
    await connectDB();
    const body = await request.json();
    const { title, amount, currentValue, type, startDate, note, ticker, shares, assetId } = body;

    if (!title || amount == null || !type || !startDate) {
      return NextResponse.json({ error: "Ungültige Daten" }, { status: 400 });
    }

    const householdId = (session!.user as { householdId?: string }).householdId;
    const investment = await Investment.create({
      title,
      amount,
      currentValue: currentValue ?? amount,
      type,
      startDate: new Date(startDate),
      note,
      ticker: ticker || undefined,
      shares: shares != null ? shares : undefined,
      assetId: assetId || undefined,
      ...(householdId ? { householdId } : {}),
    });

    return NextResponse.json(investment, { status: 201 });
  } catch (e) {
    console.error("POST /api/finanzen/investitionen:", e);
    return NextResponse.json({ error: "Speicherfehler" }, { status: 500 });
  }
}
