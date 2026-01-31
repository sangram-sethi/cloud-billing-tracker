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

type AwsConnectionDoc = {
  _id?: ObjectId;
  userId: ObjectId;
  status?: string | null; // "connected" | "failed" | etc
  accessKeyId?: string | null;
  region?: string | null;
  lastValidatedAt?: Date | string | null;
  lastSyncAt?: Date | string | null;
  lastError?: string | null;
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

function toIsoOrNull(v: unknown): string | null {
  if (!v) return null;
  const d = v instanceof Date ? v : new Date(String(v));
  return Number.isFinite(d.getTime()) ? d.toISOString() : null;
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
    const conn = await db.collection<AwsConnectionDoc>("aws_connections").findOne({ userId });

    if (conn) {
      const statusRaw = typeof conn.status === "string" ? conn.status : "";
      const status: ConnectionSummary["status"] = statusRaw === "connected" ? "connected" : "failed";

      initial = {
        status,
        accessKeySuffix: typeof conn.accessKeyId === "string" ? conn.accessKeyId.slice(-4) : null,
        region: typeof conn.region === "string" ? conn.region : null,
        lastValidatedAt: toIsoOrNull(conn.lastValidatedAt),
        lastSyncAt: toIsoOrNull(conn.lastSyncAt),
        lastError: typeof conn.lastError === "string" ? conn.lastError : null,
      };
    }
  }

  return <ConnectAwsClient initial={initial} />;
}
