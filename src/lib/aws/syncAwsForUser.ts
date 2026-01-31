import { ObjectId, type AnyBulkWriteOperation } from "mongodb";

import { ensureAwsIndexes } from "@/lib/aws/indexes";
import { awsConnectionsCol, costDailyCol, anomaliesCol } from "@/lib/aws/collections";
import type { AnomalyDoc, CostDailyDoc } from "@/lib/aws/types";
import { decryptCredential } from "@/lib/aws/crypto";
import { pullDailyCostsLastNDays } from "@/lib/aws/pullDailyCosts";
import { computeTotalAnomalies, computeServiceAnomalies, type DailyPoint } from "@/lib/aws/anomalyEngine";
import { sendAnomalyEmailAlerts } from "@/lib/notifications/sendAnomalyEmailAlerts";
import { sendAnomalyWhatsAppAlerts } from "@/lib/notifications/sendAnomalyWhatsAppAlerts";

export type SyncAwsOk = {
  ok: true;
  range: { start: string; endExclusive: string; days: number };
  stored: { days: number; services: number; rows: number };
  anomalies: {
    totalOnly: false;
    totalCount: number;
    serviceCount: number;
    count: number;
    topServicesScanned: number;
  };
  syncedAt: Date;
};

export type SyncAwsErr = {
  ok: false;
  code: string;
  message: string;
};

export type SyncAwsResult = SyncAwsOk | SyncAwsErr;

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

export async function syncAwsForUser(params: { userId: ObjectId; days: number }): Promise<SyncAwsResult> {
  const { userId, days } = params;

  await ensureAwsIndexes();

  const connCol = await awsConnectionsCol();
  const conn = await connCol.findOne({ userId });

  if (!conn || conn.status !== "connected") {
    return { ok: false, code: "NOT_CONNECTED", message: "AWS not connected." };
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
    return { ok: false, code: "INVALID_CREDENTIALS", message: "AWS credentials invalid. Please reconnect." };
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

    return { ok: false, code: pulled.code, message: pulled.message };
  }

  // 1) Store daily costs
  const costCol = await costDailyCol();

  const costOps: AnyBulkWriteOperation<CostDailyDoc>[] = pulled.rows.map(
    (r): AnyBulkWriteOperation<CostDailyDoc> => ({
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
    })
  );

  if (costOps.length > 0) {
    await costCol.bulkWrite(costOps, { ordered: false });
  }

  const dates = listDates(pulled.start, pulled.endExclusive);
  const currency = pulled.rows.find((r) => r.service === "__TOTAL__")?.currency ?? "USD";

  // 2) TOTAL anomalies
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

  // 3) Service anomalies (top services by spend)
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

  const allAnomalies = [...totalAnoms, ...serviceAnoms];

  // 4) Store anomalies (idempotent upserts)
  const aCol = await anomaliesCol();

  const aOps: AnyBulkWriteOperation<AnomalyDoc>[] = allAnomalies.map(
    (a): AnyBulkWriteOperation<AnomalyDoc> => ({
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
            updatedAt: now,
          },
          $setOnInsert: {
            createdAt: now,
            userId,
            date: a.date,
            service: a.service,
            status: "open",
            aiInsight: null,
            aiStatus: null,
          },
        },
        upsert: true,
      },
    })
  );

  if (aOps.length > 0) {
    await aCol.bulkWrite(aOps, { ordered: false });
  }

  // Step 8: Email alerts (deduped)
  try {
    await sendAnomalyEmailAlerts({
      userId,
      anomalies: allAnomalies.map((a) => ({
        date: a.date,
        service: a.service,
        severity: a.severity,
        message: a.message,
        observed: a.observed,
        baseline: a.baseline,
        pctChange: a.pctChange,
        zScore: a.zScore,
        status: "open",
      })),
      currency,
      minSeverity: "warning",
    });
  } catch {
    // never crash sync
  }

  // ✅ Step 10: WhatsApp alerts (deduped, requires verified+enabled)
  try {
    await sendAnomalyWhatsAppAlerts({
      userId,
      anomalies: allAnomalies.map((a) => ({
        date: a.date,
        service: a.service,
        severity: a.severity,
        message: a.message,
        observed: a.observed,
        baseline: a.baseline,
        pctChange: a.pctChange,
        zScore: a.zScore,
        status: "open",
      })),
      currency,
      minSeverity: "warning",
    });
  } catch {
    // never crash sync
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

  return {
    ok: true,
    range: { start: pulled.start, endExclusive: pulled.endExclusive, days },
    stored: { days: daySet.size, services: serviceSet.size, rows: pulled.rows.length },
    anomalies: {
      totalOnly: false,
      totalCount: totalAnoms.length,
      serviceCount: serviceAnoms.length,
      count: allAnomalies.length,
      topServicesScanned: topServices.length,
    },
    syncedAt: now,
  };
}
