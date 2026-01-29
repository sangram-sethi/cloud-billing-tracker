import { ObjectId } from "mongodb";
import { auth } from "@/auth";
import { getDb } from "@/lib/mongodb";
import { AnomaliesListClient, type AnomaliesViewModel } from "@/components/app/AnomaliesListClient";

function toObjectId(value: unknown): ObjectId | null {
  if (!value) return null;
  if (value instanceof ObjectId) return value;
  if (typeof value === "string" && ObjectId.isValid(value)) return new ObjectId(value);
  try {
    const s = String(value);
    if (ObjectId.isValid(s)) return new ObjectId(s);
  } catch {
    // ignore
  }
  return null;
}

export default async function AnomaliesPage() {
  const session = await auth();
  const userId = toObjectId(session?.user?.id);

  const model: AnomaliesViewModel = {
    status: "not_connected",
    currency: "USD",
    lastSyncAt: null,
    anomalies: [],
  };

  if (!userId) {
    return <AnomaliesListClient model={model} />;
  }

  const db = await getDb();

  const conn = await db.collection<any>("aws_connections").findOne({ userId });
  if (conn) {
    model.status = conn.status === "connected" ? "connected" : "failed";
    model.lastSyncAt = conn.lastSyncAt ? new Date(conn.lastSyncAt).toISOString() : null;
  }

  const anomalies = await db
    .collection<any>("anomalies")
    .find({ userId })
    .sort({ date: -1, createdAt: -1 })
    .limit(60)
    .toArray();

  model.anomalies = anomalies
    .filter((a: any) => typeof a?.date === "string")
    .map((a: any) => ({
      date: String(a.date),
      service: String(a.service ?? "__TOTAL__"),
      severity: (a.severity as any) ?? "info",
      message: String(a.message ?? ""),
      observed: Number(a.observed ?? 0),
      baseline: Number(a.baseline ?? 0),
      pctChange: Number(a.pctChange ?? 0),
      zScore: a.zScore == null ? null : Number(a.zScore),
      status: String(a.status ?? "open"),
      createdAt: a.createdAt ? new Date(a.createdAt).toISOString() : null,
      updatedAt: a.updatedAt ? new Date(a.updatedAt).toISOString() : null,
    }))
    .filter((a: any) => Number.isFinite(a.observed) && Number.isFinite(a.baseline));

  return <AnomaliesListClient model={model} />;
}
