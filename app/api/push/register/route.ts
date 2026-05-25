import { NextRequest, NextResponse } from "next/server";
import { getApiSession } from "@/lib/api-auth";
import { connectDB } from "@/lib/db";
import PushToken from "@/models/PushToken";

// GET: Return VAPID public key + registered device count
export async function GET() {
  await connectDB();
  const count = await PushToken.countDocuments();
  return NextResponse.json({
    vapidPublicKey: process.env.VAPID_PUBLIC_KEY ?? "",
    count,
  });
}

// POST: Register a push subscription or expo token
export async function POST(request: NextRequest) {
  const session = await getApiSession();
  if (!session) return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });

  try {
    await connectDB();
    const body = await request.json();
    const userId = session.user?.id;
    const householdId = (session.user as { householdId?: string }).householdId;

    if (body.type === "web" && body.subscription) {
      const { endpoint, keys } = body.subscription;
      await PushToken.findOneAndUpdate(
        { "subscription.endpoint": endpoint },
        {
          userId,
          type: "web",
          subscription: { endpoint, keys },
          userAgent: request.headers.get("user-agent") ?? undefined,
          ...(householdId ? { householdId } : {}),
        },
        { upsert: true, new: true }
      );
      return NextResponse.json({ ok: true });
    }

    if (body.type === "expo" && body.expoToken) {
      await PushToken.findOneAndUpdate(
        { expoToken: body.expoToken },
        {
          userId,
          type: "expo",
          expoToken: body.expoToken,
          ...(householdId ? { householdId } : {}),
        },
        { upsert: true, new: true }
      );
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Ungültige Daten" }, { status: 400 });
  } catch (e) {
    console.error("POST /api/push/register:", e);
    return NextResponse.json({ error: "Registrierungsfehler" }, { status: 500 });
  }
}
