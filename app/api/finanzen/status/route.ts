import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { connectDB } from "@/lib/db";
import { getCurrentMonth } from "@/lib/utils";
import User from "@/models/User";
import SalaryConfig from "@/models/SalaryConfig";
import Fixkosten from "@/models/Fixkosten";
import SavingsGoal from "@/models/SavingsGoal";
import { requireFinanzenAccess } from "@/lib/permissions";

/** GET /api/finanzen/status — whether finance onboarding is needed */
export async function GET() {
  const { error, session } = await requireSession();
  if (error) return error;
  const denied = await requireFinanzenAccess(session!, "view");
  if (denied) return denied;

  await connectDB();
  const userId = session!.user!.id;
  const householdId = (session!.user as { householdId?: string }).householdId;
  const hFilter = householdId ? { householdId } : {};

  const [user, salary, fixkostenCount, savingsCount] = await Promise.all([
    User.findById(userId).select("finanzenSetupSkipped").lean(),
    SalaryConfig.findOne({ month: getCurrentMonth() }).lean(),
    Fixkosten.countDocuments({ ...hFilter, aktiv: true }),
    SavingsGoal.countDocuments({ ...hFilter, isActive: true }),
  ]);

  const configured = !!(salary?.amount) || fixkostenCount > 0 || savingsCount > 0;
  const skipped = !!(user as { finanzenSetupSkipped?: boolean } | null)?.finanzenSetupSkipped;

  return NextResponse.json({
    configured,
    skipped,
    needsSetup: !configured && !skipped,
  });
}

/** POST /api/finanzen/status — mark finance setup as dismissed */
export async function POST() {
  const { error, session } = await requireSession();
  if (error) return error;
  const denied = await requireFinanzenAccess(session!, "edit");
  if (denied) return denied;

  await connectDB();
  await User.findByIdAndUpdate(session!.user!.id, { finanzenSetupSkipped: true });
  return NextResponse.json({ ok: true });
}
