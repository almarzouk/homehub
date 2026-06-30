import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { connectDB } from "@/lib/db";
import Fixkosten from "@/models/Fixkosten";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1).max(200),
  betrag: z.number().int().min(0),
  kategorie: z.string().optional(),
  faelligAm: z.number().int().min(1).max(31).optional(),
  aktiv: z.boolean().optional(),
});

export async function GET() {
  const { error, session } = await requireSession();
  if (error) return error;

  await connectDB();
  const householdId = (session!.user as { householdId?: string }).householdId;
  const filter: Record<string, unknown> = {};
  if (householdId) filter.householdId = householdId;

  const items = await Fixkosten.find(filter).sort({ createdAt: 1 }).lean();
  return NextResponse.json(items);
}

export async function POST(request: NextRequest) {
  const { error, session } = await requireSession();
  if (error) return error;

  try {
    await connectDB();
    const body = await request.json();

    // Support bulk insert from setup wizard
    const isBulk = Array.isArray(body);
    const items = isBulk ? body : [body];
    const householdId = (session!.user as { householdId?: string }).householdId;

    const created = [];
    for (const item of items) {
      const parsed = schema.safeParse(item);
      if (!parsed.success) continue;
      const doc = await Fixkosten.create({
        ...parsed.data,
        aktiv: parsed.data.aktiv ?? true,
        ...(householdId ? { householdId } : {}),
      });
      created.push(doc);
    }

    return NextResponse.json(isBulk ? created : created[0], { status: 201 });
  } catch (e) {
    console.error("POST /api/finanzen/fixkosten:", e);
    return NextResponse.json({ error: "Speicherfehler" }, { status: 500 });
  }
}
