import { NextResponse } from "next/server";
import { ObjectId, type Filter } from "mongodb";

import { auth } from "@/auth";
import { awsConnectionsCol, costDailyCol } from "@/lib/aws/collections";

export const runtime = "nodejs";

type AwsConnView = {
  status?: string | null;
  lastSyncAt?: Date | string | null;
};

type CostRowView = {
  date?: unknown; // YYYY-MM-DD
  service?: unknown;
  amount?: unknown;
  currency?: unknown;
};

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

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function parseDays(req: Request) {
  try {
    const url = new URL(req.url);
    const raw = url.searchParams.get("days");
    const n = raw ? Number(raw) : 30;
    return clamp(Number.isFinite(n) ? Math.floor(n) : 30, 7, 365);
  } catch {
    return 30;
  }
}

function safeString(v: unknown): string {
  return typeof v === "string" ? v : "";
}

function safeCurrency(v: unknown): string | undefined {
  const s = typeof v === "string" ? v.trim() : "";
  return s.length ? s : undefined;
}

function safeNumber(v: unknown): number {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = Number.parseFloat(v);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const userId = toObjectId(session.user.id);
  if (!userId) {
    return NextResponse.json({ ok: false, error: "Invalid session" }, { status: 500 });
  }

  const days = parseDays(req);

  const start = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const startYmd = ymdUTC(new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate())));

  const connCol = await awsConnectionsCol();
  const connRaw = await connCol.findOne({ userId });
  const conn = (connRaw as unknown as AwsConnView | null) ?? null;

  const connected = conn?.status === "connected";
  const lastSyncAt = conn?.lastSyncAt ? new Date(conn.lastSyncAt).toISOString() : null;

  const cCol = await costDailyCol();

  const filter = { userId, date: { $gte: startYmd } };

  const rowsRaw = await cCol
    .find(filter as unknown as Filter<unknown>, {
      projection: { _id: 0, date: 1, service: 1, amount: 1, currency: 1 },
    })
    .toArray();

  const rows = (rowsRaw as unknown as CostRowView[])
    .map((r) => {
      const date = safeString(r.date);
      const service = safeString(r.service);
      if (!date || !service) return null;

      return {
        date,
        service,
        amount: safeNumber(r.amount),
        currency: safeCurrency(r.currency),
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  const dates = [...new Set(rows.map((r) => r.date))].sort();

  const currency =
    rows.find((r) => r.service === "__TOTAL__" && typeof r.currency === "string")?.currency ||
    rows.find((r) => typeof r.currency === "string")?.currency ||
    "USD";

  // Totals: prefer __TOTAL__ if it exists; otherwise compute sum across services.
  const totalByDate = new Map<string, number>();

  for (const r of rows) {
    if (r.service === "__TOTAL__") {
      totalByDate.set(r.date, (totalByDate.get(r.date) ?? 0) + r.amount);
    }
  }

  if (totalByDate.size === 0) {
    for (const r of rows) {
      if (r.service === "__TOTAL__") continue;
      totalByDate.set(r.date, (totalByDate.get(r.date) ?? 0) + r.amount);
    }
  }

  const totals = dates.map((date) => ({ date, amount: Number(totalByDate.get(date) ?? 0) }));

  // By-service summary
  const byServiceMap = new Map<string, number>();
  for (const r of rows) {
    if (r.service === "__TOTAL__") continue;
    byServiceMap.set(r.service, (byServiceMap.get(r.service) ?? 0) + r.amount);
  }

  const serviceEntries = [...byServiceMap.entries()].sort((a, b) => b[1] - a[1]);
  const totalFromServices = serviceEntries.reduce((acc, [, v]) => acc + v, 0);
  const totalFromTotals = totals.reduce((acc, p) => acc + p.amount, 0);

  const grandTotal = totalFromServices || totalFromTotals || 1;

  const byService = serviceEntries.slice(0, 10).map(([service, amount]) => ({
    service,
    amount,
    pct: amount / grandTotal,
  }));

  return NextResponse.json({
    ok: true,
    connected,
    lastSyncAt,
    days,
    currency,
    totals,
    byService,
  });
}
