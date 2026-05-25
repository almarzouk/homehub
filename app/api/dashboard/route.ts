import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { requireSession } from "@/lib/api-auth";
import { connectDB } from "@/lib/db";
import { getCurrentMonth, getLastMonths, monthToDateRange } from "@/lib/utils";
import SalaryConfig from "@/models/SalaryConfig";
import Expense from "@/models/Expense";
import Investment from "@/models/Investment";
import FinanzAlert from "@/models/FinanzAlert";
import SavingsGoal from "@/models/SavingsGoal";
import Product from "@/models/Product";
import Gericht from "@/models/Gericht";

export async function GET(request: NextRequest) {
  const { error, session } = await requireSession();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const month = searchParams.get("month") ?? getCurrentMonth();

  await connectDB();

  const { start, end } = monthToDateRange(month);
  const lastMonths = getLastMonths(6);
  const now = new Date();
  const sevenDays = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  // Household scoping — cast to ObjectId so aggregation $match works correctly
  const householdId = (session!.user as { householdId?: string }).householdId;
  const hFilter = householdId ? { householdId: new Types.ObjectId(householdId) } : {};

  // ── Trend aggregation (1 query instead of N) ────────────────────────────
  const trendStart = monthToDateRange(lastMonths[0]).start;
  const trendAgg = await Expense.aggregate([
    { $match: { ...hFilter, date: { $gte: trendStart, $lte: end } } },
    { $group: { _id: { y: { $year: "$date" }, m: { $month: "$date" } }, total: { $sum: "$amount" } } },
  ]);
  const trendMap = new Map(trendAgg.map((r) => [`${r._id.y}-${r._id.m}`, r.total]));
  const monthlyTrend = lastMonths.map((m) => {
    const range = monthToDateRange(m);
    const d = range.start;
    return { month: m, total: trendMap.get(`${d.getFullYear()}-${d.getMonth() + 1}`) ?? 0 };
  });

  // ── Product stats via aggregation (1 query instead of load-all + JS filter) ─
  const [productStats] = await Product.aggregate([
    { $match: hFilter },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        outOfStock: { $sum: { $cond: [{ $eq: ["$quantity", 0] }, 1, 0] } },
        lowStock: { $sum: { $cond: [{ $and: [{ $gt: ["$quantity", 0] }, { $lte: ["$quantity", "$minQuantity"] }] }, 1, 0] } },
        expired: { $sum: { $cond: [{ $and: [{ $ifNull: ["$expiryDate", false] }, { $lt: ["$expiryDate", now] }] }, 1, 0] } },
        expiringSoon: { $sum: { $cond: [{ $and: [{ $ifNull: ["$expiryDate", false] }, { $gte: ["$expiryDate", now] }, { $lte: ["$expiryDate", sevenDays] }] }, 1, 0] } },
      },
    },
  ]);

  const [
    salary,
    expenses,
    investments,
    unreadAlerts,
    recentExpenses,
    savingsGoals,
    gerichteCount,
    favoritCount,
  ] = await Promise.all([
    SalaryConfig.findOne({ month }).lean(),
    Expense.find({ ...hFilter, date: { $gte: start, $lte: end } }).lean(),
    Investment.find(hFilter).lean(),
    FinanzAlert.find({ isRead: false }).sort({ createdAt: -1 }).limit(10).lean(),
    Expense.find(hFilter).sort({ date: -1 }).limit(5).lean(),
    SavingsGoal.find({ ...hFilter, isActive: true }).lean(),
    Gericht.countDocuments(hFilter),
    Gericht.countDocuments({ ...hFilter, favorit: true }),
  ]);

  // Finance summary
  const totalSalary = salary?.amount ?? 0;
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const totalInvested = investments.reduce((s, i) => s + i.amount, 0);
  const remainingBalance = totalSalary - totalExpenses - totalInvested;
  const unnecessary = expenses.filter((e) => e.type === "unnecessary");

  // Vorrat summary (from aggregation result)
  const { total = 0, outOfStock = 0, lowStock = 0, expired = 0, expiringSoon = 0 } = productStats ?? {};

  return NextResponse.json({
    // Finance
    totalSalary,
    totalExpenses,
    totalInvested,
    remainingBalance,
    unnecessaryExpensesCount: unnecessary.length,
    unnecessaryExpensesTotal: unnecessary.reduce((s, e) => s + e.amount, 0),
    monthlyTrend,
    currency: salary?.currency ?? "EUR",
    recentExpenses,
    unreadAlerts,
    // Vorrat
    vorrat: {
      total,
      outOfStock,
      lowStock,
      expired,
      expiringSoon,
    },
    // Küche
    kueche: {
      total: gerichteCount,
      favoriten: favoritCount,
    },
  });
}
