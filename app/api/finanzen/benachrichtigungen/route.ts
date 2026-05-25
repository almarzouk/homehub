import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { connectDB } from "@/lib/db";
import FinanzAlert from "@/models/FinanzAlert";

export async function GET(request: NextRequest) {
  const { error } = await requireSession();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const unreadOnly = searchParams.get("ungelesen") === "1";

  await connectDB();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filter: Record<string, any> = {};
  if (unreadOnly) filter.isRead = false;

  const alerts = await FinanzAlert.find(filter).sort({ createdAt: -1 }).limit(50).lean();
  return NextResponse.json(alerts);
}

export async function PATCH(request: NextRequest) {
  const { error } = await requireSession();
  if (error) return error;

  try {
    await connectDB();
    const body = await request.json();
    const { ids, alleAlsGelesen } = body;

    if (alleAlsGelesen) {
      await FinanzAlert.updateMany({}, { $set: { isRead: true } });
      return NextResponse.json({ success: true });
    }

    if (Array.isArray(ids) && ids.length > 0) {
      await FinanzAlert.updateMany({ _id: { $in: ids } }, { $set: { isRead: true } });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Keine IDs angegeben" }, { status: 400 });
  } catch (e) {
    console.error("PATCH /api/finanzen/benachrichtigungen:", e);
    return NextResponse.json({ error: "Fehler" }, { status: 500 });
  }
}
