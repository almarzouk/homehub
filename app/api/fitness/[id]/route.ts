import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { connectDB } from "@/lib/db";
import FitnessEintrag from "@/models/FitnessEintrag";

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, session } = await requireSession();
  if (error) return error;

  const { id } = await params;
  await connectDB();
  const householdId = (session!.user as { householdId?: string }).householdId;
  await FitnessEintrag.findOneAndDelete({ _id: id, householdId });
  return NextResponse.json({ ok: true });
}
