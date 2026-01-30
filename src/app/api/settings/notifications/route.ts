import { NextResponse } from "next/server";
import { z } from "zod";
import { ObjectId } from "mongodb";

import { auth } from "@/auth";
import { getDb } from "@/lib/mongodb";

export const runtime = "nodejs";

const PatchSchema = z
  .object({
    emailAlertsEnabled: z.boolean().optional(),
    whatsappAlertsEnabled: z.boolean().optional(),
    aiInsightsEnabled: z.boolean().optional(),
  })
  .strict();

function toObjectId(id: string) {
  try {
    return new ObjectId(id);
  } catch {
    return null;
  }
}

function normalizeSettings(user: any) {
  const emailAlertsEnabled = typeof user?.emailAlertsEnabled === "boolean" ? user.emailAlertsEnabled : true;
  const whatsappAlertsEnabled = typeof user?.whatsappAlertsEnabled === "boolean" ? user.whatsappAlertsEnabled : false;
  const aiInsightsEnabled = typeof user?.aiInsightsEnabled === "boolean" ? user.aiInsightsEnabled : true;

  const whatsappNumber = typeof user?.whatsappNumber === "string" ? user.whatsappNumber : null;
  const whatsappVerifiedAt = user?.whatsappVerifiedAt ? new Date(user.whatsappVerifiedAt).toISOString() : null;

  return {
    emailAlertsEnabled,
    whatsappAlertsEnabled,
    whatsappNumber,
    whatsappVerifiedAt,
    aiInsightsEnabled,
  };
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const userId = toObjectId(session.user.id);
  if (!userId) return NextResponse.json({ ok: false, error: "Invalid session" }, { status: 500 });

  const db = await getDb();
  const users = db.collection("users");
  const user = await users.findOne({ _id: userId });

  return NextResponse.json({ ok: true, settings: normalizeSettings(user) });
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const userId = toObjectId(session.user.id);
  if (!userId) return NextResponse.json({ ok: false, error: "Invalid session" }, { status: 500 });

  const body = await req.json().catch(() => ({}));
  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: false, error: "Invalid request" }, { status: 400 });

  const db = await getDb();
  const users = db.collection("users");

  const existing = await users.findOne({ _id: userId });
  const verified = !!existing?.whatsappVerifiedAt;

  const $set: Record<string, any> = { updatedAt: new Date() };

  if (typeof parsed.data.emailAlertsEnabled === "boolean") $set.emailAlertsEnabled = parsed.data.emailAlertsEnabled;
  if (typeof parsed.data.aiInsightsEnabled === "boolean") $set.aiInsightsEnabled = parsed.data.aiInsightsEnabled;

  if (typeof parsed.data.whatsappAlertsEnabled === "boolean") {
    // only allow enabling if verified
    $set.whatsappAlertsEnabled = parsed.data.whatsappAlertsEnabled ? verified : false;
  }

  await users.updateOne({ _id: userId }, { $set });
  const user = await users.findOne({ _id: userId });

  return NextResponse.json({ ok: true, settings: normalizeSettings(user) });
}
