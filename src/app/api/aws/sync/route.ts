import { NextResponse } from "next/server";
import { z } from "zod";
import { ObjectId, type AnyBulkWriteOperation } from "mongodb";

import { auth } from "@/auth";
import { checkRateLimit } from "@/lib/rateLimit";

import { ensureAwsIndexes } from "@/lib/aws/indexes";
import { awsConnectionsCol, costDailyCol, anomaliesCol } from "@/lib/aws/collections";
import { decryptCredential } from "@/lib/aws/crypto";
import { pullDailyCostsLastNDays } from "@/lib/aws/pullDailyCosts";
import { computeTotalAnomalies, computeServiceAnomalies, type DailyPoint } from "@/lib/aws/anomalyEngine";

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

function ymdUTC(d: Date) {
  return d.toISOString().slice(0, 10);
}

function parseYmdToUTCDate(ymd: string) {
  return new Date(ymd + "T00:00:00Z");
}

function listDates(start: string, endExclusive: string) {
  const out: string[] = [];
  let cur = parseYmdToUTCDate(start);
  const end = parseYmdToUTCDate(endExclusive);
  while (cur < end) {
    out.push(ymdUTC(cur));
    cur = new Date(cur.getTime() + 24 * 60 * 60 * 1000);
  }
  return out;
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

  // Build date axis for filling missing days (critical for stable service baselines)
  const dates = listDates(pulled.start, pulled.endExclusive);
  const currency = pulled.rows.find((r) => r.service === "__TOTAL__")?.currency ?? "USD";

  // 2) TOTAL anomalies from filled totals
  const totalMap = new Map<string, number>();
  for (const r of pulled.rows) {
    if (r.service !== "__TOTAL__") continue;
    totalMap.set(r.date, r.amount);
  }
  const totalSeries: DailyPoint[] = dates.map((date) => ({
    date,
    amount: totalMap.get(date) ?? 0,
    currency,
  }));
  const totalAnoms = computeTotalAnomalies(totalSeries);

  // 3) Service anomalies for top services by 30d spend (keeps list premium + not noisy)
  const sums = new Map<string, number>();
  const serviceDateAmount = new Map<string, Map<string, number>>();

  for (const r of pulled.rows) {
    if (r.service === "__TOTAL__") continue;

    sums.set(r.service, (sums.get(r.service) ?? 0) + r.amount);

    let m = serviceDateAmount.get(r.service);
    if (!m) {
      m = new Map();
      serviceDateAmount.set(r.service, m);
    }
    m.set(r.date, r.amount);
  }

  const topServices = [...sums.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([svc]) => svc);

  const seriesByService = new Map<string, DailyPoint[]>();
  for (const svc of topServices) {
    const dm = serviceDateAmount.get(svc) ?? new Map<string, number>();
    seriesByService.set(
      svc,
      dates.map((date) => ({
        date,
        amount: dm.get(date) ?? 0,
        currency,
      }))
    );
  }

  const serviceAnoms = computeServiceAnomalies({ seriesByService, topServices, currency });

  const anomalies = [...totalAnoms, ...serviceAnoms];

  // 4) Store anomalies (idempotent upserts)
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

  // 5) Mark sync success
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
      totalOnly: false,
      totalCount: totalAnoms.length,
      serviceCount: serviceAnoms.length,
      count: anomalies.length,
      topServicesScanned: topServices.length,
    },
    syncedAt: now,
  });
}
