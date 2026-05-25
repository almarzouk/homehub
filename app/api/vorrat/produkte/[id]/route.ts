import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { getApiSession } from "@/lib/api-auth";
import { connectDB } from "@/lib/db";
import Product from "@/models/Product";
import "@/models/Category";
import { z } from "zod";

type RouteParams = { params: Promise<{ id: string }> };

const updateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  barcode: z.string().optional(),
  categoryId: z.string().optional(),
  quantity: z.number().min(0).optional(),
  unit: z.string().min(1).optional(),
  minQuantity: z.number().min(0).optional(),
  expiryDate: z.string().nullable().optional(),
  image: z.string().optional(),
  location: z.string().optional(),
  notes: z.string().optional(),
  inShoppingList: z.boolean().optional(),
});

export async function GET(_req: NextRequest, { params }: RouteParams) {
  const session = await getApiSession();
  if (!session) return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });

  const { id } = await params;
  if (!mongoose.Types.ObjectId.isValid(id)) return NextResponse.json({ error: "Ungültige ID" }, { status: 400 });

  try {
    await connectDB();
    const product = await Product.findById(id).populate("categoryId", "name color").lean();
    if (!product) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
    return NextResponse.json(product);
  } catch (e) {
    console.error("GET /api/vorrat/produkte/[id]:", e);
    return NextResponse.json({ error: "Ladefehler" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const session = await getApiSession();
  if (!session) return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });

  const { id } = await params;
  if (!mongoose.Types.ObjectId.isValid(id)) return NextResponse.json({ error: "Ungültige ID" }, { status: 400 });

  try {
    await connectDB();
    const body = await request.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validierungsfehler", details: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const { expiryDate, ...rest } = parsed.data;
    const updateData = {
      ...rest,
      ...(expiryDate !== undefined ? { expiryDate: expiryDate ? new Date(expiryDate) : null } : {}),
    };

    const product = await Product.findByIdAndUpdate(id, { $set: updateData }, { new: true, runValidators: true })
      .populate("categoryId", "name color").lean();
    if (!product) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
    return NextResponse.json(product);
  } catch (e) {
    console.error("PUT /api/vorrat/produkte/[id]:", e);
    return NextResponse.json({ error: "Aktualisierungsfehler" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  const session = await getApiSession();
  if (!session) return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });

  const { id } = await params;
  if (!mongoose.Types.ObjectId.isValid(id)) return NextResponse.json({ error: "Ungültige ID" }, { status: 400 });

  try {
    await connectDB();
    const product = await Product.findByIdAndDelete(id).lean();
    if (!product) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("DELETE /api/vorrat/produkte/[id]:", e);
    return NextResponse.json({ error: "Löschfehler" }, { status: 500 });
  }
}
