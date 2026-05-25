import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { requireSession } from "@/lib/api-auth";
import { connectDB } from "@/lib/db";
import SavingsGoal from "@/models/SavingsGoal";

export async function GET() {
  const { error, session } = await requireSession();
  if (error) return error;
  await connectDB();
  const householdId = (session!.user as { householdId?: string }).householdId;
  const filter = householdId ? { householdId } : {};
  const goals = await SavingsGoal.find(filter).sort({ createdAt: -1 }).lean();
  return NextResponse.json(goals);
}

export async function POST(request: NextRequest) {
  const { error, session } = await requireSession();
  if (error) return error;
  await connectDB();
  const body = await request.json();
  const { name, targetAmount, currentAmount = 0, deadline, note } = body;
  if (!name || targetAmount == null) return NextResponse.json({ error: "Name und Zielbetrag sind Pflicht" }, { status: 400 });
  const householdId = (session!.user as { householdId?: string }).householdId;
  const goal = await SavingsGoal.create({
    name,
    emoji: "🎯",
    targetAmount,
    currentBalance: currentAmount,
    monthlyDeposit: 0,
    deadline: deadline ? new Date(deadline) : undefined,
    note,
    ...(householdId ? { householdId } : {}),
  });
  return NextResponse.json(goal, { status: 201 });
}
