import { NextResponse } from "next/server";
import { z } from "zod";
import { ObjectId } from "mongodb";

import { auth } from "@/auth";
import { checkRateLimit } from "@/lib/rateLimit";

import { anomaliesCol, costDailyCol } from "@/lib/aws/collections";
import { buildRulesInsight } from "@/lib/ai/rulesInsight";
import { generateGeminiInsight } from "@/lib/ai/gemini";

export const runtime = "nodejs";

const BodySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  service: z.string().min(1),
  force: z.boolean().optional(),
});

type AnomalyAiStatus = "ready" | "unavailable" | "error";

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
    key: `ai:insight:${session.user.id}`,
    limit: 40,
    windowMs: 60 * 60 * 1000,
  });

  // NOTE: even if rate limited, we respond 200 with unavailable so UI doesn't crash
  if (!rl.ok) {
    return NextResponse.json(
      {
        ok: true,
        cached: false,
        aiStatus: "unavailable" as AnomalyAiStatus,
        message: "AI rate limit reached. Try later.",
        insight: null,
      },
      { status: 200 }
    );
  }

  const userId = toObjectId(session.user.id);
  if (!userId) {
    return NextResponse.json({ ok: false, error: "Invalid user session" }, { status: 500 });
  }

  const json = await req.json().catch(() => ({}));
  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Invalid request" }, { status: 400 });
  }

  const { date, service, force } = parsed.data;

  const aCol = await anomaliesCol();
  const anomaly = await aCol.findOne({ userId, date, service });

  if (!anomaly) {
    return NextResponse.json({ ok: false, error: "Anomaly not found" }, { status: 404 });
  }

  // Cached return (no schema assumptions beyond aiInsight/aiStatus existing)
  if (!force && anomaly.aiInsight && anomaly.aiStatus) {
    return NextResponse.json(
      {
        ok: true,
        cached: true,
        aiStatus: anomaly.aiStatus,
        message: null,
        insight: anomaly.aiInsight,
      },
      { status: 200 }
    );
  }

  // Currency isn't on AnomalyDoc in your repo → fetch from cost_daily (fallback USD)
  const cCol = await costDailyCol();
  const dayTotal = await cCol.findOne({ userId, date, service: "__TOTAL__" });
  const currency = typeof dayTotal?.currency === "string" ? dayTotal.currency : "USD";

  const observed = Number(anomaly.observed ?? 0);
  const baseline = Number(anomaly.baseline ?? 0);
  const pctChange = Number(anomaly.pctChange ?? 0);

  // Always build rules-based insight (free + deterministic)
  const rules = await buildRulesInsight({
    userId,
    date,
    service,
    currency,
    observed,
    baseline,
    pctChange,
  });

  // Optional Gemini
  const prompt = `
You are a senior cloud cost-optimization assistant.

Task:
Given the anomaly details + rules breakdown below, produce a short, practical response.

Rules:
- Do not invent numbers. Use only what is provided.
- Prefer AWS-native actions (Budgets, Cost Explorer, tagging, rightsizing, schedules, Savings Plans, logs).
- Be concise and actionable.

Anomaly:
- date: ${date}
- series: ${service === "__TOTAL__" ? "TOTAL" : service}
- observed: ${observed}
- baseline_7d: ${baseline}
- pct_jump_ratio: ${pctChange}

Rules breakdown (authoritative):
${rules}
`.trim();

  const ai = await generateGeminiInsight({ prompt });

  const storedInsight: any = { rules };
  let aiStatus: AnomalyAiStatus = "ready";
  let message: string | null = null;

  // Map Gemini statuses → your repo's aiStatus union
  if (ai.ok && ai.status === "ok") {
    storedInsight.ai = ai.insight;
    storedInsight.provider = { name: "gemini", status: "ok", model: ai.model };
    aiStatus = "ready";
  } else if (ai.ok && (ai.status === "disabled" || ai.status === "quota")) {
    storedInsight.provider = { name: "gemini", status: ai.status };
    aiStatus = "unavailable";
    message = ai.message;
  } else {
    storedInsight.provider = { name: "gemini", status: "error" };
    aiStatus = "error";
    message = ai.ok ? ai.message : ai.message;
  }

  const now = new Date();

  // Only set fields that exist in your AnomalyDoc (aiInsight, aiStatus, updatedAt)
  await aCol.updateOne(
    { userId, date, service },
    {
      $set: {
        aiInsight: storedInsight,
        aiStatus,
        updatedAt: now,
      },
    }
  );

  return NextResponse.json(
    {
      ok: true,
      cached: false,
      aiStatus,
      message,
      insight: storedInsight,
      updatedAt: now,
    },
    { status: 200 }
  );
}
