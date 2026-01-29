import { ObjectId } from "mongodb";
import { auth } from "@/auth";
import { getDb } from "@/lib/mongodb";
import { UsageChartClient, type UsageViewModel } from "@/components/app/UsageChartClient";

function toObjectId(value: unknown): ObjectId | null {
  if (!value) return null;
  if (value instanceof ObjectId) return value;
  if (typeof value === "string" && ObjectId.isValid(value)) return new ObjectId(value);
  try {
    const s = String(value);
    if (ObjectId.isValid(s)) return new ObjectId(s);
  } catch {
    // ignore
  }
  return null;
}

function ymdUTC(d: Date) {
  return d.toISOString().slice(0, 10);
}

function utcMidnightDaysAgo(n: number) {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - n);
  return d;
}

export default async function UsagePage() {
  const session = await auth();
  const userId = toObjectId(session?.user?.id);

  const model: UsageViewModel = {
    status: "not_connected",
    currency: "USD",
    points: [],
    total: 0,
    lastDay: null,
    lastSyncAt: null,
    topServices: [],
  };

  if (!userId) {
    return <UsageChartClient model={model} />;
  }

  const db = await getDb();

  const conn = await db.collection<any>("aws_connections").findOne({ userId });
  if (conn) {
    model.status = conn.status === "connected" ? "connected" : "failed";
    model.lastSyncAt = conn.lastSyncAt ? new Date(conn.lastSyncAt).toISOString() : null;
  }

  // Match sync: Start = 30 days ago, End = today (exclusive) -> 30 daily points ending yesterday.
  const start = ymdUTC(utcMidnightDaysAgo(30));

  if (model.status === "connected") {
    const costCol = db.collection<any>("cost_daily");

    const totals = await costCol
      .find({ userId, service: "__TOTAL__", date: { $gte: start } })
      .sort({ date: 1 })
      .toArray();

    const map = new Map<string, { amount: number; currency: string }>();
    for (const t of totals) {
      if (typeof t?.date !== "string") continue;
      const amount = Number(t?.amount ?? 0);
      const currency = String(t?.currency ?? "USD");
      map.set(t.date, { amount: Number.isFinite(amount) ? amount : 0, currency });
    }

    const points: { date: string; amount: number }[] = [];
    let currency = totals?.[0]?.currency ? String(totals[0].currency) : "USD";

    const startDate = utcMidnightDaysAgo(30);
    for (let i = 0; i < 30; i++) {
      const d = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
      const date = ymdUTC(d);
      const row = map.get(date);
      if (row?.currency) currency = row.currency;
      points.push({ date, amount: row ? row.amount : 0 });
    }

    model.currency = currency;
    model.points = points;
    model.total = points.reduce((s, p) => s + p.amount, 0);
    model.lastDay = points.length ? points[points.length - 1].amount : null;

    const topServices = await costCol
      .aggregate([
        { $match: { userId, date: { $gte: start }, service: { $ne: "__TOTAL__" } } },
        { $group: { _id: "$service", amount: { $sum: "$amount" } } },
        { $sort: { amount: -1 } },
        { $limit: 6 },
        { $project: { _id: 0, service: "$_id", amount: 1 } },
      ])
      .toArray();

    model.topServices = topServices
      .filter((x: any) => typeof x?.service === "string")
      .map((x: any) => ({ service: String(x.service), amount: Number(x.amount ?? 0) }))
      .filter((x: any) => Number.isFinite(x.amount) && x.amount > 0);
  }

  return <UsageChartClient model={model} />;
}
