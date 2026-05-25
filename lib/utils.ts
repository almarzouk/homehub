import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function toCents(amount: number): number {
  return Math.round(amount * 100);
}

export function fromCents(cents: number): number {
  return cents / 100;
}

export function getCurrentMonth(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

export function formatCurrency(cents: number, currency = "EUR"): string {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency,
  }).format(fromCents(cents));
}

export function calculateProfit(amount: number, currentValue: number) {
  const profit = currentValue - amount;
  const percentage = amount > 0 ? (profit / amount) * 100 : 0;
  return { profit, percentage };
}

export function monthToDateRange(month: string): { start: Date; end: Date } {
  const [year, m] = month.split("-").map(Number);
  const start = new Date(year, m - 1, 1);
  const end = new Date(year, m, 0, 23, 59, 59, 999);
  return { start, end };
}

export function getLastMonths(count: number, from = new Date()): string[] {
  const months: string[] = [];
  const d = new Date(from.getFullYear(), from.getMonth(), 1);
  for (let i = count - 1; i >= 0; i--) {
    const temp = new Date(d.getFullYear(), d.getMonth() - i, 1);
    months.push(getCurrentMonth(temp));
  }
  return months;
}

export function parseDisplayAmount(value: string): number {
  const parsed = parseFloat(value.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
}
