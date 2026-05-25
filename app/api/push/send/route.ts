import { NextRequest, NextResponse } from "next/server";
import webpush from "web-push";
import { getApiSession } from "@/lib/api-auth";
import { connectDB } from "@/lib/db";
import PushToken from "@/models/PushToken";
import Notification from "@/models/Notification";
import User from "@/models/User";

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT ?? "mailto:admin@homehub.local",
  process.env.VAPID_PUBLIC_KEY ?? "",
  process.env.VAPID_PRIVATE_KEY ?? ""
);

// GET: Notification history (scoped to household)
export async function GET() {
  const session = await getApiSession();
  if (!session) return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });

  await connectDB();
  const householdId = (session.user as { householdId?: string }).householdId;
  const filter = householdId ? { householdId } : {};
  const notifications = await Notification.find(filter)
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();
  return NextResponse.json({ notifications });
}

// DELETE: Delete a notification by ID
export async function DELETE(request: NextRequest) {
  const session = await getApiSession();
  if (!session) return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });

  try {
    await connectDB();
    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: "ID fehlt" }, { status: 400 });
    await Notification.findByIdAndDelete(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("DELETE /api/push/send:", e);
    return NextResponse.json({ error: "Löschfehler" }, { status: 500 });
  }
}

// POST: Send notification to all family members
export async function POST(request: NextRequest) {
  const session = await getApiSession();
  if (!session) return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });

  try {
    await connectDB();
    const { title, body, url } = await request.json();
    if (!title || !body) {
      return NextResponse.json({ error: "Titel und Nachricht erforderlich" }, { status: 400 });
    }

    // Get sender name
    const sender = await User.findById(session.user?.id).lean();
    const senderName = sender?.name ?? session.user?.email ?? "HomeHub";
    const householdId = (session.user as { householdId?: string }).householdId;

    // Save to history (scoped to household)
    await Notification.create({
      senderId: session.user?.id,
      senderName,
      title,
      body,
      url: url ?? "/",
      ...(householdId ? { householdId } : {}),
    });

    // Get push tokens for the household (or all if no household)
    const tokenFilter = householdId ? { householdId } : {};
    const tokens = await PushToken.find(tokenFilter).lean();

    const payload = JSON.stringify({
      title,
      body,
      icon: "/icon-192.png",
      badge: "/badge-72.png",
      url: url ?? "/",
      senderName,
      timestamp: Date.now(),
    });

    const results = await Promise.allSettled(
      tokens.map(async (token) => {
        if (token.type === "web" && token.subscription) {
          return webpush.sendNotification(
            token.subscription as webpush.PushSubscription,
            payload
          );
        }

        if (token.type === "expo" && token.expoToken) {
          // Expo Push API
          const expoPayload = {
            to: token.expoToken,
            title,
            body,
            sound: "default",
            data: { url: url ?? "/" },
          };
          const res = await fetch("https://exp.host/--/api/v2/push/send", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
              "Accept-Encoding": "gzip, deflate",
            },
            body: JSON.stringify(expoPayload),
          });
          return res.json();
        }
      })
    );

    const sent = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;

    return NextResponse.json({ ok: true, sent, failed, total: tokens.length });
  } catch (e) {
    console.error("POST /api/push/send:", e);
    return NextResponse.json({ error: "Sendefehler" }, { status: 500 });
  }
}
