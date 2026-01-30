import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

import { getDb } from "@/lib/mongodb";
import { sendWeeklyFounderReportForUser } from "@/lib/notifications/sendWeeklyFounderReports";

export const runtime = "nodejs";

type CronLockDoc = {
  _id: string;
  lockUntil?: Date;
  lockedAt?: Date;
  lockedBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
};

function getSecretFromReq(req: Request) {
  const url = new URL(req.url);
  const qs = url.searchParams.get("secret");
  const auth = req.headers.get("authorization") || "";
  const bearer = auth.toLowerCase().startsWith("bearer ") ? auth.slice(7).trim() : null;
  return qs || bearer;
}

async function acquireLock(params: { key: string; ttlMs: number; owner: string }) {
  const db = await getDb();
  const locks = db.collection<CronLockDoc>("cron_locks");
  const now = new Date();
  const lockUntil = new Date(now.getTime() + params.ttlMs);

  const updated: any = await locks.findOneAndUpdate(
    { _id: params.key, $or: [{ lockUntil: { $exists: false } }, { lockUntil: { $lte: now } }] },
    { $set: { lockUntil, lockedAt: now, lockedBy: params.owner, updatedAt: now }, $setOnInsert: { createdAt: now } },
    { upsert: true, returnDocument: "after", includeResultMetadata: true } as any
  );

  const doc: CronLockDoc | null = (updated && typeof updated === "object" && "value" in updated ? updated.value : updated) ?? null;
  if (!doc) return { ok: false as const };
  return { ok: true as const, lock: doc };
}

async function releaseLock(params: { key: string; owner: string }) {
  const db = await getDb();
  const locks = db.collection<CronLockDoc>("cron_locks");
  const now = new Date();
  await locks.updateOne({ _id: params.key, lockedBy: params.owner }, { $set: { lockUntil: now, updatedAt: now } });
}

async function runPool<T, R>(items: T[], concurrency: number, worker: (item: T) => Promise<R>) {
  const results: R[] = [];
  let i = 0;

  async function runner() {
    while (i < items.length) {
      const idx = i++;
      results[idx] = await worker(items[idx]);
    }
  }

  const n = Math.min(concurrency, items.length);
  await Promise.all(Array.from({ length: n }, () => runner()));
  return results;
}

export async function GET(req: Request) {
  const CRON_SECRET = process.env.CRON_SECRET;
  if (!CRON_SECRET) {
    return NextResponse.json({ ok: false, error: "Missing CRON_SECRET env var" }, { status: 500 });
  }

  const provided = getSecretFromReq(req);
  if (!provided || provided !== CRON_SECRET) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const maxUsers = Number(url.searchParams.get("maxUsers") ?? "300");
  const concurrency = Number(url.searchParams.get("concurrency") ?? "3");

  // Optional override (debug/testing):
  // weekStart=YYYY-MM-DD&endExclusive=YYYY-MM-DD (endExclusive = day after week end)
  const weekStart = url.searchParams.get("weekStart") || undefined;
  const endExclusive = url.searchParams.get("endExclusive") || undefined;

  const safeMax = Number.isFinite(maxUsers) ? Math.min(Math.max(maxUsers, 1), 5000) : 300;
  const safeConc = Number.isFinite(concurrency) ? Math.min(Math.max(concurrency, 1), 8) : 3;

  const runId = `weekly-report:${Date.now()}:${Math.random().toString(16).slice(2)}`;

  const lock = await acquireLock({ key: "weekly_founder_report", ttlMs: 20 * 60 * 1000, owner: runId });
  if (!lock.ok) {
    return NextResponse.json({ ok: true, skipped: true, reason: "locked" }, { status: 200 });
  }

  const startedAt = new Date();

  try {
    const db = await getDb();
    const conns = db.collection("aws_connections");

    // Only send to connected AWS users (prevents emailing people who never used it)
    const rows = await conns
      .find({ status: "connected" }, { projection: { userId: 1 } })
      .limit(safeMax)
      .toArray();

    const users: ObjectId[] = rows.map((r: any) => r.userId).filter((id: any) => id && typeof id === "object");

    const results = await runPool(users, safeConc, async (userId) => {
      const r = await sendWeeklyFounderReportForUser({ userId, weekStart, endExclusive });
      return { userId: String(userId), result: r };
    });

    const sent = results.filter((r) => (r.result as any).sent).length;
    const skipped = results.filter((r) => (r.result as any).skipped).length;
    const failed = results.filter((r) => (r.result as any).error).length;

    return NextResponse.json({
      ok: true,
      runId,
      startedAt,
      endedAt: new Date(),
      config: { maxUsers: safeMax, concurrency: safeConc, weekStart: weekStart ?? null, endExclusive: endExclusive ?? null },
      processed: results.length,
      sent,
      skipped,
      failed,
      sampleErrors: results
        .filter((r) => (r.result as any).error)
        .slice(0, 25)
        .map((r) => ({ userId: r.userId, error: (r.result as any).error })),
    });
  } finally {
    await releaseLock({ key: "weekly_founder_report", owner: runId });
  }
}
