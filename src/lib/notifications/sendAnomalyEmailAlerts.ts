import { ObjectId } from "mongodb";

import { getDb } from "@/lib/mongodb";
import { ensureNotificationIndexes } from "@/lib/notifications/indexs";
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

function pickCurrencyFallback() {
  return "USD";
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
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
}) {
  const db = await getDb();
  await ensureNotificationIndexes();

  const users = db.collection("users");
  const events = db.collection<NotificationEventDoc>("notification_events");

  const user = await users.findOne<{ _id: ObjectId; email?: string | null }>({ _id: params.userId });
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
      const updated: any = await events.findOneAndUpdate(
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
        { upsert: true, returnDocument: "after" } as any
      );

      // Mongo driver typing differences: some return doc, some return { value }
      const doc: NotificationEventDoc | null =
        (updated && typeof updated === "object" && "value" in updated ? updated.value : updated) ?? null;

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
    } catch (e: any) {
      failed++;
      const msg = typeof e?.message === "string" ? e.message : "Email send failed";

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
