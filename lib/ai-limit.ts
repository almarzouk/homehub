import { connectDB } from "./db";
import User from "@/models/User";

export interface AILimitResult {
  allowed: boolean;
  used: number;
  limit: number;
  remaining: number;
}

function currentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

/**
 * Check whether a user is within their monthly AI request limit.
 * Does NOT increment the counter — call incrementAIUsage() after a
 * successful OpenAI call.
 */
export async function checkAILimit(userId: string): Promise<AILimitResult> {
  await connectDB();

  const user = await User.findById(userId)
    .select("aiRequestsThisMonth aiRequestsMonth aiMonthlyLimit")
    .lean();

  if (!user) return { allowed: false, used: 0, limit: 0, remaining: 0 };

  const month = currentMonth();
  const limit = user.aiMonthlyLimit ?? 10;
  // Reset count if we are in a new month
  const used = user.aiRequestsMonth === month ? (user.aiRequestsThisMonth ?? 0) : 0;

  return {
    allowed: used < limit,
    used,
    limit,
    remaining: Math.max(0, limit - used),
  };
}

/**
 * Atomically increment the AI usage counter for the current month.
 * Resets the counter automatically when the month changes.
 */
export async function incrementAIUsage(userId: string): Promise<void> {
  await connectDB();
  const month = currentMonth();

  // Atomic update: if month matches → increment, else reset to 1
  await User.findByIdAndUpdate(userId, [
    {
      $set: {
        aiRequestsThisMonth: {
          $cond: [
            { $eq: ["$aiRequestsMonth", month] },
            { $add: [{ $ifNull: ["$aiRequestsThisMonth", 0] }, 1] },
            1,
          ],
        },
        aiRequestsMonth: month,
      },
    },
  ]);
}
