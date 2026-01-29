import type { ObjectId } from "mongodb";
import { costDailyCol } from "@/lib/aws/collections";

function fmtMoney(amount: number, currency: string) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 2 }).format(
    Number.isFinite(amount) ? amount : 0
  );
}

function addDays(ymd: string, delta: number) {
  const d = new Date(ymd + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().slice(0, 10);
}

function listPrevDays(date: string, n: number) {
  const out: string[] = [];
  for (let i = n; i >= 1; i--) out.push(addDays(date, -i));
  return out;
}

export async function buildRulesInsight(params: {
  userId: ObjectId;
  date: string;
  service: string; // "__TOTAL__" or service name
  currency: string;
  observed: number;
  baseline: number;
  pctChange: number;
}) {
  const costCol = await costDailyCol();

  // Top spenders for the anomaly day (excluding total)
  const dayTop = await costCol
    .find({ userId: params.userId, date: params.date, service: { $ne: "__TOTAL__" } })
    .sort({ amount: -1 })
    .limit(6)
    .toArray();

  const topServices = dayTop.map((d) => String(d.service));
  const prevDates = listPrevDays(params.date, 7);

  // Pull previous 7 days for these services (for a simple average)
  const prevRows = await costCol
    .find({
      userId: params.userId,
      date: { $in: prevDates },
      service: { $in: topServices },
    })
    .toArray();

  const sums = new Map<string, { sum: number; count: number }>();
  for (const r of prevRows) {
    const k = String(r.service);
    const cur = sums.get(k) ?? { sum: 0, count: 0 };
    cur.sum += Number(r.amount ?? 0);
    cur.count += 1;
    sums.set(k, cur);
  }

  const drivers = dayTop.map((r) => {
    const svc = String(r.service);
    const today = Number(r.amount ?? 0);
    const avg = (() => {
      const s = sums.get(svc);
      if (!s || s.count === 0) return 0;
      return s.sum / s.count;
    })();
    const delta = today - avg;
    const pct = avg > 0 ? delta / avg : Number.POSITIVE_INFINITY;

    return { svc, today, avg, delta, pct };
  });

  const header =
    params.service === "__TOTAL__"
      ? `**Total spend anomaly** on **${params.date}**`
      : `**Service anomaly** for **${params.service}** on **${params.date}**`;

  const baselineLine = `Observed: **${fmtMoney(params.observed, params.currency)}** · 7-day baseline: **${fmtMoney(
    params.baseline,
    params.currency
  )}** · Jump: **${Number.isFinite(params.pctChange) ? Math.round(params.pctChange * 100) + "%" : "∞"}**`;

  const driversLines =
    drivers.length === 0
      ? `No service breakdown available for that day yet (sync again if you just connected).`
      : [
          `**Top drivers (today vs 7-day avg):**`,
          ...drivers.slice(0, 5).map((d) => {
            const pctTxt = Number.isFinite(d.pct) ? `${Math.round(d.pct * 100)}%` : "∞";
            return `- ${d.svc}: ${fmtMoney(d.today, params.currency)} (avg ${fmtMoney(d.avg, params.currency)}, Δ ${fmtMoney(
              d.delta,
              params.currency
            )}, ${pctTxt})`;
          }),
        ].join("\n");

  return [header, baselineLine, "", driversLines].join("\n");
}
