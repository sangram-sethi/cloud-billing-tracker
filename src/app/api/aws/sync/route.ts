import { NextResponse } from "next/server";
import { z } from "zod";
import { ObjectId } from "mongodb";

import { auth } from "@/auth";
import { checkRateLimit } from "@/lib/rateLimit";
import { awsConnectionsCol } from "@/lib/aws/collections";
import { ensureAwsIndexes } from "@/lib/aws/indexes";
import { syncAwsForUser } from "@/lib/aws/syncAwsForUser";

export const runtime = "nodejs";

const BodySchema = z.object({
  days: z.number().int().min(7).max(90).optional(),
});

function toObjectId(id: string) {
  try {
    return new ObjectId(id);
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const rl = await checkRateLimit({
    key: `aws:sync:${session.user.id}`,
    limit: 30,
    windowMs: 60 * 60 * 1000,
  });
  if (!rl.ok) {
    return NextResponse.json({ ok: false, error: "Too many sync requests. Try later." }, { status: 429 });
  }

  const userId = toObjectId(session.user.id);
  if (!userId) {
    return NextResponse.json({ ok: false, error: "Invalid user session" }, { status: 500 });
  }

  const json = await req.json().catch(() => ({}));
  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Invalid request" }, { status: 400 });
  }

  const days = parsed.data.days ?? 30;

  await ensureAwsIndexes();

  // Cooldown for manual sync UX
  const connCol = await awsConnectionsCol();
  const conn = await connCol.findOne({ userId });

  if (!conn || conn.status !== "connected") {
    return NextResponse.json({ ok: false, error: "AWS not connected. Connect AWS first." }, { status: 400 });
  }

  if (conn.lastSyncAt) {
    const msSince = Date.now() - new Date(conn.lastSyncAt).getTime();
    const cooldownMs = 2 * 60 * 1000;
    if (msSince < cooldownMs) {
      const retryAfter = Math.ceil((cooldownMs - msSince) / 1000);
      return NextResponse.json(
        { ok: false, error: `Please wait ${retryAfter}s before syncing again.`, retryAfter },
        { status: 429 }
      );
    }
  }

  const result = await syncAwsForUser({ userId, days });

  if (!result.ok) {
    const status =
      result.code === "INVALID_CREDENTIALS"
        ? 401
        : result.code === "ACCESS_DENIED"
          ? 403
          : result.code === "THROTTLED"
            ? 429
            : result.code === "NOT_CONNECTED"
              ? 400
              : 502;

    return NextResponse.json({ ok: false, error: result.message, code: result.code }, { status });
  }

  return NextResponse.json(result);
}
