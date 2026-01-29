import { NextResponse } from "next/server";
import { z } from "zod";
import { ObjectId } from "mongodb";

import { auth } from "@/auth";
import { checkRateLimit } from "@/lib/rateLimit";

import { ensureAwsIndexes } from "@/lib/aws/indexes";
import { awsConnectionsCol } from "@/lib/aws/collections";
import { encryptCredential } from "@/lib/aws/crypto";
import { pingCostExplorer } from "@/lib/aws/costExplorer";

export const runtime = "nodejs";

const BodySchema = z.object({
  accessKeyId: z.string().min(16).max(128),
  secretAccessKey: z.string().min(20).max(256),
  region: z.string().min(2).max(32).optional(),
});

function toObjectId(id: string) {
  try {
    return new ObjectId(id);
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const rl = await checkRateLimit({
    key: `aws:connect:${session.user.id}`,
    limit: 10,
    windowMs: 60 * 60 * 1000,
  });
  if (!rl.ok) {
    return NextResponse.json({ ok: false, error: "Too many requests. Try later." }, { status: 429 });
  }

  const userId = toObjectId(session.user.id);
  if (!userId) {
    return NextResponse.json({ ok: false, error: "Invalid user session" }, { status: 500 });
  }

  const json = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Invalid request" }, { status: 400 });
  }

  const accessKeyId = parsed.data.accessKeyId.trim();
  const secretAccessKey = parsed.data.secretAccessKey.trim();
  const region = parsed.data.region?.trim() || null;

  if (accessKeyId.includes(" ") || secretAccessKey.includes(" ")) {
    return NextResponse.json({ ok: false, error: "Keys must not contain spaces." }, { status: 400 });
  }

  await ensureAwsIndexes();

  // 1) Validate first (do not overwrite a working connection on failure)
  const ping = await pingCostExplorer({ accessKeyId, secretAccessKey });
  if (!ping.ok) {
    const status =
      ping.code === "INVALID_CREDENTIALS"
        ? 401
        : ping.code === "ACCESS_DENIED"
          ? 403
          : ping.code === "THROTTLED"
            ? 429
            : 502;

    return NextResponse.json(
      {
        ok: false,
        error: ping.message,
        code: ping.code,
      },
      { status }
    );
  }

  // 2) Store encrypted creds on success
  const col = await awsConnectionsCol();
  const now = new Date();

  const result = await col.findOneAndUpdate(
    { userId },
    {
      $set: {
        accessKeyId,
        secretAccessKeyEnc: encryptCredential(secretAccessKey),
        region,
        status: "connected",
        lastValidatedAt: now,
        lastError: null,
        updatedAt: now,
      },
      $setOnInsert: {
        createdAt: now,
        lastSyncAt: null,
      },
    },
    {
      upsert: true,
      returnDocument: "after",
      // ✅ Force ModifyResult<T> so `.value` exists in TS
      includeResultMetadata: true,
    }
  );

  // Types still allow null; handle it safely.
  const doc = result.value ?? (await col.findOne({ userId }));

  const suffix = accessKeyId.slice(-4);

  return NextResponse.json({
    ok: true,
    connection: {
      status: "connected",
      accessKeySuffix: suffix,
      region: doc?.region ?? region,
      lastValidatedAt: doc?.lastValidatedAt ?? now,
      lastSyncAt: doc?.lastSyncAt ?? null,
    },
  });
}

