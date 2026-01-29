import { getDb } from "@/lib/mongodb";

export async function ensureNotificationIndexes() {
  const db = await getDb();

  const events = db.collection("notification_events");

  // One email per anomaly (userId + date + service) forever
  await events.createIndex(
    { userId: 1, kind: 1, channel: 1, date: 1, service: 1 },
    { unique: true, name: "uniq_anomaly_email_per_key" }
  );

  await events.createIndex({ userId: 1, createdAt: -1 }, { name: "events_by_user_recent" });
}
