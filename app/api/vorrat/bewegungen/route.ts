import { NextRequest, NextResponse } from "next/server";
import { getApiSession } from "@/lib/api-auth";
import { connectDB } from "@/lib/db";
import Movement from "@/models/Movement";
import Product from "@/models/Product";
import { z } from "zod";

const movementSchema = z.object({
  productId: z.string(),
  type: z.enum(["IN", "OUT", "ADJUST"]),
  quantity: z.number().min(0),
  note: z.string().optional(),
});

export async function GET(request: NextRequest) {
  const session = await getApiSession();
  if (!session) return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });

  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");
    const limit = Math.min(100, parseInt(searchParams.get("limit") ?? "50", 10));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: Record<string, any> = {};
    if (productId) query.productId = productId;

    const movements = await Movement.find(query)
      .populate("productId", "name unit")
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return NextResponse.json(movements);
  } catch (e) {
    console.error("GET /api/vorrat/bewegungen:", e);
    return NextResponse.json({ error: "Ladefehler" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getApiSession();
  if (!session) return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });

  try {
    await connectDB();
    const body = await request.json();
    const parsed = movementSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validierungsfehler", details: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const product = await Product.findById(parsed.data.productId);
    if (!product) return NextResponse.json({ error: "Produkt nicht gefunden." }, { status: 404 });

    const previousQuantity = product.quantity;
    let newQuantity = previousQuantity;

    if (parsed.data.type === "IN") newQuantity = previousQuantity + parsed.data.quantity;
    else if (parsed.data.type === "OUT") newQuantity = Math.max(0, previousQuantity - parsed.data.quantity);
    else if (parsed.data.type === "ADJUST") newQuantity = parsed.data.quantity;

    product.quantity = newQuantity;
    await product.save();

    const movement = await Movement.create({
      productId: parsed.data.productId,
      type: parsed.data.type,
      quantity: parsed.data.quantity,
      previousQuantity,
      newQuantity,
      note: parsed.data.note,
    });

    return NextResponse.json(movement, { status: 201 });
  } catch (e) {
    console.error("POST /api/vorrat/bewegungen:", e);
    return NextResponse.json({ error: "Speicherfehler" }, { status: 500 });
  }
}
