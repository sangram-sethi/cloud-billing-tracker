import crypto from "crypto";
import { ObjectId, type WithId } from "mongodb";

import { getDb } from "@/lib/mongodb";

type LoginTokenDoc = {
  _id: ObjectId;
  userId: ObjectId | string; // tolerate string in case older docs exist
  tokenHash: string;
  createdAt: Date;
  expiresAt: Date;
  consumedAt: Date | null;
};

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function tokenSecret() {
  return process.env.AUTH_SECRET || "dev-secret";
}

function hashToken(raw: string) {
  return crypto.createHmac("sha256", tokenSecret()).update(raw).digest("hex");
}

function toObjectId(value: unknown): ObjectId | null {
  if (!value) return null;
  if (value instanceof ObjectId) return value;

  if (typeof value === "string" && ObjectId.isValid(value)) {
    return new ObjectId(value);
  }

  try {
    const s = String(value);
    if (ObjectId.isValid(s)) return new ObjectId(s);
  } catch {
    // ignore
  }

  return null;
}

function isWithIdLoginTokenDoc(v: unknown): v is WithId<LoginTokenDoc> {
  if (!isRecord(v)) return false;

  const _id = v["_id"];
  const tokenHashVal = v["tokenHash"];

  return _id instanceof ObjectId && typeof tokenHashVal === "string";
}

/**
 * Mongo driver typings differ across versions:
 * - some return { value: doc | null }
 * - some return doc | null directly
 * We normalize without using `any`.
 */
function extractLoginTokenDoc(result: unknown): WithId<LoginTokenDoc> | null {
  if (!result) return null;

  if (isRecord(result) && "value" in result) {
    const value = (result as { value: unknown }).value;
    return isWithIdLoginTokenDoc(value) ? value : null;
  }

  return isWithIdLoginTokenDoc(result) ? result : null;
}

export function generateLoginTokenRaw() {
  return crypto.randomBytes(32).toString("base64url");
}

export async function createLoginToken(userId: ObjectId | string, ttlMinutes = 5) {
  const db = await getDb();
  const col = db.collection<LoginTokenDoc>("login_tokens");

  const raw = generateLoginTokenRaw();
  const tokenHash = hashToken(raw);

  const now = new Date();
  const expiresAt = new Date(now.getTime() + ttlMinutes * 60_000);

  const oid = toObjectId(userId);
  if (!oid) throw new Error("Invalid userId when creating login token");

  await col.insertOne({
    _id: new ObjectId(),
    userId: oid, // ✅ always store ObjectId going forward
    tokenHash,
    createdAt: now,
    expiresAt,
    consumedAt: null,
  });

  return raw;
}

export async function consumeLoginToken(raw: string) {
  const db = await getDb();
  const tokens = db.collection<LoginTokenDoc>("login_tokens");

  const now = new Date();
  const tokenHash = hashToken(raw);

  const result = await tokens.findOneAndUpdate(
    { tokenHash, consumedAt: null, expiresAt: { $gt: now } },
    { $set: { consumedAt: now } },
    { returnDocument: "after" }
  );

  const doc = extractLoginTokenDoc(result);
  if (!doc) return null;

  const userId = toObjectId(doc.userId);
  if (!userId) return null;

  const users = db.collection("users");
  const user = await users.findOne<{ _id: ObjectId; email?: string; name?: string }>({ _id: userId });
  if (!user?.email) return null;

  return {
    id: user._id.toString(),
    email: user.email,
    name: user.name || null,
  };
}
