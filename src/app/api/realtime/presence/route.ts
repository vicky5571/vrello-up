import { NextResponse } from "next/server";
import { realtimeHub } from "@/lib/server/realtimeHub";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, user, taskId } = body;

    if (!userId || !user) {
      return NextResponse.json(
        { error: "Missing required fields: userId, user" },
        { status: 400 },
      );
    }

    realtimeHub.updatePresence(userId, user, taskId || null);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error updating presence:", error);
    return NextResponse.json(
      { error: "Failed to update presence" },
      { status: 500 },
    );
  }
}

