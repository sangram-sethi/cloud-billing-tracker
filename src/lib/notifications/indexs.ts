import { getDb } from "@/lib/mongodb";
import type { IndexDescription } from "mongodb";

export async function ensureNotificationIndexes(): Promise<void> {
  const db = await getDb();
  const events = db.collection("notification_events");

  const existing: IndexDescription[] = await events.indexes().catch(() => []);
  const byName = new Map<string, IndexDescription>();

  for (const idx of existing) {
    if (idx && typeof idx.name === "string") byName.set(idx.name, idx);
  }

  // If old indexes exist WITHOUT partialFilterExpression, drop them by constant name.
  async function dropIfNonPartial(name: string): Promise<void> {
    const idx = byName.get(name);
    // "partialFilterExpression" missing => older version index; drop it.
    if (idx && idx.partialFilterExpression == null) {
      try {
        await events.dropIndex(name);
      } catch {
        // ignore
      }
    }
  }

  await dropIfNonPartial("uniq_anomaly_email_per_key");
  await dropIfNonPartial("uniq_weekly_report_per_week");
  await dropIfNonPartial("uniq_anomaly_whatsapp_per_key");

  // Anomaly email dedupe (partial)
  await events.createIndex(
    { userId: 1, kind: 1, channel: 1, date: 1, service: 1 },
    {
      unique: true,
      name: "uniq_anomaly_email_per_key",
      partialFilterExpression: { kind: "anomaly_email", channel: "email" },
    }
  );

  // Weekly report dedupe (partial)
  await events.createIndex(
    { userId: 1, kind: 1, channel: 1, weekStart: 1 },
    {
      unique: true,
      name: "uniq_weekly_report_per_week",
      partialFilterExpression: { kind: "weekly_report", channel: "email" },
    }
  );

  // WhatsApp anomaly dedupe (partial)
  await events.createIndex(
    { userId: 1, kind: 1, channel: 1, date: 1, service: 1 },
    {
      unique: true,
      name: "uniq_anomaly_whatsapp_per_key",
      partialFilterExpression: { kind: "anomaly_whatsapp", channel: "whatsapp" },
    }
  );

  await events.createIndex({ userId: 1, createdAt: -1 }, { name: "events_by_user_recent" });
}
