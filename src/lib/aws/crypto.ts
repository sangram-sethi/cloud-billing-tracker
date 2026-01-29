import crypto from "crypto";

/**
 * Encrypt/decrypt helpers for storing cloud credentials safely in Mongo.
 *
 * Format: v1:<ivB64url>:<tagB64url>:<cipherB64url>
 * Algo: AES-256-GCM
 */

const VERSION = "v1" as const;

function isHex(s: string) {
  return /^[0-9a-fA-F]+$/.test(s);
}

function parseKey(raw: string): Buffer | null {
  const v = raw.trim();
  if (!v) return null;

  // 32 bytes as hex
  if (v.length === 64 && isHex(v)) {
    const b = Buffer.from(v, "hex");
    return b.length === 32 ? b : null;
  }

  // 32 bytes as base64/base64url
  try {
    const normalized = v.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized + "===".slice((normalized.length + 3) % 4);
    const b = Buffer.from(padded, "base64");
    return b.length === 32 ? b : null;
  } catch {
    return null;
  }
}

function getKey(): Buffer {
  const raw = process.env.CREDENTIALS_ENCRYPTION_KEY;
  const parsed = raw ? parseKey(raw) : null;
  if (parsed) return parsed;

  // Dev fallback: derive a stable 32-byte key from AUTH_SECRET.
  // NOTE: For production, ALWAYS set CREDENTIALS_ENCRYPTION_KEY.
  const secret = process.env.AUTH_SECRET || "dev-secret";
  return crypto.createHash("sha256").update(secret).digest();
}

export function encryptCredential(plain: string): string {
  const key = getKey();
  const iv = crypto.randomBytes(12); // recommended size for GCM
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);

  const ciphertext = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return [VERSION, iv.toString("base64url"), tag.toString("base64url"), ciphertext.toString("base64url")].join(":");
}

export function decryptCredential(payload: string): string {
  const parts = String(payload || "").split(":");
  if (parts.length !== 4 || parts[0] !== VERSION) {
    throw new Error("Invalid encrypted credential format");
  }

  const [, ivB64, tagB64, cipherB64] = parts;
  const iv = Buffer.from(ivB64, "base64url");
  const tag = Buffer.from(tagB64, "base64url");
  const ciphertext = Buffer.from(cipherB64, "base64url");

  const key = getKey();
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);

  const plain = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return plain.toString("utf8");
}
