import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

import { auth } from "@/auth";
import { syncAwsForUser } from "@/lib/aws/syncAwsForUser";

export const runtime = "nodejs";

type SyncRequestBody = {
  days?: unknown;
};

function toObjectId(id: string) {
  try {
    return new ObjectId(id);
  } catch {
    return null;
  }
}

function clampDays(v: unknown, fallback = 30) {
  if (typeof v !== "number" || !Number.isFinite(v)) return fallback;
  return Math.min(365, Math.max(7, Math.floor(v)));
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const userId = toObjectId(session.user.id);
  if (!userId) {
    return NextResponse.json({ ok: false, error: "Invalid session" }, { status: 500 });
  }

  const body = (await req.json().catch(() => ({}))) as SyncRequestBody;
  const days = clampDays(body.days, 30);

  try {
    const result = await syncAwsForUser({ userId, days });
    return NextResponse.json({ ok: true, result });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Sync failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
