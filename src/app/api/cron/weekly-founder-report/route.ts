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

type AwsConnUserRow = {
  userId?: ObjectId;
  status?: string;
};

type WeeklySendResultLike = {
  sent?: boolean;
  skipped?: boolean;
  error?: string;
};

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function pickBool(obj: Record<string, unknown>, key: string): boolean | undefined {
  const v = obj[key];
  return typeof v === "boolean" ? v : undefined;
}

function pickString(obj: Record<string, unknown>, key: string): string | undefined {
  const v = obj[key];
  return typeof v === "string" ? v : undefined;
}

function asWeeklySendResultLike(v: unknown): WeeklySendResultLike {
  if (!isRecord(v)) return {};
  return {
    sent: pickBool(v, "sent"),
    skipped: pickBool(v, "skipped"),
    error: pickString(v, "error"),
  };
}

function isObjectId(v: unknown): v is ObjectId {
  return v instanceof ObjectId;
}

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

  const doc = await locks.findOneAndUpdate(
    { _id: params.key, $or: [{ lockUntil: { $exists: false } }, { lockUntil: { $lte: now } }] },
    { $set: { lockUntil, lockedAt: now, lockedBy: params.owner, updatedAt: now }, $setOnInsert: { createdAt: now } },
    { upsert: true, returnDocument: "after" }
  );

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

  // Optional override:
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
    const conns = db.collection<AwsConnUserRow>("aws_connections");

    const rows = await conns.find({ status: "connected" }, { projection: { userId: 1 } }).limit(safeMax).toArray();

    const users: ObjectId[] = rows.map((r) => r.userId).filter(isObjectId);

    const results = await runPool(users, safeConc, async (userId) => {
      const resultUnknown: unknown = await sendWeeklyFounderReportForUser({ userId, weekStart, endExclusive });
      return { userId: userId.toHexString(), result: resultUnknown };
    });

    const sent = results.filter((r) => asWeeklySendResultLike(r.result).sent === true).length;
    const skipped = results.filter((r) => asWeeklySendResultLike(r.result).skipped === true).length;
    const failed = results.filter((r) => typeof asWeeklySendResultLike(r.result).error === "string").length;

    return NextResponse.json({
      ok: true,
      runId,
      startedAt,
      endedAt: new Date(),
      config: {
        maxUsers: safeMax,
        concurrency: safeConc,
        weekStart: weekStart ?? null,
        endExclusive: endExclusive ?? null,
      },
      processed: results.length,
      sent,
      skipped,
      failed,
      sampleErrors: results
        .map((r) => {
          const info = asWeeklySendResultLike(r.result);
          return info.error ? { userId: r.userId, error: info.error } : null;
        })
        .filter((x): x is { userId: string; error: string } => x !== null)
        .slice(0, 25),
    });
  } finally {
    await releaseLock({ key: "weekly_founder_report", owner: runId });
  }
}
