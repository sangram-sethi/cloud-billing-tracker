import { ObjectId, type WithId } from "mongodb";

import { getDb } from "@/lib/mongodb";
import { ensureNotificationIndexes } from "@/lib/notifications/indexes";
import { sendWhatsAppMessage } from "@/lib/whatsapp/client";

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
  kind: "anomaly_whatsapp";
  channel: "whatsapp";
  date: string;
  service: string;
  to: string; // E.164 (without "whatsapp:" prefix)
  severity: Severity;
  status: "reserved" | "sent" | "failed";
  createdAt: Date;
  updatedAt: Date;
  sentAt?: Date;
  error?: string | null;
};

type UserDoc = {
  _id: ObjectId;
  whatsappAlertsEnabled?: boolean | null;
  whatsappVerifiedAt?: Date | string | null;
  whatsappNumber?: string | null;
};

type SendSummary =
  | { attempted: number; sent: number; skipped: number; failed: number }
  | { attempted: number; sent: number; skipped: number; failed: number; reason: "not_enabled" };

function normalizePhone(phone: string): string {
  return phone.trim().replace(/\s+/g, "");
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function getBaseUrl(): string {
  const base = process.env.APP_BASE_URL || process.env.NEXTAUTH_URL;
  if (base) return base.replace(/\/$/, "");
  const vercel = process.env.VERCEL_URL;
  if (vercel) return `https://${vercel}`.replace(/\/$/, "");
  return "http://localhost:3000";
}

function fmtMoney(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 2 }).format(
      Number.isFinite(amount) ? amount : 0
    );
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}

function fmtPct(p: number): string {
  if (!Number.isFinite(p)) return "∞";
  return `${Math.round(p * 100)}%`;
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

function getErrorMessage(e: unknown): string {
  if (e instanceof Error && typeof e.message === "string") return e.message;
  if (isRecord(e) && typeof e.message === "string") return e.message;
  return "WhatsApp send failed";
}

function getSendMessage(send: unknown): string {
  if (isRecord(send) && typeof send.message === "string") return send.message;
  return "WhatsApp send failed";
}

function toVerifiedDate(v: Date | string | null | undefined): Date | null {
  if (!v) return null;
  if (v instanceof Date) return Number.isFinite(v.getTime()) ? v : null;
  if (typeof v === "string") {
    const d = new Date(v);
    return Number.isFinite(d.getTime()) ? d : null;
  }
  return null;
}

/**
 * Sends WhatsApp anomaly alerts (deduped) for a user.
 * Never throws (sync should not crash).
 */
export async function sendAnomalyWhatsAppAlerts(params: {
  userId: ObjectId;
  anomalies: AnomalyLike[];
  currency?: string;
  minSeverity?: Severity; // default warning
}): Promise<SendSummary> {
  const db = await getDb();
  await ensureNotificationIndexes();

  const users = db.collection<UserDoc>("users");
  const events = db.collection<NotificationEventDoc>("notification_events");

  // User must be verified + enabled
  const user = await users.findOne({ _id: params.userId });

  const enabled = !!user?.whatsappAlertsEnabled;
  const verifiedAt = toVerifiedDate(user?.whatsappVerifiedAt ?? null);
  const phoneRaw = typeof user?.whatsappNumber === "string" ? user.whatsappNumber : null;

  if (!enabled || !verifiedAt || !phoneRaw) {
    return { attempted: 0, sent: 0, skipped: params.anomalies.length, failed: 0, reason: "not_enabled" };
  }

  const toE164 = normalizePhone(phoneRaw);
  const currency = params.currency ?? "USD";
  const minSeverity: Severity = params.minSeverity ?? "warning";

  const now = new Date();
  const staleCutoff = new Date(now.getTime() - 15 * 60 * 1000);

  let attempted = 0;
  let sent = 0;
  let skipped = 0;
  let failed = 0;

  const candidates = params.anomalies.filter((a) => {
    if (a.status && a.status === "resolved") return false;
    return severityRank[a.severity] >= severityRank[minSeverity];
  });

  const baseUrl = getBaseUrl();
  const link = `${baseUrl}/app/anomalies`;

  for (const a of candidates) {
    attempted++;

    try {
      const updatedResult: unknown = await events.findOneAndUpdate(
        {
          userId: params.userId,
          kind: "anomaly_whatsapp",
          channel: "whatsapp",
          date: a.date,
          service: a.service,
          $or: [
            { status: { $exists: false } },
            { status: "failed" },
            { status: "reserved", updatedAt: { $lte: staleCutoff } },
          ],
        },
        {
          $set: { to: toE164, severity: a.severity, status: "reserved", updatedAt: now },
          $setOnInsert: { createdAt: now },
        },
        { upsert: true, returnDocument: "after" }
      );

      const doc = extractFindOneAndUpdateDoc(updatedResult);

      if (!doc) {
        skipped++;
        continue;
      }

      const svc = a.service === "__TOTAL__" ? "Total" : a.service;
      const msg =
        `⚡ Cost anomaly (${a.severity.toUpperCase()})\n` +
        `Date: ${a.date}\n` +
        `Service: ${svc}\n` +
        `Observed: ${fmtMoney(a.observed, currency)}\n` +
        `Baseline: ${fmtMoney(a.baseline, currency)}\n` +
        `Jump: ${fmtPct(a.pctChange)}\n\n` +
        `${a.message}\n\n` +
        `Open: ${link}`;

      const send = await sendWhatsAppMessage({ toE164, body: msg });

      const isOk = isRecord(send) && (send as { ok?: unknown }).ok === true && (send as { status?: unknown }).status === "ok";
      if (!isOk) {
        const errMsg = getSendMessage(send);

        // Soft-fail: mark failed but don't crash sync
        await events.updateOne(
          { userId: params.userId, kind: "anomaly_whatsapp", channel: "whatsapp", date: a.date, service: a.service },
          { $set: { status: "failed", updatedAt: new Date(), error: errMsg } }
        );

        failed++;
        continue;
      }

      await events.updateOne(
        { userId: params.userId, kind: "anomaly_whatsapp", channel: "whatsapp", date: a.date, service: a.service },
        { $set: { status: "sent", sentAt: new Date(), updatedAt: new Date(), error: null } }
      );

      sent++;
    } catch (e: unknown) {
      failed++;
      const err = getErrorMessage(e);

      try {
        await events.updateOne(
          { userId: params.userId, kind: "anomaly_whatsapp", channel: "whatsapp", date: a.date, service: a.service },
          { $set: { status: "failed", updatedAt: new Date(), error: err } }
        );
      } catch {
        // ignore
      }
    }
  }

  return { attempted, sent, skipped, failed };
}
