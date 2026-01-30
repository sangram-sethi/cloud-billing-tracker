import { NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import { ObjectId } from "mongodb";

import { auth } from "@/auth";
import { checkRateLimit } from "@/lib/rateLimit";
import { getDb } from "@/lib/mongodb";
import { ensureWhatsAppIndexes } from "@/lib/whatsapp/indexes";

export const runtime = "nodejs";

const BodySchema = z.object({
  phone: z.string().min(8).max(32),
  code: z.string().regex(/^\d{6}$/),
});

function toObjectId(id: string) {
  try {
    return new ObjectId(id);
  } catch {
    return null;
  }
}

function normalizeE164(input: string) {
  const p = input.trim().replace(/\s+/g, "");
  if (!p.startsWith("+")) return null;
  if (!/^\+\d{8,15}$/.test(p)) return null;
  return p;
}

function hashCode(code: string, phone: string) {
  const salt = process.env.WHATSAPP_VERIFY_SALT || process.env.CRON_SECRET || "dev-salt";
  return crypto.createHash("sha256").update(`${salt}:${phone}:${code}`).digest("hex");
}

type WhatsAppVerificationDoc = {
  _id: string;
  userId: ObjectId;
  phone: string;
  codeHash: string;
  expiresAt: Date;
  attempts: number;
  createdAt: Date;
  updatedAt: Date;
};

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const rl = await checkRateLimit({
    key: `wa:confirm:${session.user.id}`,
    limit: 20,
    windowMs: 60 * 60 * 1000,
  });
  if (!rl.ok) {
    return NextResponse.json({ ok: false, error: "Too many attempts. Try later." }, { status: 429 });
  }

  const userId = toObjectId(session.user.id);
  if (!userId) return NextResponse.json({ ok: false, error: "Invalid user session" }, { status: 500 });

  const json = await req.json().catch(() => ({}));
  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ ok: false, error: "Invalid request" }, { status: 400 });

  const phone = normalizeE164(parsed.data.phone);
  if (!phone) return NextResponse.json({ ok: false, error: "Invalid phone number" }, { status: 400 });

  await ensureWhatsAppIndexes();

  const db = await getDb();
  const ver = db.collection<WhatsAppVerificationDoc>("whatsapp_verifications");
  const users = db.collection("users");

  const id = `${String(userId)}:${phone}`;
  const doc = await ver.findOne({ _id: id });

  if (!doc) return NextResponse.json({ ok: false, error: "No active verification. Start again." }, { status: 400 });
  if (doc.expiresAt && new Date(doc.expiresAt).getTime() < Date.now()) {
    return NextResponse.json({ ok: false, error: "Code expired. Start again." }, { status: 400 });
  }
  if ((doc.attempts ?? 0) >= 5) {
    return NextResponse.json({ ok: false, error: "Too many wrong attempts. Start again." }, { status: 400 });
  }

  const expected = doc.codeHash;
  const got = hashCode(parsed.data.code, phone);

  if (got !== expected) {
    await ver.updateOne({ _id: id }, { $set: { updatedAt: new Date() }, $inc: { attempts: 1 } });
    return NextResponse.json({ ok: false, error: "Invalid code." }, { status: 400 });
  }

  const now = new Date();

  await users.updateOne(
    { _id: userId },
    {
      $set: {
        whatsappNumber: phone,
        whatsappVerifiedAt: now,
        whatsappAlertsEnabled: true,
        updatedAt: now,
      },
    }
  );

  await ver.deleteOne({ _id: id });

  return NextResponse.json({ ok: true, status: "verified" });
}
