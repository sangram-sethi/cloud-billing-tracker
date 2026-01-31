import { ObjectId, type WithId } from "mongodb";

import { getDb } from "@/lib/mongodb";
import { ensureNotificationIndexes } from "@/lib/notifications/indexes";
import { buildWeeklyFounderReport, defaultWeeklyWindow } from "@/lib/reports/weeklyFounderReport";
import { sendWeeklyFounderReportEmail } from "@/lib/resend";

type NotificationEventDoc = {
  _id?: ObjectId;
  userId: ObjectId;
  kind: "weekly_report";
  channel: "email";
  weekStart: string; // ymd
  weekEnd: string; // ymd
  to: string;
  status: "reserved" | "sent" | "failed";
  createdAt: Date;
  updatedAt: Date;
  sentAt?: Date;
  error?: string | null;
};

type UserDoc = { _id: ObjectId; email?: string | null };

type Result =
  | { ok: true; sent: true }
  | { ok: true; sent: false; error: string }
  | { ok: true; skipped: true; reason: "no_email" | "already_sent_or_locked" | "no_data" };

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function getErrorMessage(e: unknown): string {
  if (e instanceof Error && typeof e.message === "string") return e.message;
  if (isRecord(e) && typeof e.message === "string") return e.message;
  return "Weekly report send failed";
}

/**
 * Your codebase has mixed mongo typings:
 * - some environments return ModifyResult { value }
 * - others return the document directly
 * This extracts the actual doc safely without using `any`.
 */
function extractFindOneAndUpdateDoc(updated: unknown): WithId<NotificationEventDoc> | null {
  if (!updated) return null;

  // Case A: ModifyResult-like shape: { value: doc | null }
  if (isRecord(updated) && "value" in updated) {
    const v = (updated as { value?: unknown }).value;
    return isRecord(v) ? (v as WithId<NotificationEventDoc>) : null;
  }

  // Case B: Document returned directly
  return isRecord(updated) ? (updated as WithId<NotificationEventDoc>) : null;
}

export async function sendWeeklyFounderReportForUser(params: {
  userId: ObjectId;
  weekStart?: string; // optional override
  endExclusive?: string; // optional override
}): Promise<Result> {
  const db = await getDb();
  await ensureNotificationIndexes();

  const users = db.collection<UserDoc>("users");
  const events = db.collection<NotificationEventDoc>("notification_events");

  const user = await users.findOne({ _id: params.userId });
  const toRaw = user?.email;
  if (!toRaw) return { ok: true, skipped: true, reason: "no_email" };

  const to = normalizeEmail(toRaw);

  const win = (() => {
    if (params.weekStart && params.endExclusive) {
      const end = new Date(`${params.endExclusive}T00:00:00Z`);
      end.setUTCDate(end.getUTCDate() - 1);
      const weekEnd = end.toISOString().slice(0, 10);
      return { weekStart: params.weekStart, weekEnd, endExclusive: params.endExclusive };
    }
    const d = defaultWeeklyWindow();
    return { weekStart: d.start, weekEnd: d.end, endExclusive: d.endExclusive };
  })();

  const now = new Date();
  const staleCutoff = new Date(now.getTime() - 15 * 60 * 1000);

  // Reserve send (deduped)
  const updatedResult: unknown = await events.findOneAndUpdate(
    {
      userId: params.userId,
      kind: "weekly_report",
      channel: "email",
      weekStart: win.weekStart,
      $or: [
        { status: { $exists: false } },
        { status: "failed" },
        { status: "reserved", updatedAt: { $lte: staleCutoff } },
      ],
    },
    {
      $set: {
        to,
        weekEnd: win.weekEnd,
        status: "reserved",
        updatedAt: now,
      },
      $setOnInsert: {
        createdAt: now,
      },
    },
    { upsert: true, returnDocument: "after" }
  );

  const doc = extractFindOneAndUpdateDoc(updatedResult);

  if (!doc) {
    return { ok: true, skipped: true, reason: "already_sent_or_locked" };
  }

  // Build report (may return null if no data)
  const report = await buildWeeklyFounderReport({
    userId: params.userId,
    start: win.weekStart,
    endExclusive: win.endExclusive,
  });

  if (!report) {
    await events.updateOne(
      { userId: params.userId, kind: "weekly_report", channel: "email", weekStart: win.weekStart },
      { $set: { status: "failed", updatedAt: new Date(), error: "No data to report yet." } }
    );
    return { ok: true, skipped: true, reason: "no_data" };
  }

  try {
    await sendWeeklyFounderReportEmail({
      to,
      range: report.range,
      currency: report.currency,
      total: report.total,
      topServices: report.topServices,
      anomalies: report.anomalies.map((a) => ({
        date: a.date,
        service: a.service,
        severity: a.severity,
        message: a.message,
        pctChange: a.pctChange,
      })),
    });

    await events.updateOne(
      { userId: params.userId, kind: "weekly_report", channel: "email", weekStart: win.weekStart },
      { $set: { status: "sent", sentAt: new Date(), updatedAt: new Date(), error: null } }
    );

    return { ok: true, sent: true };
  } catch (e: unknown) {
    const msg = getErrorMessage(e);
    await events.updateOne(
      { userId: params.userId, kind: "weekly_report", channel: "email", weekStart: win.weekStart },
      { $set: { status: "failed", updatedAt: new Date(), error: msg } }
    );
    return { ok: true, sent: false, error: msg };
  }
}
