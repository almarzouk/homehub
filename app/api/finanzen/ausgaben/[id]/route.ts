import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { requireSession } from "@/lib/api-auth";
import { connectDB } from "@/lib/db";
import Expense from "@/models/Expense";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: RouteParams) {
  const { error } = await requireSession();
  if (error) return error;

  const { id } = await params;
  if (!mongoose.Types.ObjectId.isValid(id)) return NextResponse.json({ error: "Ungültige ID" }, { status: 400 });

  await connectDB();
  const expense = await Expense.findById(id).lean();
  if (!expense) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
  return NextResponse.json(expense);
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { error } = await requireSession();
  if (error) return error;

  const { id } = await params;
  if (!mongoose.Types.ObjectId.isValid(id)) return NextResponse.json({ error: "Ungültige ID" }, { status: 400 });

  await connectDB();
  const body = await request.json();
  const { title, amount, category, type, date, note } = body;

  if (!title || amount == null || !category || !type || !date) {
    return NextResponse.json({ error: "Ungültige Daten" }, { status: 400 });
  }

  const expense = await Expense.findByIdAndUpdate(
    id,
    { title, amount, category, type, date: new Date(date), note, isWarning: type === "unnecessary" },
    { new: true, runValidators: true }
  ).lean();

  if (!expense) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
  return NextResponse.json(expense);
}

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  const { error } = await requireSession();
  if (error) return error;

  const { id } = await params;
  if (!mongoose.Types.ObjectId.isValid(id)) return NextResponse.json({ error: "Ungültige ID" }, { status: 400 });

  await connectDB();
  const expense = await Expense.findByIdAndDelete(id).lean();
  if (!expense) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
  return NextResponse.json({ success: true });
}
