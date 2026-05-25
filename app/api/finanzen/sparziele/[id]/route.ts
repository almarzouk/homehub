import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { requireSession } from "@/lib/api-auth";
import { connectDB } from "@/lib/db";
import SavingsGoal from "@/models/SavingsGoal";

type RouteParams = { params: Promise<{ id: string }> };

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  const { error } = await requireSession();
  if (error) return error;
  const { id } = await params;
  if (!mongoose.Types.ObjectId.isValid(id)) return NextResponse.json({ error: "Ungültige ID" }, { status: 400 });
  await connectDB();
  const goal = await SavingsGoal.findByIdAndDelete(id);
  if (!goal) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
  return NextResponse.json({ success: true });
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { error } = await requireSession();
  if (error) return error;
  const { id } = await params;
  if (!mongoose.Types.ObjectId.isValid(id)) return NextResponse.json({ error: "Ungültige ID" }, { status: 400 });
  await connectDB();
  const body = await request.json();
  const { name, targetAmount, currentAmount, deadline, note } = body;
  const goal = await SavingsGoal.findByIdAndUpdate(id, {
    $set: { name, targetAmount, currentBalance: currentAmount, deadline: deadline ? new Date(deadline) : undefined, note }
  }, { new: true });
  if (!goal) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
  return NextResponse.json(goal);
}
