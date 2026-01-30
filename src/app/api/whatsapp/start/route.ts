import { NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import { ObjectId } from "mongodb";

import { auth } from "@/auth";
import { checkRateLimit } from "@/lib/rateLimit";
import { getDb } from "@/lib/mongodb";
import { ensureWhatsAppIndexes } from "@/lib/whatsapp/indexes";
import { sendWhatsAppMessage } from "@/lib/whatsapp/client";

export const runtime = "nodejs";

const BodySchema = z.object({
  phone: z.string().min(8).max(32),
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
  // Basic E.164 sanity (not perfect, but good)
  if (!p.startsWith("+")) return null;
  if (!/^\+\d{8,15}$/.test(p)) return null;
  return p;
}

function makeCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function hashCode(code: string, phone: string) {
  const salt = process.env.WHATSAPP_VERIFY_SALT || process.env.CRON_SECRET || "dev-salt";
  return crypto.createHash("sha256").update(`${salt}:${phone}:${code}`).digest("hex");
}

type WhatsAppVerificationDoc = {
  _id: string; // `${userId}:${phone}`
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
    key: `wa:start:${session.user.id}`,
    limit: 10,
    windowMs: 60 * 60 * 1000,
  });
  if (!rl.ok) {
    // soft-fail for UI: don't crash
    return NextResponse.json({ ok: true, status: "unavailable", message: "Too many attempts. Try later." }, { status: 200 });
  }

  const userId = toObjectId(session.user.id);
  if (!userId) return NextResponse.json({ ok: false, error: "Invalid user session" }, { status: 500 });

  const json = await req.json().catch(() => ({}));
  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ ok: false, error: "Invalid request" }, { status: 400 });

  const phone = normalizeE164(parsed.data.phone);
  if (!phone) return NextResponse.json({ ok: false, error: "Invalid phone number (use E.164 like +9198...)" }, { status: 400 });

  await ensureWhatsAppIndexes();

  const db = await getDb();
  const ver = db.collection<WhatsAppVerificationDoc>("whatsapp_verifications");

  const code = makeCode();
  const codeHash = hashCode(code, phone);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 10 * 60 * 1000);

  const id = `${String(userId)}:${phone}`;

  await ver.updateOne(
    { _id: id },
    {
      $set: { userId, phone, codeHash, expiresAt, attempts: 0, updatedAt: now },
      $setOnInsert: { createdAt: now },
    },
    { upsert: true }
  );

  const body =
    `CloudBudgetGuard verification code: ${code}\n` +
    `Expires in 10 minutes.\n\n` +
    `If you didn't request this, ignore.`;

  const send = await sendWhatsAppMessage({ toE164: phone, body });

  if (send.ok && send.status === "ok") {
    return NextResponse.json({ ok: true, status: "sent" });
  }

  // Soft-fail: keep UI alive
  return NextResponse.json(
    { ok: true, status: send.ok ? send.status : "error", message: send.ok ? send.message : send.message },
    { status: 200 }
  );
}
