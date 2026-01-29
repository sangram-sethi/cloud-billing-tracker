import { NextResponse } from "next/server";
import { z } from "zod";
import { ObjectId } from "mongodb";

import { ensureAuthIndexes } from "@/lib/auth/indexes";
import { verifyTurnstileToken } from "@/lib/turnstile";
import { checkRateLimit } from "@/lib/rateLimit";
import { getDb } from "@/lib/mongodb";
import { hashPassword, verifyPassword } from "@/lib/password";
import { generateOtpCode, createOtpChallenge, findRecentChallenge } from "@/lib/auth/otp";
import { sendOtpEmail } from "@/lib/resend";

const BodySchema = z.object({
  action: z.enum(["login", "signup"]),
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2).optional(),
  turnstileToken: z.string().min(10),
});

function getIp(req: Request) {
  const xf = req.headers.get("x-forwarded-for");
  if (!xf) return undefined;
  return xf.split(",")[0]?.trim();
}

export async function POST(req: Request) {
  await ensureAuthIndexes();

  const ip = getIp(req);

  const json = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Invalid request" }, { status: 400 });
  }

  const email = parsed.data.email.trim().toLowerCase();
  const { action, password, name, turnstileToken } = parsed.data;

  // 1) Turnstile verify (bot protection)
  const turnstile = await verifyTurnstileToken(turnstileToken, ip);
  if (!turnstile.success) {
    return NextResponse.json({ ok: false, error: "Captcha failed" }, { status: 400 });
  }

  // 2) Rate limits (protect Resend free tier)
  const emailLimit = await checkRateLimit({ key: `otp:email:${email}`, limit: 5, windowMs: 60 * 60 * 1000 });
  if (!emailLimit.ok) {
    return NextResponse.json({ ok: false, error: "Too many requests. Try later." }, { status: 429 });
  }

  if (ip) {
    const ipLimit = await checkRateLimit({ key: `otp:ip:${ip}`, limit: 20, windowMs: 60 * 60 * 1000 });
    if (!ipLimit.ok) {
      return NextResponse.json({ ok: false, error: "Too many requests. Try later." }, { status: 429 });
    }
  }

  // 3) Cooldown (60s) to prevent “resend spam”
  const recent = await findRecentChallenge(email, 60_000);
  if (recent) {
    return NextResponse.json({ ok: false, error: "Please wait a minute before requesting another code." }, { status: 429 });
  }

  const db = await getDb();
  const users = db.collection("users");

  if (action === "signup") {
    const existing = await users.findOne({ email });
    if (existing) {
      return NextResponse.json({ ok: false, error: "Email already in use." }, { status: 409 });
    }
    if (!name) {
      return NextResponse.json({ ok: false, error: "Name is required." }, { status: 400 });
    }

    const passwordHash = await hashPassword(password);

    const code = generateOtpCode();
    const challengeId = await createOtpChallenge({
      email,
      action: "signup",
      code,
      expiresMinutes: 10,
      pendingName: name,
      pendingPasswordHash: passwordHash,
    });

    await sendOtpEmail({ to: email, code, expiresMinutes: 10 });

    return NextResponse.json({ ok: true, challengeId });
  }

  // action === "login"
  const user = await users.findOne<{ _id: ObjectId; passwordHash?: string }>({ email });
  const hash = user?.passwordHash;

  // If user exists but has no password (Google-only), reject safely
  if (!user || !hash) {
    return NextResponse.json({ ok: false, error: "Invalid email or password." }, { status: 401 });
  }

  const valid = await verifyPassword(password, hash);
  if (!valid) {
    return NextResponse.json({ ok: false, error: "Invalid email or password." }, { status: 401 });
  }

  const code = generateOtpCode();
  const challengeId = await createOtpChallenge({
    email,
    action: "login",
    code,
    expiresMinutes: 10,
    userId: user._id,
  });

  await sendOtpEmail({ to: email, code, expiresMinutes: 10 });

  return NextResponse.json({ ok: true, challengeId });
}
