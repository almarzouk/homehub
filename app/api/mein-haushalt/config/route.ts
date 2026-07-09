import { NextResponse } from "next/server";
import { getApiSession } from "@/lib/api-auth";
import { connectDB } from "@/lib/db";
import Household from "@/models/Household";
import { getUserPermissions } from "@/lib/permissions";
import { MODULE_REGISTRY } from "@/lib/modules";
import { FINANZ_SECTION_REGISTRY } from "@/lib/finanzen-sections";

/**
 * GET /api/mein-haushalt/config
 * Returns enabled modules + finance sections for the current user (permission-filtered).
 */
export async function GET() {
  const session = await getApiSession();
  if (!session) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  const userId = session.user?.id ?? "";
  const householdId = (session.user as { householdId?: string } | undefined)?.householdId;

  await connectDB();

  let enabledModules: string[] = MODULE_REGISTRY.map((m) => m.key);
  let enabledFinanzSections: string[] = FINANZ_SECTION_REGISTRY.map((s) => s.key);
  let permissions: Record<string, { view: boolean; edit: boolean }> = {};

  if (householdId) {
    const hh = await Household.findById(householdId).lean();
    if (hh) {
      if (hh.enabledModules && hh.enabledModules.length > 0) {
        enabledModules = hh.enabledModules;
      }
      if (hh.enabledFinanzSections && hh.enabledFinanzSections.length > 0) {
        enabledFinanzSections = hh.enabledFinanzSections;
      }
    }
    const perms = await getUserPermissions(userId, householdId);
    for (const [key, val] of Object.entries(perms)) {
      permissions[key] = val;
    }
    // Filter modules by view permission
    enabledModules = enabledModules.filter((k) => perms[k as keyof typeof perms]?.view !== false);
  } else {
    for (const m of MODULE_REGISTRY) {
      permissions[m.key] = { view: true, edit: true };
    }
  }

  return NextResponse.json({
    enabledModules,
    enabledFinanzSections,
    permissions,
  });
}
