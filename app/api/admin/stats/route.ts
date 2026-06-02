import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Household from "@/models/Household";

export async function GET() {
  const { session, error } = await requireSession();
  if (error) return error;

  const caller = session!.user as { role?: string };
  if (caller.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await connectDB();

  const [totalUsers, blockedUsers, adminUsers, newUsersToday, totalHouseholds, pendingApprovals] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ isBlocked: true }),
    User.countDocuments({ role: "admin" }),
    User.countDocuments({ createdAt: { $gte: new Date(Date.now() - 86400000) } }),
    Household.countDocuments(),
    User.countDocuments({ isApproved: false }),
  ]);

  return NextResponse.json({ totalUsers, blockedUsers, adminUsers, newUsersToday, totalHouseholds, pendingApprovals });
}
