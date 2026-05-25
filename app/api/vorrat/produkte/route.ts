import { NextRequest, NextResponse } from "next/server";
import { getApiSession } from "@/lib/api-auth";
import { connectDB } from "@/lib/db";
import Product from "@/models/Product";
import "@/models/Category";
import { regexEscape } from "@/lib/regex-escape";
import { z } from "zod";

const productSchema = z.object({
  name: z.string().min(1).max(200),
  barcode: z.string().optional(),
  categoryId: z.string().optional(),
  quantity: z.number().min(0),
  unit: z.string().min(1),
  minQuantity: z.number().min(0).default(0),
  expiryDate: z.string().optional(),
  image: z.string().optional(),
  location: z.string().optional(),
  notes: z.string().optional(),
  inShoppingList: z.boolean().optional().default(false),
});

export async function GET(request: NextRequest) {
  const session = await getApiSession();
  if (!session) return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });

  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim();
    const categoryId = searchParams.get("categoryId");
    const status = searchParams.get("status") as "good" | "low" | "out" | null;
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: Record<string, any> = {};
    const householdId = (session.user as { householdId?: string }).householdId;
    if (householdId) query.householdId = householdId;

    if (search) {
      const re = new RegExp(regexEscape(search), "i");
      query.$or = [{ name: re }, { barcode: re }];
    }
    if (categoryId) query.categoryId = categoryId;

    if (status) {
      const all = await Product.find(query).populate("categoryId", "name color").sort({ name: 1 }).lean();
      const filtered = all.filter((p) => {
        if (status === "out") return p.quantity === 0;
        if (status === "low") return p.quantity > 0 && p.quantity <= p.minQuantity;
        if (status === "good") return p.quantity > p.minQuantity;
        return true;
      });
      const total = filtered.length;
      const products = filtered.slice((page - 1) * limit, page * limit);
      return NextResponse.json({ products, total, page, totalPages: Math.max(1, Math.ceil(total / limit)), limit });
    }

    const total = await Product.countDocuments(query);
    const products = await Product.find(query)
      .populate("categoryId", "name color")
      .sort({ name: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return NextResponse.json({ products, total, page, totalPages: Math.max(1, Math.ceil(total / limit)), limit });
  } catch (e) {
    console.error("GET /api/vorrat/produkte:", e);
    return NextResponse.json({ error: "Ladefehler" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getApiSession();
  if (!session) return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });

  try {
    await connectDB();
    const body = await request.json();
    const parsed = productSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validierungsfehler", details: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const { barcode, unit, expiryDate, ...rest } = parsed.data;
    const householdId = (session.user as { householdId?: string }).householdId;
    const product = await Product.create({
      ...rest,
      unit: unit as "piece" | "kg" | "g" | "liter" | "ml" | "box" | "pack",
      barcode: barcode || undefined,
      expiryDate: expiryDate ? new Date(expiryDate) : undefined,
      ...(householdId ? { householdId } : {}),
    });

    return NextResponse.json(product, { status: 201 });
  } catch (e: unknown) {
    console.error("POST /api/vorrat/produkte:", e);
    const msg = e instanceof Error ? e.message : "Speicherfehler";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
