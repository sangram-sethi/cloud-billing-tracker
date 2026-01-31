import { NextResponse } from "next/server";
import { ObjectId, type Filter } from "mongodb";

import { auth } from "@/auth";
import { anomaliesCol, awsConnectionsCol } from "@/lib/aws/collections";

export const runtime = "nodejs";

type AwsConnView = {
  status?: string | null;
  lastSyncAt?: Date | string | null;
};

type AnomalyView = {
  _id: ObjectId;
  date?: string | null; // YYYY-MM-DD
  service?: string | null;
  severity?: string | null;
  status?: string | null;
  message?: string | null;

  observed?: unknown;
  baseline?: unknown;
  pctChange?: unknown;
  zScore?: unknown;

  aiStatus?: string | null;
  aiInsight?: unknown;

  updatedAt?: Date | string | null;
  createdAt?: Date | string | null;
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

function parseQuery(req: Request): { days: number; limit: number; severity: string; status: string } {
  try {
    const url = new URL(req.url);
    const daysRaw = url.searchParams.get("days");
    const limitRaw = url.searchParams.get("limit");
    const severity = url.searchParams.get("severity") || "all";
    const status = url.searchParams.get("status") || "open";

    const daysN = daysRaw ? Number(daysRaw) : 30;
    const limitN = limitRaw ? Number(limitRaw) : 50;

    return {
      days: clamp(Number.isFinite(daysN) ? Math.floor(daysN) : 30, 7, 365),
      limit: clamp(Number.isFinite(limitN) ? Math.floor(limitN) : 50, 10, 200),
      severity,
      status,
    };
  } catch {
    return { days: 30, limit: 50, severity: "all", status: "open" };
  }
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

  const { days, limit, severity, status } = parseQuery(req);

  const start = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const startYmd = ymdUTC(new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate())));

  const connCol = await awsConnectionsCol();
  const connRaw = await connCol.findOne({ userId });
  const conn = (connRaw as unknown as AwsConnView | null) ?? null;

  const connected = conn?.status === "connected";
  const lastSyncAt = conn?.lastSyncAt ? new Date(conn.lastSyncAt).toISOString() : null;

  // Build a safe filter without any
  const filter = {
    userId,
    date: { $gte: startYmd },
    ...(status && status !== "all" ? { status } : {}),
    ...(severity && severity !== "all" ? { severity } : {}),
  };

  const aCol = await anomaliesCol();
  const docsRaw = await aCol
    .find(filter as unknown as Filter<unknown>)
    .sort({ date: -1, createdAt: -1 })
    .limit(limit)
    .toArray();

  const docs = docsRaw as unknown as AnomalyView[];

  const anomalies = docs.map((d) => ({
    id: String(d._id),
    date: d.date ?? null,
    service: d.service ?? null,
    severity: d.severity ?? null,
    status: d.status ?? "open",
    message: d.message ?? null,
    observed: typeof d.observed === "number" ? d.observed : null,
    baseline: typeof d.baseline === "number" ? d.baseline : null,
    pctChange: typeof d.pctChange === "number" ? d.pctChange : null,
    zScore: typeof d.zScore === "number" ? d.zScore : null,
    aiStatus: d.aiStatus ?? null,
    aiInsight: d.aiInsight ?? null,
    updatedAt: d.updatedAt ? new Date(d.updatedAt).toISOString() : null,
    createdAt: d.createdAt ? new Date(d.createdAt).toISOString() : null,
  }));

  return NextResponse.json({
    ok: true,
    connected,
    lastSyncAt,
    days,
    anomalies,
  });
}
