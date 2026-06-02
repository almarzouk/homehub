import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { connectDB } from "@/lib/db";
import KIVerlauf from "@/models/KIVerlauf";

// DELETE a single entry by ID
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await requireSession();
  if (error) return error;

  await connectDB();

  const { id } = await params;
  const householdId = (session!.user as { householdId?: string }).householdId;
  const userId = (session!.user as { id?: string }).id;

  const filter = householdId
    ? { _id: id, householdId }
    : { _id: id, userId };

  const result = await KIVerlauf.deleteOne(filter);

  if (result.deletedCount === 0) {
    return NextResponse.json({ error: "Nicht gefunden." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
