import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { connectDB } from "@/lib/db";
import Notification from "@/models/Notification";

const CORS = { "Access-Control-Allow-Origin": "*" };

export async function GET(req: Request) {
  const { session, error } = await requireSession();
  if (error) return error;

  await connectDB();

  const url = new URL(req.url);
  const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "50"), 100);

  const user = session!.user as { id?: string; householdId?: string } | undefined;
  const householdId = user?.householdId;
  const userId = user?.id;

  const query = householdId
    ? { $or: [{ householdId }, { senderId: userId }] }
    : { senderId: userId };

  const notifications = await Notification.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  return NextResponse.json(notifications, { headers: CORS });
}

export async function DELETE(req: Request) {
  const { session, error } = await requireSession();
  if (error) return error;

  await connectDB();

  const user2 = session!.user as { id?: string; householdId?: string } | undefined;
  const householdId2 = user2?.householdId;
  const userId2 = user2?.id;

  const query2 = householdId2
    ? { $or: [{ householdId: householdId2 }, { senderId: userId2 }] }
    : { senderId: userId2 };

  await Notification.deleteMany(query2);

  return NextResponse.json({ ok: true }, { headers: CORS });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: { ...CORS, "Access-Control-Allow-Methods": "GET,DELETE,OPTIONS" } });
}
