import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { connectDB } from "@/lib/db";
import KIVerlauf from "@/models/KIVerlauf";

// GET all saved AI results for this user/household
export async function GET() {
  const { session, error } = await requireSession();
  if (error) return error;

  await connectDB();

  const householdId = (session!.user as { householdId?: string }).householdId;
  const userId = (session!.user as { id?: string }).id;

  const filter = householdId ? { householdId } : { userId };

  const verlauf = await KIVerlauf.find(filter)
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();

  return NextResponse.json(verlauf.map(serialize));
}

// DELETE all AI results for this user/household
export async function DELETE() {
  const { session, error } = await requireSession();
  if (error) return error;

  await connectDB();

  const householdId = (session!.user as { householdId?: string }).householdId;
  const userId = (session!.user as { id?: string }).id;

  const filter = householdId ? { householdId } : { userId };

  const result = await KIVerlauf.deleteMany(filter);

  return NextResponse.json({ geloescht: result.deletedCount });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function serialize(doc: any) {
  return {
    _id: doc._id?.toString(),
    typ: doc.typ,
    titel: doc.titel,
    eingabe: doc.eingabe,
    ergebnis: doc.ergebnis,
    tokenGeschaetzt: doc.tokenGeschaetzt,
    createdAt: doc.createdAt,
  };
}
