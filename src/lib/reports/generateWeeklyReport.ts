import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";

// These exist in your repo from earlier steps (used by Usage/Anomalies).
import { costDailyCol, anomaliesCol } from "@/lib/aws/collections";

type WeeklyTopService = {
  service: string;
  amount: number;
  prevAmount: number;
  delta: number;
  deltaPct: number | null;
};

type WeeklyReport = {
  userId: ObjectId;

  periodStart: string; // YYYY-MM-DD (UTC)
  periodEnd: string; // YYYY-MM-DD (UTC, inclusive)

  prevStart: string;
  prevEnd: string;

  currency: string;

  total: number;
  prevTotal: number;
  delta: number;
  deltaPct: number | null;

  topServices: WeeklyTopService[];

  anomalies: {
    totalCount: number;
    criticalCount: number;
    warningCount: number;
    top: Array<{ date: string; service: string; severity: string; message: string }>;
  };

  createdAt: Date;
  updatedAt: Date;

  emailedAt?: Date | null;
  emailStatus?: "sent" | "unavailable" | "quota" | "error" | null;
};

type CostRow = {
  date: string;
  service: string;
  amount: number;
  currency?: string | null;
};

type AnomalyRow = {
  date?: string;
  service?: string;
  severity?: unknown;
  message?: string;
  pctChange?: number;
  createdAt?: Date | string;
};

type SeverityBucket = "critical" | "warning" | "neutral";

type ScoredAnomaly = {
  date: string;
  service: string;
  severity: string;
  message: string;
  bucket: SeverityBucket;
  pctAbs: number;
  createdMs: number;
};

