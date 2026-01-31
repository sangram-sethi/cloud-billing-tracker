import { getDb } from "@/lib/mongodb";

declare global {
  var _cbgAuthIndexesEnsured: boolean | undefined;
}

export async function ensureAuthIndexes() {
  if (globalThis._cbgAuthIndexesEnsured) return;

  const db = await getDb();

  // One email = one account
  await db.collection("users").createIndex({ email: 1 }, { unique: true });

  // OTP challenges: TTL on expiresAt
  await db.collection("otp_challenges").createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
  await db.collection("otp_challenges").createIndex({ email: 1, createdAt: -1 });

  // Login tokens: TTL on expiresAt
  await db.collection("login_tokens").createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
  await db.collection("login_tokens").createIndex({ tokenHash: 1 }, { unique: true });

  // Rate limits: TTL on resetAt (cleanup)
  await db.collection("rate_limits").createIndex({ resetAt: 1 }, { expireAfterSeconds: 0 });

  globalThis._cbgAuthIndexesEnsured = true;
}
