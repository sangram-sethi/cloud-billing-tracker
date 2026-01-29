import { NextResponse } from "next/server";
import { z } from "zod";
import { ObjectId, type AnyBulkWriteOperation } from "mongodb";

import { auth } from "@/auth";
import { checkRateLimit } from "@/lib/rateLimit";

import { ensureAwsIndexes } from "@/lib/aws/indexes";
import { awsConnectionsCol, costDailyCol, anomaliesCol } from "@/lib/aws/collections";
import { decryptCredential } from "@/lib/aws/crypto";
import { pullDailyCostsLastNDays } from "@/lib/aws/pullDailyCosts";
import { computeTotalAnomalies, type TotalDailyPoint } from "@/lib/aws/anomalyEngine";

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

  // Rate limit (heavy-ish operation)
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

  const connCol = await awsConnectionsCol();
  const conn = await connCol.findOne({ userId });

  if (!conn || conn.status !== "connected") {
    return NextResponse.json({ ok: false, error: "AWS not connected. Connect AWS first." }, { status: 400 });
  }

  // Cooldown to prevent button spam
  if (conn.lastSyncAt) {
    const msSince = Date.now() - new Date(conn.lastSyncAt).getTime();
    const cooldownMs = 2 * 60 * 1000; // 2 min
    if (msSince < cooldownMs) {
      const retryAfter = Math.ceil((cooldownMs - msSince) / 1000);
      return NextResponse.json(
        { ok: false, error: `Please wait ${retryAfter}s before syncing again.`, retryAfter },
        { status: 429 }
      );
    }
  }

  let secretAccessKey: string;
  try {
    secretAccessKey = decryptCredential(conn.secretAccessKeyEnc);
  } catch {
    await connCol.updateOne(
      { userId },
      {
        $set: {
          status: "failed",
          lastError: "Stored AWS credentials could not be decrypted. Please reconnect AWS.",
          updatedAt: new Date(),
        },
      }
    );
    return NextResponse.json({ ok: false, error: "AWS credentials invalid. Please reconnect." }, { status: 400 });
  }

  const now = new Date();

  const pulled = await pullDailyCostsLastNDays({
    creds: { accessKeyId: conn.accessKeyId, secretAccessKey },
    days,
  });

  if (!pulled.ok) {
    await connCol.updateOne(
      { userId },
      {
        $set: {
          status: pulled.code === "INVALID_CREDENTIALS" || pulled.code === "ACCESS_DENIED" ? "failed" : conn.status,
          lastError: pulled.message,
          updatedAt: new Date(),
        },
      }
    );

    const status =
      pulled.code === "INVALID_CREDENTIALS"
        ? 401
        : pulled.code === "ACCESS_DENIED"
          ? 403
          : pulled.code === "THROTTLED"
            ? 429
            : 502;

    return NextResponse.json({ ok: false, error: pulled.message, code: pulled.code }, { status });
  }

  // 1) Store daily costs (idempotent upserts)
  const costCol = await costDailyCol();

  const costOps: AnyBulkWriteOperation<any>[] = pulled.rows.map((r) => ({
    updateOne: {
      filter: { userId, date: r.date, service: r.service },
      update: {
        $set: {
          amount: r.amount,
          currency: r.currency,
          source: "aws_ce",
          updatedAt: now,
        },
        $setOnInsert: {
          createdAt: now,
          userId,
          date: r.date,
          service: r.service,
        },
      },
      upsert: true,
    },
  }));

  if (costOps.length > 0) {
    await costCol.bulkWrite(costOps, { ordered: false });
  }

  // 2) Compute anomalies (TOTAL only) from pulled totals
  const totalPoints: TotalDailyPoint[] = pulled.rows
    .filter((r) => r.service === "__TOTAL__")
    .map((r) => ({ date: r.date, amount: r.amount, currency: r.currency }));

  const anomalies = computeTotalAnomalies(totalPoints);

  // 3) Store anomalies (idempotent upserts)
  const aCol = await anomaliesCol();
  const aOps: AnyBulkWriteOperation<any>[] = anomalies.map((a) => ({
    updateOne: {
      filter: { userId, date: a.date, service: a.service },
      update: {
        $set: {
          observed: a.observed,
          baseline: a.baseline,
          pctChange: a.pctChange,
          zScore: a.zScore,
          severity: a.severity,
          message: a.message,
          status: "open",
          // AI is optional; keep null for now
          aiInsight: null,
          aiStatus: null,
          updatedAt: now,
        },
        $setOnInsert: {
          createdAt: now,
          userId,
          date: a.date,
          service: a.service,
        },
      },
      upsert: true,
    },
  }));

  if (aOps.length > 0) {
    await aCol.bulkWrite(aOps, { ordered: false });
  }

  // 4) Mark sync success on connection doc
  await connCol.updateOne(
    { userId },
    {
      $set: {
        status: "connected",
        lastSyncAt: now,
        lastError: null,
        updatedAt: now,
      },
    }
  );

  const daySet = new Set(pulled.rows.map((r) => r.date));
  const serviceSet = new Set(pulled.rows.filter((r) => r.service !== "__TOTAL__").map((r) => r.service));

  return NextResponse.json({
    ok: true,
    range: { start: pulled.start, endExclusive: pulled.endExclusive, days },
    stored: {
      days: daySet.size,
      services: serviceSet.size,
      rows: pulled.rows.length,
    },
    anomalies: {
      totalOnly: true,
      count: anomalies.length,
    },
    syncedAt: now,
  });
}
