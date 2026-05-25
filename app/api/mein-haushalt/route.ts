import { NextResponse } from "next/server";
import { getApiSession } from "@/lib/api-auth";
import { connectDB } from "@/lib/db";
import Household from "@/models/Household";
import User from "@/models/User";

export async function GET() {
  const session = await getApiSession();
  if (!session) return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });

  try {
    await connectDB();
    const householdId = (session.user as { householdId?: string }).householdId;
    if (!householdId) return NextResponse.json({ household: null });

    const household = await Household.findById(householdId).lean();
    if (!household) return NextResponse.json({ household: null });

    const members = await User.find(
      { _id: { $in: household.members } },
      { name: 1, email: 1 }
    ).lean();

    return NextResponse.json({
      household: {
        _id: String(household._id),
        name: household.name,
        inviteCode: household.inviteCode,
        memberCount: household.members.length,
        members: members.map((m) => ({ _id: String(m._id), name: m.name, email: m.email })),
      },
    });
  } catch (e) {
    console.error("GET /api/mein-haushalt:", e);
    return NextResponse.json({ error: "Ladefehler" }, { status: 500 });
  }
}
