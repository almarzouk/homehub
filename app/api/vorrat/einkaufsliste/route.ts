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
    const items = await Product.find({ inShoppingList: true })
      .populate("categoryId", "name color")
      .sort({ name: 1 })
      .lean();
    return NextResponse.json(items);
  } catch (e) {
    console.error("GET /api/vorrat/einkaufsliste:", e);
    return NextResponse.json({ error: "Ladefehler" }, { status: 500 });
  }
}

export async function POST() {
  const session = await getApiSession();
  if (!session) return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });

  try {
    await connectDB();
    // Auto-add out-of-stock and low-stock items
    const all = await Product.find().lean();
    const toAdd = all.filter((p) => p.quantity === 0 || p.quantity <= p.minQuantity);
    const ids = toAdd.map((p) => p._id);
    await Product.updateMany({ _id: { $in: ids } }, { $set: { inShoppingList: true } });
    return NextResponse.json({ added: ids.length });
  } catch (e) {
    console.error("POST /api/vorrat/einkaufsliste:", e);
    return NextResponse.json({ error: "Fehler" }, { status: 500 });
  }
}
