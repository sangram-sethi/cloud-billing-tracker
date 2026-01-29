import { ObjectId } from "mongodb";
import { auth } from "@/auth";
import { getDb } from "@/lib/mongodb";
import { ConnectAwsClient } from "@/components/app/ConnectAwsClient";

type ConnectionSummary = {
  status: "not_connected" | "connected" | "failed";
  accessKeySuffix: string | null;
  region: string | null;
  lastValidatedAt: string | null;
  lastSyncAt: string | null;
  lastError: string | null;
};

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

export default async function ConnectAwsPage() {
  const session = await auth();
  const userId = toObjectId(session?.user?.id);

  let initial: ConnectionSummary = {
    status: "not_connected",
    accessKeySuffix: null,
    region: null,
    lastValidatedAt: null,
    lastSyncAt: null,
    lastError: null,
  };

  if (userId) {
    const db = await getDb();
    const conn = await db.collection<any>("aws_connections").findOne({ userId });
    if (conn) {
      initial = {
        status: conn.status === "connected" ? "connected" : "failed",
        accessKeySuffix: typeof conn.accessKeyId === "string" ? conn.accessKeyId.slice(-4) : null,
        region: conn.region ?? null,
        lastValidatedAt: conn.lastValidatedAt ? new Date(conn.lastValidatedAt).toISOString() : null,
        lastSyncAt: conn.lastSyncAt ? new Date(conn.lastSyncAt).toISOString() : null,
        lastError: conn.lastError ?? null,
      };
    }
  }

  return <ConnectAwsClient initial={initial} />;
}
