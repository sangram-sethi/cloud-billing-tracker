import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";

type TopServiceRow = { service: string; amount: number };

type AnomalySeverity = "info" | "warning" | "critical";

type AnomalyRow = {
  date: string;
  service: string;
  severity: AnomalySeverity;
  message: string;
  observed: number;
  baseline: number;
  pctChange: number;
  zScore: number | null;
};

export type WeeklyFounderReport = {
  range: { start: string; end: string }; // inclusive ymd
  currency: string;
  total: {
    last7: number;
    prev7: number;
    delta: number;
    deltaPct: number | null;
    daily: Array<{ date: string; amount: number }>;
  };
  topServices: TopServiceRow[];
  anomalies: AnomalyRow[];
};

type CostDailyDoc = {
  userId: ObjectId;
  date: string; // ymd
  service: string;
  amount: number;
  currency?: string | null;
};

type AnomalyDoc = {
  userId: ObjectId;
  date: string; // ymd
  service: string;
  severity: unknown;
  message?: string | null;
  observed?: number | null;
  baseline?: number | null;
  pctChange?: number | null;
  zScore?: number | null;
};

type TopServiceAggRow = { service: string; amount: number };

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function ymdUTC(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function parseYmd(ymd: string): Date {
  return new Date(`${ymd}T00:00:00Z`);
}

function addDays(ymd: string, delta: number): string {
  const d = parseYmd(ymd);
  d.setUTCDate(d.getUTCDate() + delta);
  return ymdUTC(d);
}

function listDates(start: string, endExclusive: string): string[] {
  const out: string[] = [];
  let cur = parseYmd(start);
  const end = parseYmd(endExclusive);
  while (cur < end) {
    out.push(ymdUTC(cur));
    cur = new Date(cur.getTime() + 24 * 60 * 60 * 1000);
  }
  return out;
}

function startOfTodayUTC(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

function safeNumber(v: unknown): number {
  return typeof v === "number" && Number.isFinite(v) ? v : 0;
}

function parseSeverity(v: unknown): AnomalySeverity {
  const s = String(v ?? "").toLowerCase();
  if (s === "critical" || s === "high") return "critical";
  if (s === "warning" || s === "warn" || s === "medium") return "warning";
  if (s === "info" || s === "low") return "info";
  // default for anomaly list here: if it's in DB but weird, keep it safe
  return "warning";
}

export function defaultWeeklyWindow(): { start: string; end: string; endExclusive: string } {
  // Last 7 complete days ending yesterday (UTC)
  const endExclusive = ymdUTC(startOfTodayUTC()); // today 00:00 UTC
  const end = addDays(endExclusive, -1); // yesterday
  const start = addDays(endExclusive, -7); // 7 days window start (inclusive)
  return { start, end, endExclusive };
}

export async function buildWeeklyFounderReport(params: {
  userId: ObjectId;
  start?: string; // inclusive ymd
  endExclusive?: string; // exclusive ymd
}): Promise<WeeklyFounderReport | null> {
  const db = await getDb();

  const cost = db.collection<CostDailyDoc>("cost_daily");
  const anomalies = db.collection<AnomalyDoc>("anomalies");

  const window = (() => {
    if (params.start && params.endExclusive) {
      const end = addDays(params.endExclusive, -1);
      return { start: params.start, end, endExclusive: params.endExclusive };
    }
    return defaultWeeklyWindow();
  })();

  const prevStart = addDays(window.start, -7);
  const prevEndExclusive = window.start;

  const days = listDates(window.start, window.endExclusive);

  // Pull TOTAL series for last 14 days (prev 7 + last 7)
  const totalRows = await cost
    .find(
      {
        userId: params.userId,
        service: "__TOTAL__",
        date: { $gte: prevStart, $lt: window.endExclusive },
      },
      { projection: { date: 1, amount: 1, currency: 1 } }
    )
    .toArray();

  const currency =
    totalRows.find((r) => typeof r.currency === "string" && r.currency.trim().length > 0)?.currency ?? "USD";

  const totalMap = new Map<string, number>();
  for (const r of totalRows) {
    if (typeof r.date !== "string" || !r.date) continue;
    totalMap.set(r.date, safeNumber(r.amount));
  }

  const last7Daily = days.map((d) => ({ date: d, amount: totalMap.get(d) ?? 0 }));
  const last7 = last7Daily.reduce((s, x) => s + x.amount, 0);

  const prevDays = listDates(prevStart, prevEndExclusive);
  const prev7 = prevDays.reduce((s, d) => s + (totalMap.get(d) ?? 0), 0);

  const delta = last7 - prev7;
  const deltaPct = prev7 > 0 ? delta / prev7 : null;

  // Top services (last 7)
  const topServicesAgg = await cost
    .aggregate<TopServiceAggRow>([
      {
        $match: {
          userId: params.userId,
          date: { $gte: window.start, $lt: window.endExclusive },
          service: { $ne: "__TOTAL__" },
        },
      },
      { $group: { _id: "$service", amount: { $sum: "$amount" } } },
      { $sort: { amount: -1 } },
      { $limit: 6 },
      { $project: { _id: 0, service: "$_id", amount: 1 } },
    ])
    .toArray();

  const topServices: TopServiceRow[] = topServicesAgg.map((r) => ({
    service: typeof r.service === "string" ? r.service : String((isRecord(r) ? r.service : "") ?? ""),
    amount: safeNumber(r.amount),
  }));

  // Anomalies in last 7 (warning/critical)
  const anomRows = await anomalies
    .find(
      {
        userId: params.userId,
        date: { $gte: window.start, $lt: window.endExclusive },
        severity: { $in: ["warning", "critical"] },
      },
      { projection: { date: 1, service: 1, severity: 1, message: 1, observed: 1, baseline: 1, pctChange: 1, zScore: 1 } }
    )
    .sort({ date: -1 })
    .limit(10)
    .toArray();

  const anomList: AnomalyRow[] = anomRows.map((a) => ({
    date: typeof a.date === "string" ? a.date : String(a.date ?? ""),
    service: typeof a.service === "string" ? a.service : String(a.service ?? ""),
    severity: parseSeverity(a.severity),
    message: typeof a.message === "string" ? a.message : "",
    observed: safeNumber(a.observed),
    baseline: safeNumber(a.baseline),
    pctChange: safeNumber(a.pctChange),
    zScore: a.zScore == null ? null : safeNumber(a.zScore),
  }));

  // If literally nothing to report (very early user), skip sending
  const hasAny = last7 > 0 || topServices.some((t) => t.amount > 0) || anomList.length > 0;
  if (!hasAny) return null;

  return {
    range: { start: window.start, end: window.end },
    currency,
    total: { last7, prev7, delta, deltaPct, daily: last7Daily },
    topServices,
    anomalies: anomList,
  };
}
