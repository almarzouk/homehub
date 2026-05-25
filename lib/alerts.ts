import FinanzAlert from "@/models/FinanzAlert";
import Expense from "@/models/Expense";
import SalaryConfig from "@/models/SalaryConfig";
import Investment from "@/models/Investment";
import { getCurrentMonth, monthToDateRange } from "@/lib/utils";
import type { AlertType } from "@/types";

export async function createAlert(data: {
  title: string;
  message: string;
  type: AlertType;
  category: string;
}) {
  return FinanzAlert.create(data);
}

export async function createUnnecessaryExpenseAlert(title: string, amountCents: number) {
  return createAlert({
    title: "Unnötige Ausgabe",
    message: `Unnötige Ausgabe hinzugefügt: ${title} (${(amountCents / 100).toFixed(2)} €)`,
    type: "warning",
    category: "expense",
  });
}

export async function checkCategoryBudgetExceeded(category: string, month?: string) {
  const currentMonth = month ?? getCurrentMonth();
  const salary = await SalaryConfig.findOne({ month: currentMonth });
  if (!salary) return;

  const allocation = salary.allocations.find(
    (a) => a.label.toLowerCase() === category.toLowerCase() || a.category === category
  );
  if (!allocation) return;

  const { start, end } = monthToDateRange(currentMonth);
  const expenses = await Expense.aggregate([
    { $match: { category, date: { $gte: start, $lte: end } } },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);

  const spent = expenses[0]?.total ?? 0;
  if (spent > allocation.amount) {
    const existing = await FinanzAlert.findOne({ category: `budget-${category}-${currentMonth}`, isRead: false });
    if (!existing) {
      await createAlert({
        title: "Budget überschritten",
        message: `Kategorie "${category}" hat das zugewiesene Budget für ${currentMonth} überschritten`,
        type: "danger",
        category: `budget-${category}-${currentMonth}`,
      });
    }
  }
}

export async function checkLowBalance(month?: string) {
  const currentMonth = month ?? getCurrentMonth();
  const salary = await SalaryConfig.findOne({ month: currentMonth });
  if (!salary) return;

  const { start, end } = monthToDateRange(currentMonth);
  const [expenseAgg, investments] = await Promise.all([
    Expense.aggregate([
      { $match: { date: { $gte: start, $lte: end } } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
    Investment.find(),
  ]);

  const totalExpenses = expenseAgg[0]?.total ?? 0;
  const totalInvested = investments.reduce((s, i) => s + i.amount, 0);
  const remaining = salary.amount - totalExpenses - totalInvested;
  const threshold = salary.amount * 0.1;

  if (remaining < threshold) {
    const existing = await FinanzAlert.findOne({ category: `low-balance-${currentMonth}`, isRead: false });
    if (!existing) {
      await createAlert({
        title: "Niedriges Guthaben",
        message: `Das verbleibende Guthaben liegt unter 10% des Gehalts für ${currentMonth}`,
        type: "danger",
        category: `low-balance-${currentMonth}`,
      });
    }
  }
}

export async function runPostExpenseChecks(category: string) {
  const currentMonth = getCurrentMonth();
  await Promise.allSettled([
    checkCategoryBudgetExceeded(category, currentMonth),
    checkLowBalance(currentMonth),
  ]);
}