function ymdUTC(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function utcDay(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function addDaysUTC(d: Date, days: number): Date {
  return new Date(d.getTime() + days * 24 * 60 * 60 * 1000);
}

function pctDelta(curr: number, prev: number): number | null {
  if (!Number.isFinite(prev) || prev <= 0) return null;
  return (curr - prev) / prev;
}

function severityBucket(raw: unknown): SeverityBucket {
  const s = String(raw ?? "").toLowerCase();
  if (s.includes("critical") || s.includes("high")) return "critical";
  if (s.includes("warn") || s.includes("medium")) return "warning";
  return "neutral";
}

function bucketWeight(b: SeverityBucket): number {
  if (b === "critical") return 2;
  if (b === "warning") return 1;
  return 0;
}

function safeNumber(v: unknown): number {
  return typeof v === "number" && Number.isFinite(v) ? v : 0;
}

function toCreatedMs(v: unknown): number {
  if (v instanceof Date) return Number.isFinite(v.getTime()) ? v.getTime() : 0;
  if (typeof v === "string") {
    const d = new Date(v);
    return Number.isFinite(d.getTime()) ? d.getTime() : 0;
  }
  return 0;
}

export async function generateWeeklyReport(params: { userId: ObjectId; days?: number }): Promise<WeeklyReport> {
  const days = Math.max(7, Math.min(30, Math.floor(params.days ?? 7)));

  const today = utcDay(new Date());
  const periodEnd = today; // inclusive
  const periodStart = addDaysUTC(today, -(days - 1));

  const prevEnd = addDaysUTC(periodStart, -1);
  const prevStart = addDaysUTC(prevEnd, -(days - 1));

  const startYmd = ymdUTC(periodStart);
  const endYmd = ymdUTC(periodEnd);
  const prevStartYmd = ymdUTC(prevStart);
  const prevEndYmd = ymdUTC(prevEnd);

  const cCol = await costDailyCol();
  const aCol = await anomaliesCol();

  // Cost rows (we prefer __TOTAL__ if present; else sum services)
  const costRows = await cCol
    .find<CostRow>(
      {
        userId: params.userId,
        date: { $gte: prevStartYmd, $lte: endYmd },
      },
      { projection: { _id: 0, date: 1, service: 1, amount: 1, currency: 1 } }
    )
    .toArray();

  const currency =
    costRows.find((r) => typeof r.currency === "string" && r.currency.trim().length > 0)?.currency ?? "USD";

  const totalByDate = new Map<string, number>();
  const hasTotals = costRows.some((r) => r.service === "__TOTAL__");

  if (hasTotals) {
    for (const r of costRows) {
      if (r.service !== "__TOTAL__") continue;
      if (typeof r.date !== "string" || !r.date) continue;
      const amt = safeNumber(r.amount);
      totalByDate.set(r.date, (totalByDate.get(r.date) ?? 0) + amt);
    }
  } else {
    for (const r of costRows) {
      if (r.service === "__TOTAL__") continue;
      if (typeof r.date !== "string" || !r.date) continue;
      const amt = safeNumber(r.amount);
      totalByDate.set(r.date, (totalByDate.get(r.date) ?? 0) + amt);
    }
  }

  function sumTotal(from: string, to: string): number {
    let sum = 0;
    // lexicographic works for YYYY-MM-DD
    for (const [date, amt] of totalByDate.entries()) {
      if (date >= from && date <= to) sum += amt;
    }
    return sum;
  }

  const total = sumTotal(startYmd, endYmd);
  const prevTotal = sumTotal(prevStartYmd, prevEndYmd);

  // By-service (exclude __TOTAL__)
  const currSvc = new Map<string, number>();
  const prevSvc = new Map<string, number>();

  for (const r of costRows) {
    const svc = typeof r.service === "string" ? r.service : "";
    if (!svc || svc === "__TOTAL__") continue;

    const amt = safeNumber(r.amount);
    const date = typeof r.date === "string" ? r.date : "";
    if (!date) continue;

    if (date >= startYmd && date <= endYmd) {
      currSvc.set(svc, (currSvc.get(svc) ?? 0) + amt);
    } else if (date >= prevStartYmd && date <= prevEndYmd) {
      prevSvc.set(svc, (prevSvc.get(svc) ?? 0) + amt);
    }
  }

  const svcUnion = new Set<string>([...currSvc.keys(), ...prevSvc.keys()]);
  const topServices: WeeklyTopService[] = [...svcUnion]
    .map((service) => {
      const amount = currSvc.get(service) ?? 0;
      const prevAmount = prevSvc.get(service) ?? 0;
      const delta = amount - prevAmount;
      return {
        service,
        amount,
        prevAmount,
        delta,
        deltaPct: pctDelta(amount, prevAmount),
      };
    })
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 8);

  // Anomalies (current period)
  const anomalyDocs = await aCol
    .find<AnomalyRow>(
      { userId: params.userId, date: { $gte: startYmd, $lte: endYmd } },
      { projection: { date: 1, service: 1, severity: 1, message: 1, pctChange: 1, createdAt: 1 } }
    )
    .toArray();

  let criticalCount = 0;
  let warningCount = 0;

  const scored: ScoredAnomaly[] = anomalyDocs.map((a) => {
    const bucket = severityBucket(a.severity);
    if (bucket === "critical") criticalCount++;
    else if (bucket === "warning") warningCount++;

    const date = typeof a.date === "string" && a.date ? a.date : startYmd;
    const service = typeof a.service === "string" && a.service ? a.service : "Unknown";
    const sev = String(a.severity ?? "Unknown");
    const message = typeof a.message === "string" && a.message ? a.message : "—";
    const pct = typeof a.pctChange === "number" && Number.isFinite(a.pctChange) ? a.pctChange : 0;

    return {
      date,
      service,
      severity: sev,
      message,
      bucket,
      pctAbs: Math.abs(pct),
      createdMs: toCreatedMs(a.createdAt),
    };
  });

  const topAnomalies = scored
    .sort((x, y) => {
      const wx = bucketWeight(x.bucket);
      const wy = bucketWeight(y.bucket);
      if (wy !== wx) return wy - wx;
      if (y.pctAbs !== x.pctAbs) return y.pctAbs - x.pctAbs;
      return y.createdMs - x.createdMs;
    })
    .slice(0, 5)
    .map((a) => ({
      date: a.date,
      service: a.service,
      severity: a.severity,
      message: a.message,
    }));

  const now = new Date();

  const report: WeeklyReport = {
    userId: params.userId,

    periodStart: startYmd,
    periodEnd: endYmd,

    prevStart: prevStartYmd,
    prevEnd: prevEndYmd,

    currency,

    total,
    prevTotal,
    delta: total - prevTotal,
    deltaPct: pctDelta(total, prevTotal),

    topServices,

    anomalies: {
      totalCount: anomalyDocs.length,
      criticalCount,
      warningCount,
      top: topAnomalies,
    },

    createdAt: now,
    updatedAt: now,
    emailedAt: null,
    emailStatus: null,
  };

  // sanity: ensure collection exists (no-op but keeps db warm)
  const db = await getDb();
  await db
    .collection("weekly_reports")
    .findOne({ _id: new ObjectId("000000000000000000000000") })
    .catch(() => null);

  return report;
}

