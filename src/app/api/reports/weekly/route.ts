import { NextResponse } from "next/server";
import { z } from "zod";
import { ObjectId } from "mongodb";

import { auth } from "@/auth";
import { getDb } from "@/lib/mongodb";
import { ensureReportIndexes } from "@/lib/reports/indexes";
import { sendWeeklyFounderReportForUser } from "@/lib/notifications/sendWeeklyFounderReports";

export const runtime = "nodejs";

function toObjectId(id: string): ObjectId | null {
  try {
    return new ObjectId(id);
  } catch {
    return null;
  }
}

function ymdUtc(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function idToString(v: unknown): string {
  if (typeof v === "string") return v;
  if (v && typeof v === "object") {
    // ObjectId has a toString() that returns the hex string
    const maybe = v as { toString?: unknown };
    if (typeof maybe.toString === "function") {
      try {
        return String(maybe.toString());
      } catch {
        return "";
      }
    }
  }
  return "";
}

const GetQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).optional(),
});

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const userId = toObjectId(session.user.id);
  if (!userId) {
    return NextResponse.json({ ok: false, error: "Invalid session" }, { status: 500 });
  }

  const url = new URL(req.url);
  const parsed = GetQuerySchema.safeParse({
    limit: url.searchParams.get("limit") ?? undefined,
  });

  const limit = parsed.success && parsed.data.limit ? parsed.data.limit : 10;

  await ensureReportIndexes();

  const db = await getDb();
  const col = db.collection("weekly_reports");

  const rows = await col
    .find(
      { userId },
      {
        projection: {
          periodStart: 1,
          periodEnd: 1,
          currency: 1,
          total: 1,
          prevTotal: 1,
          delta: 1,
          deltaPct: 1,
          emailStatus: 1,
          topServices: 1,
          anomalies: 1,
          emailedAt: 1,
          createdAt: 1,
          updatedAt: 1,
        },
      }
    )
    .sort({ periodStart: -1 })
    .limit(limit)
    .toArray();

  const reports = rows.map((r) => ({
    ...r,
    _id: idToString((r as Record<string, unknown>)["_id"]),
  }));

  return NextResponse.json({ ok: true, reports }, { status: 200 });
}

const PostBodySchema = z
  .object({
    days: z.number().int().min(1).max(31).optional(),
    weekStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    endExclusive: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  })
  .passthrough();

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const userId = toObjectId(session.user.id);
  if (!userId) {
    return NextResponse.json({ ok: false, error: "Invalid session" }, { status: 500 });
  }

  const body = (await req.json().catch(() => ({}))) as unknown;
  const parsed = PostBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Invalid request" }, { status: 400 });
  }

  let weekStart: string | undefined = parsed.data.weekStart;
  let endExclusive: string | undefined = parsed.data.endExclusive;

  if (!weekStart && !endExclusive && typeof parsed.data.days === "number") {
    const now = new Date();
    const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
    const start = new Date(end.getTime() - parsed.data.days * 24 * 60 * 60 * 1000);

    weekStart = ymdUtc(start);
    endExclusive = ymdUtc(end);
  }

  await sendWeeklyFounderReportForUser({ userId, weekStart, endExclusive });

  return NextResponse.json({ ok: true }, { status: 200 });
}
