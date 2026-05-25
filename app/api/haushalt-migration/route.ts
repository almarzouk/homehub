import { NextResponse } from "next/server";
import { getApiSession } from "@/lib/api-auth";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Household from "@/models/Household";

/**
 * POST /api/haushalt-migration
 * Creates a household for the current user if they don't have one.
 * Only needed for existing users who were created before multi-tenancy.
 */
export async function POST() {
  const session = await getApiSession();
  if (!session) return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });

  try {
    await connectDB();

    const user = await User.findById(session.user?.id);
    if (!user) return NextResponse.json({ error: "Benutzer nicht gefunden" }, { status: 404 });

    // Already has household
    if (user.householdId) {
      const household = await Household.findById(user.householdId).lean();
      if (household) {
        return NextResponse.json({ ok: true, inviteCode: household.inviteCode, alreadyExisted: true });
      }
    }

    // Create a new household
    const household = await Household.create({
      name: `${user.name}s Haushalt`,
      ownerId: user._id,
      members: [user._id],
    });

    // Link user to household
    user.householdId = household._id;
    await user.save();

    return NextResponse.json({ ok: true, inviteCode: household.inviteCode, alreadyExisted: false });
  } catch (e) {
    console.error("POST /api/haushalt-migration:", e);
    return NextResponse.json({ error: "Migrationsfehler" }, { status: 500 });
  }
}
