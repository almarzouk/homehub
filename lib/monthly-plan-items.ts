import type { ExpenseType } from "@/types";

export type PlanItemId =
  | "rent"
  | "electricity"
  | "phone_bill"
  | "phone_installment"
  | "investment";

export interface PlanItemDefinition {
  id: PlanItemId;
  labelDe: string;
  category: string;
  type: ExpenseType;
  defaultDay: number;
}

export const PLAN_ITEM_DEFINITIONS: PlanItemDefinition[] = [
  { id: "rent", labelDe: "Miete", category: "utilities", type: "necessary", defaultDay: 1 },
  { id: "electricity", labelDe: "Strom", category: "utilities", type: "necessary", defaultDay: 8 },
  { id: "phone_bill", labelDe: "Handyrechnung", category: "utilities", type: "necessary", defaultDay: 5 },
  { id: "phone_installment", labelDe: "Handyrate", category: "other", type: "necessary", defaultDay: 15 },
  { id: "investment", labelDe: "Investition", category: "other", type: "investment", defaultDay: 1 },
];

export interface PlanFixedItem {
  id: PlanItemId;
  amount: number;
  dayOfMonth: number;
  enabled: boolean;
}

export interface EmergencyFundSettings {
  monthlyDeposit: number;
  balance: number;
  dayOfMonth: number;
  enabled: boolean;
}

export function buildDefaultFixedItems(): PlanFixedItem[] {
  return PLAN_ITEM_DEFINITIONS.map((d) => ({
    id: d.id,
    amount: 0,
    dayOfMonth: d.defaultDay,
    enabled: true,
  }));
}

export function buildDefaultEmergencyFund(): EmergencyFundSettings {
  return { monthlyDeposit: 0, balance: 0, dayOfMonth: 1, enabled: true };
}

export function getItemDefinition(id: string) {
  return PLAN_ITEM_DEFINITIONS.find((d) => d.id === id);
}
