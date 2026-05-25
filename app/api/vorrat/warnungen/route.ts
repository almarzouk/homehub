import { NextResponse } from "next/server";
import { getApiSession } from "@/lib/api-auth";
import { connectDB } from "@/lib/db";
import Product from "@/models/Product";
import "@/models/Category";

export async function GET() {
  const session = await getApiSession();
  if (!session) return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });

  try {
    await connectDB();

    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const householdId = (session.user as { householdId?: string }).householdId;
    const hFilter = householdId ? { householdId } : {};

    const [outOfStock, lowStock, expired, expiringSoon] = await Promise.all([
      Product.find({ ...hFilter, quantity: 0 }).populate("categoryId", "name color").lean(),
      Product.find({ ...hFilter, quantity: { $gt: 0 }, $expr: { $lte: ["$quantity", "$minQuantity"] } }).populate("categoryId", "name color").lean(),
      Product.find({ ...hFilter, expiryDate: { $lt: now } }).populate("categoryId", "name color").lean(),
      Product.find({ ...hFilter, expiryDate: { $gte: now, $lte: sevenDaysFromNow } }).populate("categoryId", "name color").lean(),
    ]);

    return NextResponse.json({ outOfStock, lowStock, expired, expiringSoon });
  } catch (e) {
    console.error("GET /api/vorrat/warnungen:", e);
    return NextResponse.json({ error: "Ladefehler" }, { status: 500 });
  }
}
