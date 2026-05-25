import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { connectDB } from "@/lib/db";
import mongoose, { Schema, Model } from "mongoose";

// Simple month-keyed plan with custom items
interface ISimpleMonthPlan {
  month: string;
  items: { name: string; betrag: number; kategorie: string }[];
  createdAt: Date;
  updatedAt: Date;
}

const simplePlanSchema = new Schema<ISimpleMonthPlan>(
  {
    month: { type: String, required: true, unique: true },
    items: [{ name: String, betrag: Number, kategorie: String }],
  },
  { timestamps: true }
);

const SimpleMonthPlan: Model<ISimpleMonthPlan> =
  (mongoose.models.SimpleMonthPlan as Model<ISimpleMonthPlan>) ||
  mongoose.model<ISimpleMonthPlan>("SimpleMonthPlan", simplePlanSchema);

export async function GET(request: NextRequest) {
  const { error } = await requireSession();
  if (error) return error;
  const month = new URL(request.url).searchParams.get("month") ?? "";
  await connectDB();
  const plan = await SimpleMonthPlan.findOne({ month }).lean();
  return NextResponse.json(plan ?? null);
}

export async function POST(request: NextRequest) {
  const { error } = await requireSession();
  if (error) return error;
  await connectDB();
  const body = await request.json();
  const { month, items } = body;
  if (!month) return NextResponse.json({ error: "Monat fehlt" }, { status: 400 });
  const plan = await SimpleMonthPlan.findOneAndUpdate(
    { month },
    { month, items: items ?? [] },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  return NextResponse.json(plan);
}
