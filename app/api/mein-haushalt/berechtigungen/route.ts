import { NextRequest, NextResponse } from "next/server";
import { getApiSession } from "@/lib/api-auth";
import { connectDB } from "@/lib/db";
import Household from "@/models/Household";
import { isValidModuleKey, MODULE_REGISTRY } from "@/lib/modules";

/**
 * GET /api/mein-haushalt/berechtigungen
 * Returns the full memberPermissions + enabledModules + coAdmins for the admin UI.
 * Only the household owner / co-admins can access this.
 */
export async function GET() {
  const session = await getApiSession();
  if (!session) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  await connectDB();
  const userId = session.user?.id ?? "";
  const householdId = (session.user as { householdId?: string } | undefined)?.householdId;
  if (!householdId) {
    return NextResponse.json({ error: "Kein Haushalt" }, { status: 400 });
  }

  const hh = await Household.findById(householdId).lean();
  if (!hh) return NextResponse.json({ error: "Haushalt nicht gefunden" }, { status: 404 });

  const isAdmin =
    String(hh.ownerId) === userId ||
    (hh.coAdmins ?? []).some((id) => String(id) === userId);

  if (!isAdmin) {
    return NextResponse.json({ error: "Nur Admins können Berechtigungen sehen" }, { status: 403 });
  }

  return NextResponse.json({
    memberPermissions: hh.memberPermissions ?? {},
    enabledModules: hh.enabledModules ?? [],
    coAdmins: (hh.coAdmins ?? []).map(String),
    ownerId: String(hh.ownerId),
  });
}

/**
 * PUT /api/mein-haushalt/berechtigungen
 *
 * Body variants:
 *
 * 1. Update a single member's module permissions:
 *    { type: "member", userId: string, permissions: { [moduleKey]: { view, edit } } }
 *
 * 2. Update household-wide enabled modules:
 *    { type: "modules", enabledModules: string[] }
 *
 * 3. Promote/demote a co-admin:
 *    { type: "coadmin", userId: string, isCoAdmin: boolean }
 */
export async function PUT(req: NextRequest) {
  const session = await getApiSession();
  if (!session) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  await connectDB();
  const userId = session.user?.id ?? "";
  const householdId = (session.user as { householdId?: string } | undefined)?.householdId;
  if (!householdId) {
    return NextResponse.json({ error: "Kein Haushalt" }, { status: 400 });
  }

  const hh = await Household.findById(householdId);
  if (!hh) return NextResponse.json({ error: "Haushalt nicht gefunden" }, { status: 404 });

  const isAdmin =
    String(hh.ownerId) === userId ||
    (hh.coAdmins ?? []).some((id) => String(id) === userId);

  if (!isAdmin) {
    return NextResponse.json({ error: "Nur Admins können Berechtigungen ändern" }, { status: 403 });
  }

  const body = await req.json();
  const { type } = body;

  if (type === "member") {
    const { userId: targetId, permissions } = body as {
      userId: string;
      permissions: Record<string, { view: boolean; edit: boolean }>;
    };

    if (!targetId || typeof permissions !== "object") {
      return NextResponse.json({ error: "Ungültige Daten" }, { status: 400 });
    }

    // Prevent modifying the owner
    if (String(hh.ownerId) === targetId) {
      return NextResponse.json({ error: "Berechtigungen des Besitzers können nicht geändert werden" }, { status: 400 });
    }

    // Validate module keys
    const sanitized: Record<string, { view: boolean; edit: boolean }> = {};
    for (const [key, val] of Object.entries(permissions)) {
      if (isValidModuleKey(key) && typeof val?.view === "boolean" && typeof val?.edit === "boolean") {
        sanitized[key] = { view: val.view, edit: val.edit };
      }
    }

    const existing = (hh.memberPermissions ?? {}) as Record<string, Record<string, { view: boolean; edit: boolean }>>;
    existing[targetId] = sanitized;
    hh.set("memberPermissions", existing);
    hh.markModified("memberPermissions");
    await hh.save();

    return NextResponse.json({ success: true });
  }

  if (type === "modules") {
    const { enabledModules } = body as { enabledModules: string[] };
    if (!Array.isArray(enabledModules)) {
      return NextResponse.json({ error: "enabledModules muss ein Array sein" }, { status: 400 });
    }

    const allKeys = MODULE_REGISTRY.map((m) => m.key);
    const filtered = enabledModules.filter((k) => allKeys.includes(k as never));
    hh.enabledModules = filtered;
    await hh.save();

    return NextResponse.json({ success: true });
  }

  if (type === "coadmin") {
    const { userId: targetId, isCoAdmin } = body as { userId: string; isCoAdmin: boolean };
    if (!targetId) return NextResponse.json({ error: "userId fehlt" }, { status: 400 });

    // Only owner can promote/demote co-admins
    if (String(hh.ownerId) !== userId) {
      return NextResponse.json({ error: "Nur der Besitzer kann Admins ernennen" }, { status: 403 });
    }

    const coAdmins = (hh.coAdmins ?? []).map(String);
    if (isCoAdmin && !coAdmins.includes(targetId)) {
      hh.coAdmins.push(targetId as unknown as import("mongoose").Types.ObjectId);
    } else if (!isCoAdmin) {
      hh.coAdmins = hh.coAdmins.filter((id) => String(id) !== targetId) as typeof hh.coAdmins;
    }
    await hh.save();

    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Unbekannter Typ" }, { status: 400 });
}
