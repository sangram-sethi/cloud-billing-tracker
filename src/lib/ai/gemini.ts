export type GeminiStatus = "ok" | "disabled" | "quota" | "error";

export type GeminiInsight = {
  summary: string;
  likely_causes: string[];
  actions: Array<{
    title: string;
    why: string;
    effort: "low" | "medium" | "high";
    impact: "low" | "medium" | "high";
  }>;
  confidence: "low" | "medium" | "high";
  note?: string;
};

type Effort = GeminiInsight["actions"][number]["effort"];
type Impact = GeminiInsight["actions"][number]["impact"];
type Confidence = GeminiInsight["confidence"];

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function getString(v: unknown): string | undefined {
  return typeof v === "string" ? v : undefined;
}

function getNumber(v: unknown): number | undefined {
  return typeof v === "number" && Number.isFinite(v) ? v : undefined;
}

function asEffort(v: unknown): Effort {
  const s = (typeof v === "string" ? v.toLowerCase() : "").trim();
  if (s === "high") return "high";
  if (s === "medium") return "medium";
  return "low";
}

function asImpact(v: unknown): Impact {
  const s = (typeof v === "string" ? v.toLowerCase() : "").trim();
  if (s === "high") return "high";
  if (s === "medium") return "medium";
  return "low";
}

function asConfidence(v: unknown): Confidence {
  const s = (typeof v === "string" ? v.toLowerCase() : "").trim();
  if (s === "high") return "high";
  if (s === "low") return "low";
  return "medium";
}

function isAbortError(e: unknown): boolean {
  if (isRecord(e) && typeof e.name === "string") return e.name === "AbortError";
  if (e instanceof Error && typeof e.name === "string") return e.name === "AbortError";
  return false;
}

function getTextFromGeminiResponse(data: unknown): string {
  if (!isRecord(data)) return "";

  const candidates = data.candidates;
  if (!Array.isArray(candidates) || candidates.length === 0) return "";

  const first = candidates[0];
  if (!isRecord(first)) return "";

  const content = first.content;
  if (!isRecord(content)) return "";

  const parts = content.parts;
  if (!Array.isArray(parts)) return "";

  return parts
    .map((p) => {
      if (!isRecord(p)) return "";
      return typeof p.text === "string" ? p.text : "";
    })
    .join("")
    .trim();
}

function getGeminiErrorInfo(data: unknown): { code?: number; message?: string } {
  if (!isRecord(data)) return {};
  const err = data.error;
  if (!isRecord(err)) return {};

  return {
    code: getNumber(err.code),
    message: getString(err.message),
  };
}

export async function generateGeminiInsight(params: {
  prompt: string;
  timeoutMs?: number;
}): Promise<
  | { ok: true; status: "ok"; model: string; insight: GeminiInsight; rawText: string }
  | { ok: true; status: Exclude<GeminiStatus, "ok">; message: string }
  | { ok: false; status: GeminiStatus; message: string }
> {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL ?? "gemini-2.0-flash";

  if (!apiKey) {
    return { ok: true, status: "disabled", message: "AI is disabled (missing GEMINI_API_KEY)." };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), params.timeoutMs ?? 12_000);

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
      model
    )}:generateContent?key=${encodeURIComponent(apiKey)}`;

    // JSON-mode (REST) uses generationConfig.response_mime_type / response_schema.
    const body: unknown = {
      contents: [
        {
          role: "user",
          parts: [{ text: params.prompt }],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        max_output_tokens: 700,
        response_mime_type: "application/json",
        response_schema: {
          type: "OBJECT",
          properties: {
            summary: { type: "STRING" },
            likely_causes: { type: "ARRAY", items: { type: "STRING" } },
            actions: {
              type: "ARRAY",
              items: {
                type: "OBJECT",
                properties: {
                  title: { type: "STRING" },
                  why: { type: "STRING" },
                  effort: { type: "STRING" },
                  impact: { type: "STRING" },
                },
                required: ["title", "why", "effort", "impact"],
              },
            },
            confidence: { type: "STRING" },
            note: { type: "STRING" },
          },
          required: ["summary", "likely_causes", "actions", "confidence"],
        },
      },
    };

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    const data: unknown = await res.json().catch(() => ({}));
    const rawText = getTextFromGeminiResponse(data);

    if (!res.ok) {
      const { code, message } = getGeminiErrorInfo(data);
      const msg = message ?? "Gemini request failed.";

      // Quota / throttling
      if (res.status === 429 || code === 429) {
        return { ok: true, status: "quota", message: "AI quota reached. Showing rules-based insight only." };
      }

      // Invalid key / permission / model issues
      if (res.status === 401 || res.status === 403) {
        return { ok: true, status: "disabled", message: "AI is not available (API key permissions / auth)." };
      }

      return { ok: true, status: "error", message: msg };
    }

    // JSON text should be returned as text; parse it.
    let parsed: unknown = null;
    try {
      parsed = rawText ? JSON.parse(rawText) : null;
    } catch {
      return { ok: true, status: "error", message: "AI returned an invalid JSON response." };
    }

    // Normalize safely
    const obj = isRecord(parsed) ? parsed : {};

    const likely = Array.isArray(obj.likely_causes)
      ? obj.likely_causes.map((x) => String(x))
      : [];

    const actions = Array.isArray(obj.actions)
      ? obj.actions.map((a): GeminiInsight["actions"][number] => {
          const act = isRecord(a) ? a : {};
          return {
            title: String(act.title ?? ""),
            why: String(act.why ?? ""),
            effort: asEffort(act.effort),
            impact: asImpact(act.impact),
          };
        })
      : [];

    const insight: GeminiInsight = {
      summary: String(obj.summary ?? ""),
      likely_causes: likely,
      actions,
      confidence: asConfidence(obj.confidence),
      note: obj.note != null ? String(obj.note) : undefined,
    };

    return { ok: true, status: "ok", model, insight, rawText };
  } catch (e: unknown) {
    if (isAbortError(e)) {
      return { ok: true, status: "error", message: "AI timed out. Showing rules-based insight only." };
    }
    return { ok: true, status: "error", message: "AI failed. Showing rules-based insight only." };
  } finally {
    clearTimeout(timeout);
  }
}
