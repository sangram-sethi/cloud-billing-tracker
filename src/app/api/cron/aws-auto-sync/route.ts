import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

import { getDb } from "@/lib/mongodb";
import { ensureAwsIndexes } from "@/lib/aws/indexes";
import { syncAwsForUser } from "@/lib/aws/syncAwsForUser";

export const runtime = "nodejs";

type CronLockDoc = {
  _id: string; // string id (e.g. "aws_auto_sync")
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

function hoursToMs(h: number) {
  return Math.max(0, h) * 60 * 60 * 1000;
}

async function acquireLock(params: { key: string; ttlMs: number; owner: string }) {
  const db = await getDb();
  const locks = db.collection<CronLockDoc>("cron_locks");
  const now = new Date();
  const lockUntil = new Date(now.getTime() + params.ttlMs);

  // Mongo driver typings differ by version:
  // - some return ModifyResult with `.value`
  // - some return the document directly (or null)
  const updated: any = await locks.findOneAndUpdate(
    {
      _id: params.key,
      $or: [{ lockUntil: { $exists: false } }, { lockUntil: { $lte: now } }],
    },
    {
      $set: { lockUntil, lockedAt: now, lockedBy: params.owner, updatedAt: now },
      $setOnInsert: { createdAt: now },
    },
    {
      upsert: true,
      returnDocument: "after",
      // includeResultMetadata exists on some versions; safe to pass via `any`
      includeResultMetadata: true,
    } as any
  );

  const doc: CronLockDoc | null = (updated && typeof updated === "object" && "value" in updated ? updated.value : updated) ?? null;

  if (!doc) return { ok: false as const };
  return { ok: true as const, lock: doc };
}

async function releaseLock(params: { key: string; owner: string }) {
  const db = await getDb();
  const locks = db.collection<CronLockDoc>("cron_locks");
  const now = new Date();

  await locks.updateOne(
    { _id: params.key, lockedBy: params.owner },
    { $set: { lockUntil: now, updatedAt: now } }
  );
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

  const days = Number(url.searchParams.get("days") ?? "30");
  const maxUsers = Number(url.searchParams.get("maxUsers") ?? process.env.AWS_AUTO_SYNC_MAX_USERS ?? "200");
  const minHours = Number(url.searchParams.get("minHours") ?? process.env.AWS_AUTO_SYNC_MIN_HOURS ?? "6");
  const concurrency = Number(url.searchParams.get("concurrency") ?? process.env.AWS_AUTO_SYNC_CONCURRENCY ?? "3");

  const safeDays = Number.isFinite(days) ? Math.min(Math.max(days, 7), 90) : 30;
  const safeMax = Number.isFinite(maxUsers) ? Math.min(Math.max(maxUsers, 1), 2000) : 200;
  const safeMinHours = Number.isFinite(minHours) ? Math.min(Math.max(minHours, 1), 72) : 6;
  const safeConc = Number.isFinite(concurrency) ? Math.min(Math.max(concurrency, 1), 8) : 3;

  const runId = `aws-auto-sync:${Date.now()}:${Math.random().toString(16).slice(2)}`;

  const lock = await acquireLock({ key: "aws_auto_sync", ttlMs: 15 * 60 * 1000, owner: runId });
  if (!lock.ok) {
    return NextResponse.json({ ok: true, skipped: true, reason: "locked" }, { status: 200 });
  }

  const startedAt = new Date();

  try {
    await ensureAwsIndexes();

    const db = await getDb();
    const connCol = db.collection("aws_connections"); // untyped to avoid schema friction

    const cutoff = new Date(Date.now() - hoursToMs(safeMinHours));

    const conns = await connCol
      .find(
        {
          status: "connected",
          $or: [{ lastSyncAt: { $exists: false } }, { lastSyncAt: { $lte: cutoff } }],
        },
        { projection: { userId: 1, lastSyncAt: 1 } }
      )
      .limit(safeMax)
      .toArray();

    const users: ObjectId[] = conns
      .map((c: any) => c.userId)
      .filter((id: any) => id && typeof id === "object");

    const results = await runPool(users, safeConc, async (userId) => {
      const r = await syncAwsForUser({ userId, days: safeDays });
      return { userId: String(userId), result: r };
    });

    const ok = results.filter((r) => r.result.ok).length;
    const failed = results.length - ok;

    const endedAt = new Date();

    return NextResponse.json({
      ok: true,
      runId,
      startedAt,
      endedAt,
      config: { days: safeDays, maxUsers: safeMax, minHours: safeMinHours, concurrency: safeConc },
      scanned: conns.length,
      processed: results.length,
      success: ok,
      failed,
      failures: results
        .filter((r) => !r.result.ok)
        .slice(0, 25)
        .map((r) => ({ userId: r.userId, code: (r.result as any).code, message: (r.result as any).message })),
    });
  } finally {
    await releaseLock({ key: "aws_auto_sync", owner: runId });
  }
}
