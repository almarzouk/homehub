import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Household from "@/models/Household";

async function requireAdmin() {
  const { session, error } = await requireSession();
  if (error) return { error };
  const caller = session!.user as { role?: string };
  if (caller.role !== "admin") {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { session };
}

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const households = await Household.find({})
    .select("name ownerId members inviteCode createdAt")
    .sort({ createdAt: -1 })
    .lean();

  // Resolve owner names
  const ownerIds = households.map((h) => h.ownerId?.toString()).filter(Boolean);
  const owners = await User.find({ _id: { $in: ownerIds } })
    .select("_id name")
    .lean();
  const ownerMap = new Map(owners.map((o) => [o._id.toString(), o.name]));

  return NextResponse.json(
    households.map((h) => ({
      _id: h._id?.toString(),
      name: h.name,
      ownerName: ownerMap.get(h.ownerId?.toString() ?? "") ?? "—",
      memberCount: h.members?.length ?? 0,
      inviteCode: h.inviteCode,
      createdAt: h.createdAt,
    }))
  );
}

// DELETE /api/admin/households?householdId=xxx — delete a household
export async function DELETE(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const householdId = searchParams.get("householdId");

  if (!householdId) {
    return NextResponse.json({ error: "householdId required" }, { status: 400 });
  }

  await connectDB();
  await Household.findByIdAndDelete(householdId);
  // Remove householdId from all members of that household
  await User.updateMany({ householdId }, { $unset: { householdId: "" } });

  return NextResponse.json({ ok: true });
}
