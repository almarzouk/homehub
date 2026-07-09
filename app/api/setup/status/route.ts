import { NextResponse } from "next/server";
import { getApiSession } from "@/lib/api-auth";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Household from "@/models/Household";
import Category from "@/models/Category";
import Fixkosten from "@/models/Fixkosten";
import SalaryConfig from "@/models/SalaryConfig";
import { getCurrentMonth } from "@/lib/utils";

/** GET /api/setup/status — fresh onboarding state from DB (not stale JWT) */
export async function GET() {
  const session = await getApiSession();
  if (!session) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  await connectDB();
  const userId = session.user?.id ?? "";
  const user = await User.findById(userId).lean();
  if (!user) {
    return NextResponse.json({ error: "Benutzer nicht gefunden" }, { status: 404 });
  }

  const householdId = user.householdId ? String(user.householdId) : null;
  let householdReady = false;

  if (householdId) {
    const hh = await Household.findById(householdId).lean();
    const hFilter = { householdId: user.householdId };
    const [categoryCount, fixkostenCount, salary] = await Promise.all([
      Category.countDocuments(hFilter),
      Fixkosten.countDocuments(hFilter),
      SalaryConfig.findOne({ month: getCurrentMonth() }).lean(),
    ]);
    householdReady = !!(
      hh?.name &&
      (
        (hh.enabledModules && hh.enabledModules.length > 0) ||
        categoryCount > 0 ||
        fixkostenCount > 0 ||
        (salary?.amount && salary.amount > 0)
      )
    );
  }

  return NextResponse.json({
    onboardingCompleted: user.onboardingCompleted === true,
    householdReady,
    shouldSkipSetup: user.onboardingCompleted === true || householdReady,
  });
}
