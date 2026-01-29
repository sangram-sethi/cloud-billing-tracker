export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { z } from "zod";
import { ObjectId } from "mongodb";

import { ensureAuthIndexes } from "@/lib/auth/indexes";
import { getDb } from "@/lib/mongodb";
import { verifyOtpChallenge } from "@/lib/auth/otp";
import { createLoginToken } from "@/lib/auth/loginToken";

const BodySchema = z.object({
  email: z.string().email(),
  challengeId: z.string().min(8),
  code: z.string().min(6).max(6),
});

function toObjectId(value: unknown): ObjectId | null {
  if (!value) return null;

  // Already an ObjectId
  if (value instanceof ObjectId) return value;

  // String id
  if (typeof value === "string" && ObjectId.isValid(value)) {
    return new ObjectId(value);
  }

  // ObjectId-like (from BSON) fallback
  try {
    // some BSON types stringify nicely
    const s = String(value);
    if (ObjectId.isValid(s)) return new ObjectId(s);
  } catch {
    // ignore
  }

  return null;
}

export async function POST(req: Request) {
  await ensureAuthIndexes();

  const json = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Invalid request" }, { status: 400 });
  }

  const email = parsed.data.email.trim().toLowerCase();
  const { challengeId, code } = parsed.data;

  const result = await verifyOtpChallenge({ email, challengeId, code, maxAttempts: 5 });
  if (!result.ok) {
    const status =
      result.reason === "too_many_attempts" ? 429 :
      result.reason === "expired" ? 410 :
      400;
    return NextResponse.json({ ok: false, error: result.reason }, { status });
  }

  const db = await getDb();
  const users = db.collection("users");

  let userId: ObjectId;

  if (result.challenge.action === "signup") {
    const existing = await users.findOne({ email });
    if (existing) {
      return NextResponse.json({ ok: false, error: "Email already in use." }, { status: 409 });
    }

    const pendingName = result.challenge.pendingName;
    const pendingPasswordHash = result.challenge.pendingPasswordHash;

    if (!pendingName || !pendingPasswordHash) {
      return NextResponse.json({ ok: false, error: "Signup data missing. Retry signup." }, { status: 400 });
    }

    const createdAt = new Date();
    const insert = await users.insertOne({
      email,
      name: pendingName,
      emailVerified: createdAt,
      passwordHash: pendingPasswordHash,
      createdAt,
      updatedAt: createdAt,
    });

    userId = insert.insertedId;
  } else {
    const uidRaw = result.challenge.userId;
    const uid = toObjectId(uidRaw);

    if (!uid) {
      return NextResponse.json(
        { ok: false, error: "Login user id invalid. Retry login." },
        { status: 400 }
      );
    }

    userId = uid;
  }

  const loginToken = await createLoginToken(userId, 5);
  return NextResponse.json({ ok: true, loginToken });
}
