import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { connectDB } from "@/lib/db";
import ChatNachricht from "@/models/ChatNachricht";
import { z } from "zod";

const schema = z.object({
  text: z.string().min(1).max(2000),
});

export async function GET(request: NextRequest) {
  const { error, session } = await requireSession();
  if (error) return error;

  await connectDB();
  const householdId = (session!.user as { householdId?: string }).householdId;
  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50"), 100);

  const messages = await ChatNachricht.find(householdId ? { householdId } : {})
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  return NextResponse.json(messages.reverse());
}

export async function POST(request: NextRequest) {
  const { error, session } = await requireSession();
  if (error) return error;

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Ungültige Daten" }, { status: 400 });

  await connectDB();
  const householdId = (session!.user as { householdId?: string }).householdId;
  const user = session!.user as { id?: string; name?: string; householdId?: string };

  const msg = await ChatNachricht.create({
    householdId,
    senderId: user.id,
    senderName: user.name ?? "Unbekannt",
    text: parsed.data.text,
  });
  return NextResponse.json(msg, { status: 201 });
}
