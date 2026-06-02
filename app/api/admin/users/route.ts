import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { connectDB } from "@/lib/db";
import User from "@/models/User";

// Helper: ensure caller is admin
async function requireAdmin() {
  const { session, error } = await requireSession();
  if (error) return { error };
  const caller = session!.user as { id?: string; role?: string };
  if (caller.role !== "admin") {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { session };
}

// GET /api/admin/users — list all users
export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  await connectDB();

  const users = await User.find({})
    .select("name email role isBlocked isApproved householdId createdAt aiRequestsThisMonth aiRequestsMonth aiMonthlyLimit")
    .sort({ createdAt: -1 })
    .lean();

  return NextResponse.json(
    users.map((u) => ({
      _id: u._id?.toString(),
      name: u.name,
      email: u.email,
      role: u.role,
      isBlocked: u.isBlocked ?? false,
      isApproved: u.isApproved !== false,
      householdId: u.householdId?.toString() ?? null,
      createdAt: u.createdAt,
      aiMonthlyLimit: u.aiMonthlyLimit ?? 10,
      aiRequestsThisMonth: u.aiRequestsThisMonth ?? 0,
    }))
  );
}

// PATCH /api/admin/users — block/unblock or change role
export async function PATCH(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await req.json();
  const { userId, action, value } = body as {
    userId: string;
    action: "block" | "unblock" | "makeAdmin" | "removeAdmin" | "approve" | "reject" | "resetAI" | "setAILimit";
    value?: number;
  };

  if (!userId || !action) {
    return NextResponse.json({ error: "userId and action required" }, { status: 400 });
  }

  await connectDB();

  if (action === "resetAI") {
    await User.findByIdAndUpdate(userId, { $set: { aiRequestsThisMonth: 0, aiRequestsMonth: "" } });
    return NextResponse.json({ ok: true });
  }

  if (action === "setAILimit") {
    const limit = typeof value === "number" && value >= 0 ? value : 10;
    await User.findByIdAndUpdate(userId, { $set: { aiMonthlyLimit: limit } });
    return NextResponse.json({ ok: true });
  }

  const updateMap: Record<string, object> = {
    block: { isBlocked: true },
    unblock: { isBlocked: false },
    makeAdmin: { role: "admin" },
    removeAdmin: { role: "user" },
    approve: { isApproved: true },
    reject: { isApproved: false },
  };

  if (!updateMap[action]) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  await User.findByIdAndUpdate(userId, { $set: updateMap[action] });
  return NextResponse.json({ ok: true });
}

// DELETE /api/admin/users — delete a user
export async function DELETE(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  await connectDB();
  await User.findByIdAndDelete(userId);
  return NextResponse.json({ ok: true });
}
