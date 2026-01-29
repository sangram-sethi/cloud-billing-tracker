import { getDb } from "@/lib/mongodb";

type RateLimitResult =
  | { ok: true; remaining: number; resetAt: Date }
  | { ok: false; remaining: 0; resetAt: Date };

export async function checkRateLimit(params: { key: string; limit: number; windowMs: number }): Promise<RateLimitResult> {
  const { key, limit, windowMs } = params;
  const db = await getDb();
  const col = db.collection("rate_limits");

  const now = new Date();
  const existing = await col.findOne<{ _id: string; count: number; resetAt: Date }>({ _id: key });

  if (!existing || existing.resetAt <= now) {
    const resetAt = new Date(now.getTime() + windowMs);
    await col.updateOne(
      { _id: key },
      { $set: { count: 1, resetAt }, $setOnInsert: { createdAt: now } },
      { upsert: true }
    );
    return { ok: true, remaining: limit - 1, resetAt };
  }

  if (existing.count >= limit) {
    return { ok: false, remaining: 0, resetAt: existing.resetAt };
  }

  await col.updateOne({ _id: key }, { $inc: { count: 1 } });
  return { ok: true, remaining: Math.max(0, limit - (existing.count + 1)), resetAt: existing.resetAt };
}
