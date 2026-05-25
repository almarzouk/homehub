import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { connectDB } from "@/lib/db";
import { getCurrentMonth, monthToDateRange } from "@/lib/utils";
import { createUnnecessaryExpenseAlert, runPostExpenseChecks } from "@/lib/alerts";
import Expense from "@/models/Expense";
import { z } from "zod";

const expenseSchema = z.object({
  title: z.string().min(1),
  amount: z.number().int().min(0),
  category: z.string().min(1),
  type: z.enum(["necessary", "unnecessary", "investment"]),
  date: z.string(),
  note: z.string().optional(),
});

export async function GET(request: NextRequest) {
  const { error, session } = await requireSession();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const month = searchParams.get("month");
  const category = searchParams.get("category");
  const type = searchParams.get("type");

  await connectDB();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filter: Record<string, any> = {};
  const householdId = (session!.user as { householdId?: string }).householdId;
  if (householdId) filter.householdId = householdId;

  if (month) {
    const { start, end } = monthToDateRange(month);
    filter.date = { $gte: start, $lte: end };
  }
  if (category && category !== "all") filter.category = category;
  if (type && type !== "all") filter.type = type;

  const expenses = await Expense.find(filter).sort({ date: -1 }).lean();
  return NextResponse.json(expenses);
}

export async function POST(request: NextRequest) {
  const { error, session } = await requireSession();
  if (error) return error;

  try {
    await connectDB();
    const body = await request.json();
    const parsed = expenseSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validierungsfehler", details: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const { title, amount, category, type, date, note } = parsed.data;
    const householdId = (session!.user as { householdId?: string }).householdId;

    const expense = await Expense.create({
      title,
      amount,
      category,
      type,
      date: new Date(date),
      note,
      isWarning: type === "unnecessary",
      ...(householdId ? { householdId } : {}),
    });

    if (type === "unnecessary") {
      await createUnnecessaryExpenseAlert(title, amount);
    }

    await runPostExpenseChecks(category);

    return NextResponse.json(expense, { status: 201 });
  } catch (e) {
    console.error("POST /api/finanzen/ausgaben:", e);
    return NextResponse.json({ error: "Speicherfehler" }, { status: 500 });
  }
}
