import { ObjectId, type WithId } from "mongodb";

import { getDb } from "@/lib/mongodb";
import { ensureNotificationIndexes } from "@/lib/notifications/indexes";
import { sendAnomalyAlertEmail } from "@/lib/resend";

type Severity = "info" | "warning" | "critical";

const severityRank: Record<Severity, number> = { info: 0, warning: 1, critical: 2 };

type AnomalyLike = {
  date: string;
  service: string;
  severity: Severity;
  message: string;
  observed: number;
  baseline: number;
  pctChange: number;
  zScore: number | null;
  status?: string;
};

type NotificationEventDoc = {
  _id?: ObjectId;
  userId: ObjectId;
  kind: "anomaly_email";
  channel: "email";
  date: string;
  service: string;
  to: string;
  severity: Severity;
  status: "reserved" | "sent" | "failed";
  createdAt: Date;
  updatedAt: Date;
  sentAt?: Date;
  error?: string | null;
};

type SendSummary = {
  attempted: number;
  sent: number;
  skipped: number;
  failed: number;
};

function pickCurrencyFallback(): string {
  return "USD";
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function getErrorMessage(e: unknown): string {
  if (e instanceof Error && typeof e.message === "string") return e.message;
  if (isRecord(e) && typeof e.message === "string") return e.message;
  return "Email send failed";
}

/**
 * Your codebase has mixed mongo typings:
 * - some environments return ModifyResult { value }
 * - others return the document directly
 * This extracts the actual doc safely without using `any`.
 */
function extractFindOneAndUpdateDoc(
  updated: unknown
): WithId<NotificationEventDoc> | null {
  if (!updated) return null;

  // Case A: ModifyResult-like shape: { value: doc | null }
  if (isRecord(updated) && "value" in updated) {
    const v = (updated as { value?: unknown }).value;
    return isRecord(v) ? (v as WithId<NotificationEventDoc>) : null;
  }

  // Case B: Document returned directly
  return isRecord(updated) ? (updated as WithId<NotificationEventDoc>) : null;
}

/**
 * Sends anomaly emails (deduped) for a user.
 * Defaults: enabled=true, minSeverity="warning"
 * Never throws (sync should not crash if email fails).
 */
export async function sendAnomalyEmailAlerts(params: {
  userId: ObjectId;
  anomalies: AnomalyLike[];
  currency?: string;
  minSeverity?: Severity; // default warning
}): Promise<SendSummary> {
  const db = await getDb();
  await ensureNotificationIndexes();

  const users = db.collection<{ _id: ObjectId; email?: string | null }>("users");
  const events = db.collection<NotificationEventDoc>("notification_events");

  const user = await users.findOne({ _id: params.userId });
  const toRaw = user?.email;
  if (!toRaw) return { attempted: 0, sent: 0, skipped: params.anomalies.length, failed: 0 };

  const to = normalizeEmail(toRaw);

  const minSeverity: Severity = params.minSeverity ?? "warning";
  const currency = params.currency ?? pickCurrencyFallback();

  const now = new Date();
  const staleCutoff = new Date(now.getTime() - 15 * 60 * 1000); // takeover stale reservations after 15m

  let attempted = 0;
  let sent = 0;
  let skipped = 0;
  let failed = 0;

  // Filter only meaningful anomalies
  const candidates = params.anomalies.filter((a) => {
    if (a.status && a.status === "resolved") return false;
    return severityRank[a.severity] >= severityRank[minSeverity];
  });

  for (const a of candidates) {
    attempted++;

    try {
      // Reserve (atomic) to avoid double-sends across cron/manual runs.
      // We only reserve if:
      // - doc doesn't exist (new) OR
      // - it failed previously OR
      // - it is stuck in reserved state (stale)
      const updatedResult: unknown = await events.findOneAndUpdate(
        {
          userId: params.userId,
          kind: "anomaly_email",
          channel: "email",
          date: a.date,
          service: a.service,
          $or: [
            { status: { $exists: false } },
            { status: "failed" },
            { status: "reserved", updatedAt: { $lte: staleCutoff } },
          ],
        },
        {
          $set: {
            to,
            severity: a.severity,
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
        // Most likely: already "sent" (unique + filter didn't match)
        skipped++;
        continue;
      }

      // If already sent, skip (paranoia)
      if (doc.status === "sent") {
        skipped++;
        continue;
      }

      await sendAnomalyAlertEmail({
        to,
        date: a.date,
        service: a.service,
        severity: a.severity,
        observed: a.observed,
        baseline: a.baseline,
        pctChange: a.pctChange,
        zScore: a.zScore,
        message: a.message,
        currency,
      });

      await events.updateOne(
        { userId: params.userId, kind: "anomaly_email", channel: "email", date: a.date, service: a.service },
        { $set: { status: "sent", sentAt: new Date(), updatedAt: new Date(), error: null } }
      );

      sent++;
    } catch (e: unknown) {
      failed++;
      const msg = getErrorMessage(e);

      // Record failure (doesn't break sync)
      try {
        await events.updateOne(
          { userId: params.userId, kind: "anomaly_email", channel: "email", date: a.date, service: a.service },
          { $set: { status: "failed", updatedAt: new Date(), error: msg } }
        );
      } catch {
        // ignore
      }
    }
  }

  return { attempted, sent, skipped, failed };
}
