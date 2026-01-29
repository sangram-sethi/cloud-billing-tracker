import { getDb } from "@/lib/mongodb";
import { COLLECTIONS } from "./types";

declare global {
  // eslint-disable-next-line no-var
  var _cbgAwsIndexesEnsured: boolean | undefined;
}

/**
 * Ensures core AWS-cost/anomaly indexes exist.
 * Safe to call multiple times; uses a global guard in a single runtime.
 */
export async function ensureAwsIndexes() {
  if (global._cbgAwsIndexesEnsured) return;

  const db = await getDb();

  // One AWS connection per user (MVP). Later we can expand to multiple accounts.
  await db.collection(COLLECTIONS.awsConnections).createIndex({ userId: 1 }, { unique: true });

  // Daily costs: unique per (user,date,service) and fast range queries
  await db
    .collection(COLLECTIONS.costDaily)
    .createIndex({ userId: 1, date: 1, service: 1 }, { unique: true });
  await db.collection(COLLECTIONS.costDaily).createIndex({ userId: 1, date: 1 });

  // Anomalies: unique per (user,date,service) and list queries by status/date
  await db
    .collection(COLLECTIONS.anomalies)
    .createIndex({ userId: 1, date: 1, service: 1 }, { unique: true });
  await db.collection(COLLECTIONS.anomalies).createIndex({ userId: 1, status: 1, date: -1 });
  await db.collection(COLLECTIONS.anomalies).createIndex({ userId: 1, date: -1 });

  global._cbgAwsIndexesEnsured = true;
}
