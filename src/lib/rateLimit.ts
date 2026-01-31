import { getDb } from "@/lib/mongodb";

type RateLimitDoc = {
  _id: string; // we use string keys like "ai:insight:<userId>"
  count: number;
  resetAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
};

type RateLimitResult =
  | { ok: true; remaining: number; resetAt: Date }
  | { ok: false; remaining: 0; resetAt: Date };

export async function checkRateLimit(params: {
  key: string;
  limit: number;
  windowMs: number;
}): Promise<RateLimitResult> {
  const { key, limit, windowMs } = params;

  const db = await getDb();
  const col = db.collection<RateLimitDoc>("rate_limits");

  const now = new Date();
  const existing = await col.findOne({ _id: key });

  // If missing or expired window → reset counter to 1
  if (!existing || existing.resetAt <= now) {
    const resetAt = new Date(now.getTime() + windowMs);

    await col.updateOne(
      { _id: key },
      {
        $set: { count: 1, resetAt, updatedAt: now },
        $setOnInsert: { createdAt: now },
      },
      { upsert: true }
    );

    return { ok: true, remaining: Math.max(0, limit - 1), resetAt };
  }

  // Window active, but already over limit
  if (existing.count >= limit) {
    return { ok: false, remaining: 0, resetAt: existing.resetAt };
  }

  // Increment within active window
  await col.updateOne(
    { _id: key },
    { $inc: { count: 1 }, $set: { updatedAt: now } }
  );

  const remaining = Math.max(0, limit - (existing.count + 1));
  return { ok: true, remaining, resetAt: existing.resetAt };
}
