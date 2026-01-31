import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

import { auth } from "@/auth";
import { getDb } from "@/lib/mongodb";
import { sendWeeklyReportEmail } from "@/lib/reports/sendWeeklyReportEmail";

export const runtime = "nodejs";

function toObjectId(id: string) {
  try {
    return new ObjectId(id);
  } catch {
    return null;
  }
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function getString(v: unknown): string | null {
  return typeof v === "string" ? v : null;
}

function getNumber(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

function getArray(v: unknown): unknown[] {
  return Array.isArray(v) ? v : [];
}

type UserDoc = {
  _id: ObjectId;
  email?: string | null;
};

type WeeklyReportDoc = {
  _id: ObjectId;
  userId: ObjectId;

  periodStart?: unknown;
  periodEnd?: unknown;
  currency?: unknown;

  total?: unknown;
  prevTotal?: unknown;
  delta?: unknown;
  deltaPct?: unknown;

  topServices?: unknown;
  anomalies?: unknown;
};

type WeeklyReportAnomalies = {
  totalCount: number;
  criticalCount: number;
  warningCount: number;
  top: unknown[];
};

function normalizeAnomalies(v: unknown): WeeklyReportAnomalies {
  if (!isRecord(v)) {
    return { totalCount: 0, criticalCount: 0, warningCount: 0, top: [] };
  }

  return {
    totalCount: getNumber(v.totalCount) ?? 0,
    criticalCount: getNumber(v.criticalCount) ?? 0,
    warningCount: getNumber(v.warningCount) ?? 0,
    top: getArray(v.top),
  };
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const userId = toObjectId(session.user.id);
  if (!userId) {
    return NextResponse.json({ ok: false, error: "Invalid session" }, { status: 500 });
  }

  const body: unknown = await req.json().catch(() => ({}));
  const reportId = isRecord(body) ? getString(body.reportId) ?? "" : "";
  const rid = toObjectId(reportId);
  if (!rid) {
    return NextResponse.json({ ok: false, error: "Invalid reportId" }, { status: 400 });
  }

  const db = await getDb();

  const user = await db.collection<UserDoc>("users").findOne(
    { _id: userId },
    { projection: { email: 1 } }
  );

  const to = typeof user?.email === "string" ? user.email : null;
  if (!to) {
    return NextResponse.json({ ok: false, error: "Missing email" }, { status: 400 });
  }

  const report = await db.collection<WeeklyReportDoc>("weekly_reports").findOne({ _id: rid, userId });
  if (!report) {
    return NextResponse.json({ ok: false, error: "Report not found" }, { status: 404 });
  }

  // Infer the exact "report" argument type from sendWeeklyReportEmail so we don't guess.
  type SendArgs = Parameters<typeof sendWeeklyReportEmail>[0];
  type ReportForEmail = SendArgs["report"];

  const anomalies = normalizeAnomalies(report.anomalies);

  const reportForEmail: ReportForEmail = {
    periodStart: report.periodStart,
    periodEnd: report.periodEnd,
    currency: report.currency,
    total: report.total,
    prevTotal: report.prevTotal,
    delta: report.delta,
    deltaPct: report.deltaPct ?? null,
    topServices: getArray(report.topServices),
    anomalies,
  } as ReportForEmail;

  const sendRes = await sendWeeklyReportEmail({ to, report: reportForEmail } as SendArgs);

  const status: string = sendRes.ok ? sendRes.status : "error";

  // Some implementations might include a message; the type doesn't guarantee it.
  const message: string | null = (() => {
    const u: unknown = sendRes;
    if (!isRecord(u)) return null;
    return typeof u.message === "string" ? u.message : null;
  })();

  await db.collection("weekly_reports").updateOne(
    { _id: rid, userId },
    {
      $set: {
        emailStatus: status,
        emailedAt: sendRes.ok && sendRes.status === "sent" ? new Date() : null,
        updatedAt: new Date(),
      },
    }
  );

  return NextResponse.json({ ok: true, status, message });
}
