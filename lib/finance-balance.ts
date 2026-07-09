export type BalanceDeductionKey = "ausgaben" | "fixkosten" | "investments" | "sparziele";

export interface BalanceDeductionDefinition {
  key: BalanceDeductionKey;
  labelKey: string;
}

export const BALANCE_DEDUCTION_REGISTRY: BalanceDeductionDefinition[] = [
  { key: "ausgaben", labelKey: "finanzen.expenses" },
  { key: "fixkosten", labelKey: "finanzen.fixkosten" },
  { key: "investments", labelKey: "finanzen.totalInvested" },
  { key: "sparziele", labelKey: "finanzen.savingsDeposits" },
];

export const DEFAULT_BALANCE_DEDUCTIONS: BalanceDeductionKey[] = ["ausgaben", "fixkosten"];

const VALID_KEYS = new Set<string>(BALANCE_DEDUCTION_REGISTRY.map((d) => d.key));

export function isValidBalanceDeductionKey(key: string): key is BalanceDeductionKey {
  return VALID_KEYS.has(key);
}

export function resolveBalanceDeductions(stored?: string[] | null): BalanceDeductionKey[] {
  if (!stored || stored.length === 0) return [...DEFAULT_BALANCE_DEDUCTIONS];
  const filtered = stored.filter(isValidBalanceDeductionKey);
  return filtered.length > 0 ? filtered : [...DEFAULT_BALANCE_DEDUCTIONS];
}

export interface BalanceTotals {
  ausgaben: number;
  fixkosten: number;
  investments: number;
  sparziele: number;
}

export function computeDeductedTotal(totals: BalanceTotals, deductions: BalanceDeductionKey[]): number {
  return deductions.reduce((sum, key) => sum + (totals[key] ?? 0), 0);
}

export function computeRemainingBalance(
  salary: number,
  totals: BalanceTotals,
  deductions: BalanceDeductionKey[]
): number {
  return salary - computeDeductedTotal(totals, deductions);
}

export function sumSavingsDepositsInRange(
  goals: { deposits?: { amount: number; date: Date | string }[] }[],
  start: Date,
  end: Date
): number {
  let total = 0;
  for (const goal of goals) {
    for (const deposit of goal.deposits ?? []) {
      const date = new Date(deposit.date);
      if (date >= start && date <= end) total += deposit.amount;
    }
  }
  return total;
}
