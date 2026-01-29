import { getDb } from "@/lib/mongodb";
import { COLLECTIONS } from "./types";
import type { AwsConnectionDoc, CostDailyDoc, AnomalyDoc } from "./types";

export async function awsConnectionsCol() {
  const db = await getDb();
  return db.collection<AwsConnectionDoc>(COLLECTIONS.awsConnections);
}

export async function costDailyCol() {
  const db = await getDb();
  return db.collection<CostDailyDoc>(COLLECTIONS.costDaily);
}

export async function anomaliesCol() {
  const db = await getDb();
  return db.collection<AnomalyDoc>(COLLECTIONS.anomalies);
}
