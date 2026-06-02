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

// GET /api/admin/households/[id] — full details of one household
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;

  await connectDB();

  const hh = await Household.findById(id).lean();
  if (!hh) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Resolve all member user docs
  const memberIds = hh.members ?? [];
  const memberDocs = await User.find({ _id: { $in: memberIds } })
    .select("_id name email role isBlocked isApproved createdAt")
    .lean();

  const ownerDoc = await User.findById(hh.ownerId).select("_id name email").lean();
  const coAdminIds = (hh.coAdmins ?? []).map((id) => id.toString());

  const members = memberDocs.map((u) => ({
    _id: u._id.toString(),
    name: u.name,
    email: u.email,
    role: u.role,
    isBlocked: u.isBlocked ?? false,
    isApproved: u.isApproved !== false,
    isOwner: hh.ownerId.toString() === u._id.toString(),
    isCoAdmin: coAdminIds.includes(u._id.toString()),
    createdAt: u.createdAt,
  }));

  return NextResponse.json({
    _id: hh._id?.toString(),
    name: hh.name,
    inviteCode: hh.inviteCode,
    createdAt: hh.createdAt,
    owner: ownerDoc
      ? { _id: ownerDoc._id.toString(), name: ownerDoc.name, email: ownerDoc.email }
      : null,
    memberCount: memberIds.length,
    coAdminCount: coAdminIds.length,
    enabledModules: hh.enabledModules ?? [],
    members,
  });
}
