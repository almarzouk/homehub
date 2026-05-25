import { NextRequest, NextResponse } from "next/server";
import { getApiSession } from "@/lib/api-auth";
import { connectDB } from "@/lib/db";
import Category from "@/models/Category";
import { z } from "zod";

const categorySchema = z.object({
  name: z.string().min(1).max(80),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#6b7280"),
});

export async function GET() {
  const session = await getApiSession();
  if (!session) return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });

  try {
    await connectDB();
    const householdId = (session.user as { householdId?: string }).householdId;
    const filter = householdId ? { householdId } : {};
    const categories = await Category.find(filter).sort({ name: 1 }).lean();
    return NextResponse.json(categories);
  } catch (e) {
    console.error("GET /api/vorrat/kategorien:", e);
    return NextResponse.json({ error: "Ladefehler" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getApiSession();
  if (!session) return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });

  try {
    await connectDB();
    const body = await request.json();
    const parsed = categorySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validierungsfehler", details: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const existing = await Category.findOne({ name: parsed.data.name, ...((session.user as { householdId?: string }).householdId ? { householdId: (session.user as { householdId?: string }).householdId } : {}) });
    if (existing) return NextResponse.json({ error: "Kategorie existiert bereits." }, { status: 409 });

    const category = await Category.create({
      ...parsed.data,
      ...((session.user as { householdId?: string }).householdId ? { householdId: (session.user as { householdId?: string }).householdId } : {}),
    });
    return NextResponse.json(category, { status: 201 });
  } catch (e) {
    console.error("POST /api/vorrat/kategorien:", e);
    return NextResponse.json({ error: "Speicherfehler" }, { status: 500 });
  }
}
