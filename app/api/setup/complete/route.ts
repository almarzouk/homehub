import { NextResponse } from "next/server";
import { getApiSession } from "@/lib/api-auth";
import { connectDB } from "@/lib/db";
import User from "@/models/User";

export async function POST() {
  const session = await getApiSession();
  if (!session) return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });

  try {
    await connectDB();
    await User.findByIdAndUpdate(session.user?.id, { onboardingCompleted: true });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("POST /api/setup/complete:", e);
    return NextResponse.json({ error: "Speicherfehler" }, { status: 500 });
  }
}
