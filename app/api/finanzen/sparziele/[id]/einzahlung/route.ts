import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { requireSession } from "@/lib/api-auth";
import { connectDB } from "@/lib/db";
import SavingsGoal from "@/models/SavingsGoal";
import { requireFinanzenAccess } from "@/lib/permissions";

type RouteParams = { params: Promise<{ id: string }> };

/**
 * POST /api/finanzen/sparziele/[id]/einzahlung
 * Quick deposit into a savings box — no need to edit the whole plan.
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { error, session } = await requireSession();
  if (error) return error;
  const denied = await requireFinanzenAccess(session!, "edit");
  if (denied) return denied;

  const { id } = await params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Ungültige ID" }, { status: 400 });
  }

  const body = await request.json();
  const { amount, note } = body as { amount: number; note?: string };

  if (!amount || amount <= 0) {
    return NextResponse.json({ error: "Betrag muss größer als 0 sein" }, { status: 400 });
  }

  await connectDB();

  const goal = await SavingsGoal.findByIdAndUpdate(
    id,
    {
      $inc: { currentBalance: amount },
      $push: {
        deposits: {
          amount,
          note: note || undefined,
          date: new Date(),
        },
      },
    },
    { new: true }
  );

  if (!goal) {
    return NextResponse.json({ error: "Sparbox nicht gefunden" }, { status: 404 });
  }

  return NextResponse.json({
    _id: goal._id,
    name: goal.name,
    emoji: goal.emoji,
    targetAmount: goal.targetAmount,
    currentAmount: goal.currentBalance,
    currentBalance: goal.currentBalance,
    deposits: goal.deposits,
  });
}
