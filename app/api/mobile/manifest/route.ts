import { NextResponse } from "next/server";
import { getApiSession } from "@/lib/api-auth";
import { connectDB } from "@/lib/db";
import Household from "@/models/Household";
import User from "@/models/User";
import { getUserPermissions } from "@/lib/permissions";
import {
  MODULE_REGISTRY,
  DEFAULT_TABS,
  DEFAULT_MEHR,
  ModuleKey,
} from "@/lib/modules";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

/**
 * GET /api/mobile/manifest
 *
 * Returns the full server-driven configuration for the mobile app:
 * - Which modules are visible/editable for this user
 * - Ordered tab + Mehr lists (visibility-filtered)
 * - Household info
 * - Banners (for future use)
 * - Feature flags (for future use)
 *
 * Cache: 60s max-age with ETag so mobile can poll cheaply.
 */
export async function GET() {
  const session = await getApiSession();
  if (!session) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401, headers: CORS });
  }

  const userId = session.user?.id ?? "";
  const householdId = (session.user as { householdId?: string } | undefined)?.householdId;

  try {
    await connectDB();

    // ── Resolve permissions ──────────────────────────────────────────────────
    let perms: Partial<Record<ModuleKey, { view: boolean; edit: boolean }>> = {};
    let householdName = "";
    let isOwner = false;

    if (householdId) {
      perms = await getUserPermissions(userId, householdId);
      const hh = await Household.findById(householdId).lean();
      if (hh) {
        householdName = hh.name;
        isOwner =
          String(hh.ownerId) === userId ||
          (hh.coAdmins ?? []).some((id) => String(id) === userId);
      }
    } else {
      // No household yet — grant full access so user can set up
      for (const m of MODULE_REGISTRY) {
        perms[m.key] = { view: true, edit: true };
      }
      isOwner = true;
    }

    // ── Fetch user name ──────────────────────────────────────────────────────
    const userDoc = await User.findById(userId).lean().catch(() => null);
    const userName = (userDoc as { name?: string } | null)?.name ??
      (session.user?.email ?? "").split("@")[0] ?? "";

    // ── Build module list ────────────────────────────────────────────────────
    const modules = MODULE_REGISTRY.map((m) => ({
      key: m.key,
      label: m.label_de,
      icon: m.icon,
      color: m.color,
      group: m.group,
      view: perms[m.key]?.view ?? false,
      edit: perms[m.key]?.edit ?? false,
    }));

    // ── Filter tabs and Mehr to only visible modules ─────────────────────────
    const visibleKeys = new Set(
      modules.filter((m) => m.view).map((m) => m.key)
    );

    const tabs = DEFAULT_TABS.filter((k) => visibleKeys.has(k));
    const mehrItems = DEFAULT_MEHR.filter((k) => visibleKeys.has(k));

    // Always include "Mehr" tab if there are any Mehr items
    // (the "Mehr" tab itself is not a module — it's the hub)

    const manifest = {
      version: 1,
      generatedAt: new Date().toISOString(),
      user: {
        id: userId,
        name: userName,
        email: session.user?.email ?? "",
        role: (session.user as { role?: string } | undefined)?.role ?? "user",
        householdId: householdId ?? null,
        isOwner,
      },
      household: householdId
        ? { id: householdId, name: householdName }
        : null,
      modules,
      tabs,
      mehrItems,
      banners: [] as unknown[],        // populated in a future phase
      featureFlags: {                   // extend as needed
        betaScanner: false,
      },
    };

    const body = JSON.stringify(manifest);
    const etag = `"${Buffer.from(body).length}-${Date.now()}"`;

    return new NextResponse(body, {
      status: 200,
      headers: {
        ...CORS,
        "Content-Type": "application/json",
        "Cache-Control": "private, max-age=60, stale-while-revalidate=30",
        ETag: etag,
      },
    });
  } catch (e) {
    console.error("GET /api/mobile/manifest:", e);
    return NextResponse.json({ error: "Serverfehler" }, { status: 500, headers: CORS });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}
