import { NextRequest, NextResponse } from "next/server";
import { getApiSession } from "@/lib/api-auth";
import { connectDB } from "@/lib/db";
import Product from "@/models/Product";
import "@/models/Category";
import { regexEscape } from "@/lib/regex-escape";

export async function GET(request: NextRequest) {
  const session = await getApiSession();
  if (!session) return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });

  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim() ?? "";

    if (!q) return NextResponse.json([]);

    const re = new RegExp(regexEscape(q), "i");
    const products = await Product.find({ $or: [{ name: re }, { barcode: re }] })
      .populate("categoryId", "name color")
      .sort({ name: 1 })
      .limit(20)
      .lean();

    return NextResponse.json(products);
  } catch (e) {
    console.error("GET /api/vorrat/suche:", e);
    return NextResponse.json({ error: "Suchfehler" }, { status: 500 });
  }
}
