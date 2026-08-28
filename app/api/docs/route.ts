import { NextRequest, NextResponse } from "next/server";
import { getApiSession } from "@/lib/api-auth";
import { connectDB } from "@/lib/db";
import DocTab from "@/models/DocTab";
import { z } from "zod";

const createSchema = z.object({
  title: z.string().min(1).max(120).optional(),
  content: z.string().max(500_000).optional(),
});

export async function GET() {
  const session = await getApiSession();
  if (!session) return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });

  try {
    await connectDB();
    const householdId = (session.user as { householdId?: string }).householdId;
    const filter = householdId ? { householdId } : { userId: session.user?.id };
    const tabs = await DocTab.find(filter).sort({ sortOrder: 1, createdAt: 1 }).lean();
    return NextResponse.json({ tabs });
  } catch (e) {
    console.error("GET /api/docs:", e);
    return NextResponse.json({ error: "Ladefehler" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getApiSession();
  if (!session) return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });

  try {
    await connectDB();
    const body = await request.json();
    const data = createSchema.parse(body);
    const householdId = (session.user as { householdId?: string }).householdId;
    const filter = householdId ? { householdId } : { userId: session.user?.id };
    const count = await DocTab.countDocuments(filter);

    const tab = await DocTab.create({
      title: data.title?.trim() || "Untitled",
      content: data.content ?? "",
      sortOrder: count,
      userId: session.user?.id,
      ...(householdId ? { householdId } : {}),
    });

    return NextResponse.json({ tab }, { status: 201 });
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: e.issues }, { status: 400 });
    console.error("POST /api/docs:", e);
    return NextResponse.json({ error: "Erstellungsfehler" }, { status: 500 });
  }
}
