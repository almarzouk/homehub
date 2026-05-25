import { Types } from "mongoose";
import Household from "@/models/Household";
import { MODULE_REGISTRY, ModuleKey, isValidModuleKey } from "./modules";

export interface ModulePermission {
  view: boolean;
  edit: boolean;
}

export type PermissionMap = Partial<Record<ModuleKey, ModulePermission>>;

/**
 * Resolve the full permission map for a user in a household.
 *
 * Rules:
 * - ownerId and coAdmins → view+edit for everything.
 * - Other members → stored per-user permissions, falling back to module defaults.
 * - Disabled modules (not in enabledModules) → view:false, edit:false.
 * - If enabledModules is empty → all modules are enabled.
 */
export async function getUserPermissions(
  userId: string,
  householdId: string
): Promise<PermissionMap> {
  const household = await Household.findById(householdId).lean();
  if (!household) return {};

  const isOwner =
    String(household.ownerId) === userId ||
    (household.coAdmins ?? []).some(
      (id: Types.ObjectId) => String(id) === userId
    );

  const enabledKeys: string[] =
    household.enabledModules && household.enabledModules.length > 0
      ? household.enabledModules
      : MODULE_REGISTRY.map((m) => m.key);

  const allMemberPerms = (household.memberPermissions ?? {}) as Record<
    string,
    Record<string, ModulePermission>
  >;
  const userPerms = allMemberPerms[userId] ?? {};

  const result: PermissionMap = {};

  for (const mod of MODULE_REGISTRY) {
    if (!enabledKeys.includes(mod.key)) {
      result[mod.key] = { view: false, edit: false };
      continue;
    }
    if (isOwner) {
      result[mod.key] = { view: true, edit: true };
    } else {
      result[mod.key] = userPerms[mod.key] ?? {
        view: mod.defaultViewForMembers,
        edit: mod.defaultEditForMembers,
      };
    }
  }

  return result;
}

export function can(
  perms: PermissionMap,
  moduleKey: string,
  action: "view" | "edit"
): boolean {
  if (!isValidModuleKey(moduleKey)) return false;
  return perms[moduleKey]?.[action] === true;
}

/**
 * Call inside an API route after resolving perms to get a 403 Response if denied.
 * Returns null when access is allowed.
 */
export function denyResponse(
  perms: PermissionMap,
  moduleKey: string,
  action: "view" | "edit"
): Response | null {
  if (!can(perms, moduleKey, action)) {
    return new Response(
      JSON.stringify({ error: "Keine Berechtigung für dieses Modul" }),
      { status: 403, headers: { "Content-Type": "application/json" } }
    );
  }
  return null;
}
