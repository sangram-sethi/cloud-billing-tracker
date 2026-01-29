import crypto from "crypto";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";

export type OtpAction = "login" | "signup";

export type OtpChallengeDoc = {
  _id: ObjectId;
  email: string;
  action: OtpAction;
  codeHash: string;
  expiresAt: Date;
  createdAt: Date;
  attempts: number;
  consumedAt: Date | null;

  // login
  userId?: ObjectId;

  // signup
  pendingName?: string;
  pendingPasswordHash?: string;
};

function otpSecret() {
  return process.env.OTP_HMAC_SECRET || process.env.AUTH_SECRET || "dev-secret";
}

export function generateOtpCode() {
  return crypto.randomInt(0, 1_000_000).toString().padStart(6, "0");
}

export function hashOtp(code: string) {
  return crypto.createHmac("sha256", otpSecret()).update(code).digest("hex");
}

export async function findRecentChallenge(email: string, cooldownMs: number) {
  const db = await getDb();
  const col = db.collection<OtpChallengeDoc>("otp_challenges");
  const since = new Date(Date.now() - cooldownMs);

  return col.findOne({
    email,
    consumedAt: null,
    createdAt: { $gte: since },
  });
}

export async function createOtpChallenge(params: {
  email: string;
  action: OtpAction;
  code: string;
  expiresMinutes: number;
  userId?: ObjectId;
  pendingName?: string;
  pendingPasswordHash?: string;
}) {
  const db = await getDb();
  const col = db.collection<OtpChallengeDoc>("otp_challenges");

  const now = new Date();
  const expiresAt = new Date(now.getTime() + params.expiresMinutes * 60_000);

  const doc: OtpChallengeDoc = {
    _id: new ObjectId(),
    email: params.email,
    action: params.action,
    codeHash: hashOtp(params.code),
    createdAt: now,
    expiresAt,
    attempts: 0,
    consumedAt: null,
    ...(params.userId ? { userId: params.userId } : {}),
    ...(params.pendingName ? { pendingName: params.pendingName } : {}),
    ...(params.pendingPasswordHash ? { pendingPasswordHash: params.pendingPasswordHash } : {}),
  };

  await col.insertOne(doc);
  return doc._id.toString();
}

export async function verifyOtpChallenge(params: { email: string; challengeId: string; code: string; maxAttempts: number }) {
  const db = await getDb();
  const col = db.collection<OtpChallengeDoc>("otp_challenges");

  let id: ObjectId;
  try {
    id = new ObjectId(params.challengeId);
  } catch {
    return { ok: false as const, reason: "invalid_challenge" };
  }

  const challenge = await col.findOne({ _id: id, email: params.email });
  if (!challenge) return { ok: false as const, reason: "invalid_challenge" };

  const now = new Date();
  if (challenge.consumedAt) return { ok: false as const, reason: "already_used" };
  if (challenge.expiresAt <= now) return { ok: false as const, reason: "expired" };
  if (challenge.attempts >= params.maxAttempts) return { ok: false as const, reason: "too_many_attempts" };

  const matches = challenge.codeHash === hashOtp(params.code);

  await col.updateOne(
    { _id: challenge._id },
    matches
      ? { $set: { consumedAt: now }, $inc: { attempts: 1 } }
      : { $inc: { attempts: 1 } }
  );

  if (!matches) return { ok: false as const, reason: "invalid_code" };

  return { ok: true as const, challenge };
}
