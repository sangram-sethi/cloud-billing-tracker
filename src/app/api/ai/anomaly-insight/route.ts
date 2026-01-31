import { NextResponse } from "next/server";
import { z } from "zod";
import { ObjectId, type Collection, type Filter } from "mongodb";

import { auth } from "@/auth";
import { checkRateLimit } from "@/lib/rateLimit";

import { anomaliesCol, costDailyCol } from "@/lib/aws/collections";
import type { AnomalyDoc, AIInsight } from "@/lib/aws/types";
import { buildRulesInsight } from "@/lib/ai/rulesInsight";
import { generateGeminiInsight } from "@/lib/ai/gemini";

export const runtime = "nodejs";

// Accept either anomalyId (new UI) OR date+service (legacy callers)
const BodySchema = z.object({
  anomalyId: z.string().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  service: z.string().min(1).optional(),
  force: z.boolean().optional(),
});

type AnomalyAiStatus = "ready" | "unavailable" | "error";

function toObjectId(id: string): ObjectId | null {
  try {
    return new ObjectId(id);
  } catch {
    return null;
  }
}

function fmtMoney(amount: number, currency: string) {
  const v = Number.isFinite(amount) ? amount : 0;
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: v < 10 ? 2 : 0,
    }).format(v);
  } catch {
    return `${currency} ${v.toFixed(2)}`;
  }
}

function buildRulesFallbackInsight(params: {
  date: string;
  service: string;
  observed: number;
  baseline: number;
  pctChange: number;
  currency: string;
}): AIInsight {
  const { date, service, observed, baseline, pctChange, currency } = params;

  const label = service === "__TOTAL__" ? "Total spend" : service;
  const pctText = Number.isFinite(pctChange) ? `${Math.round(pctChange * 100)}%` : "a lot";

  const observedText = fmtMoney(observed, currency);
  const baselineText = fmtMoney(baseline, currency);

  const summary = `${label} spiked on ${date}: ${observedText} vs ${baselineText} (7-day baseline), ~${pctText} jump.`;

  const likelyCauses = [
    "New resources created or sudden scaling event (Auto Scaling, batch jobs, cron workloads).",
    "Data transfer / NAT Gateway / egress jumped due to traffic or routing changes.",
    "Deployment change shifted usage to a different region or pricing dimension.",
  ];

  const actionSteps = [
    "Open AWS Cost Explorer for that date → filter to the service → drill down by usage type and linked account.",
    "Check CloudTrail / deployment logs around the spike window (new stacks, scale events, scheduled jobs).",
    "Add/verify cost allocation tags, then set AWS Budgets alerts for total + key services.",
    "If the spend persists: consider rightsizing, schedules, Savings Plans (compute), or caching/CDN (egress).",
  ];

  return {
    provider: "local",
    model: "rules",
    summary,
    likelyCauses,
    actionSteps,
    createdAt: new Date(),
  };
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

  // Even if rate-limited, respond 200 with unavailable so UI doesn't crash
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

  const body = (await req.json().catch(() => ({}))) as unknown;
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Invalid request" }, { status: 400 });
  }

  const { anomalyId, date: dateIn, service: serviceIn, force } = parsed.data;

  const aCol = (await anomaliesCol()) as unknown as Collection<AnomalyDoc>;
  const cCol = await costDailyCol();

  const anomalyObjectId = typeof anomalyId === "string" ? toObjectId(anomalyId) : null;

  // Load anomaly either by _id (preferred) or date+service (legacy)
  const anomaly = anomalyObjectId
    ? await aCol.findOne({ userId, _id: anomalyObjectId } as Filter<AnomalyDoc>)
    : dateIn && serviceIn
      ? await aCol.findOne({ userId, date: dateIn, service: serviceIn } as Filter<AnomalyDoc>)
      : null;

  if (!anomaly) {
    return NextResponse.json({ ok: false, error: "Anomaly not found" }, { status: 404 });
  }

  const date = String(anomaly.date ?? "");
  const service = String(anomaly.service ?? "");
  if (!date || !service) {
    return NextResponse.json({ ok: false, error: "Invalid anomaly record" }, { status: 500 });
  }

  // Cached return
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

  // Currency from cost_daily (fallback USD)
  const dayTotal = await cCol.findOne({ userId, date, service: "__TOTAL__" });
  const currency = typeof dayTotal?.currency === "string" ? dayTotal.currency : "USD";

  const observed = Number(anomaly.observed ?? 0);
  const baseline = Number(anomaly.baseline ?? 0);
  const pctChange = Number(anomaly.pctChange ?? 0);

  // Always compute rules insight text (deterministic baseline, used for context/prompt)
  const rulesText = await buildRulesInsight({
    userId,
    date,
    service,
    currency,
    observed,
    baseline,
    pctChange,
  });

  // Default: rules-only AIInsight (stored + returned if Gemini unavailable)
  let aiInsight: AIInsight = buildRulesFallbackInsight({
    date,
    service,
    observed,
    baseline,
    pctChange,
    currency,
  });

  let aiStatus: AnomalyAiStatus = "ready";
  let message: string | null = null;

  const prompt = `
You are a senior cloud cost-optimization assistant.

Task:
Given the anomaly details + rules breakdown below, produce a short, practical response.

Rules:
- Do not invent numbers. Use only what is provided.
- Prefer AWS-native actions (Budgets, Cost Explorer, tagging, rightsizing, schedules, Savings Plans, logs).
- Be concise and actionable.

Return STRICT JSON that matches:
{
  "summary": string,
  "likely_causes": string[],
  "actions": [
    { "title": string, "why": string, "effort": "low"|"medium"|"high", "impact": "low"|"medium"|"high" }
  ],
  "confidence": "low"|"medium"|"high"
}

Anomaly:
- date: ${date}
- series: ${service === "__TOTAL__" ? "TOTAL" : service}
- observed: ${observed}
- baseline_7d: ${baseline}
- pct_jump_ratio: ${pctChange}

Rules breakdown (authoritative):
${rulesText}
`.trim();

  const ai = await generateGeminiInsight({ prompt });

  if (ai.ok && ai.status === "ok") {
    // Map GeminiInsight (snake_case + actions[]) -> AIInsight (camelCase + actionSteps[])
    aiInsight = {
      provider: "gemini",
      model: ai.model,
      summary: ai.insight.summary,
      likelyCauses: Array.isArray(ai.insight.likely_causes) ? ai.insight.likely_causes : [],
      actionSteps: Array.isArray(ai.insight.actions)
        ? ai.insight.actions
            .map((a) => `${a.title} — ${a.why}`.trim())
            .filter((s) => s.length > 0)
        : [],
      createdAt: new Date(),
    };

    aiStatus = "ready";
  } else if (ai.ok && (ai.status === "disabled" || ai.status === "quota")) {
    aiStatus = "unavailable";
    message = ai.message;
    // keep rules fallback aiInsight
  } else {
    aiStatus = "error";
    message = ai.message;
    // keep rules fallback aiInsight
  }

  const now = new Date();

  await aCol.updateOne(
    { userId, _id: anomaly._id } as Filter<AnomalyDoc>,
    {
      $set: {
        aiInsight,
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
      insight: aiInsight,
      updatedAt: now,
    },
    { status: 200 }
  );
}
