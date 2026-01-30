import { getDb } from "@/lib/mongodb";

export async function ensureNotificationIndexes() {
  const db = await getDb();
  const events = db.collection("notification_events");

  // Read existing indexes (safe if collection is new)
  const existing = await events.indexes().catch(() => []);
  const byName = new Map<string, any>();
  for (const idx of existing) {
    if (typeof idx?.name === "string") byName.set(idx.name, idx);
  }

  // If old anomaly index exists WITHOUT partialFilterExpression, drop it by a constant name
  const anomalyIdx = byName.get("uniq_anomaly_email_per_key");
  if (anomalyIdx && !anomalyIdx.partialFilterExpression) {
    try {
      await events.dropIndex("uniq_anomaly_email_per_key");
    } catch {
      // ignore
    }
  }

  // Recreate anomaly email dedupe as partial (so other kinds can exist without conflicts)
  await events.createIndex(
    { userId: 1, kind: 1, channel: 1, date: 1, service: 1 },
    {
      unique: true,
      name: "uniq_anomaly_email_per_key",
      partialFilterExpression: { kind: "anomaly_email", channel: "email" },
    }
  );

  // Weekly report dedupe (one per user per weekStart)
  await events.createIndex(
    { userId: 1, kind: 1, channel: 1, weekStart: 1 },
    {
      unique: true,
      name: "uniq_weekly_report_per_week",
      partialFilterExpression: { kind: "weekly_report", channel: "email" },
    }
  );

  await events.createIndex({ userId: 1, createdAt: -1 }, { name: "events_by_user_recent" });
}
