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

function getTextFromGeminiResponse(data: any): string {
  const parts = data?.candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts)) return "";
  return parts.map((p: any) => (typeof p?.text === "string" ? p.text : "")).join("").trim();
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

    // JSON-mode (REST) uses generationConfig.response_mime_type / response_schema (per Gemini docs).
    const body = {
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

    const data = await res.json().catch(() => ({}));
    const rawText = getTextFromGeminiResponse(data);

    if (!res.ok) {
      const code = data?.error?.code;
      const msg = data?.error?.message || "Gemini request failed.";

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
    let parsed: any = null;
    try {
      parsed = rawText ? JSON.parse(rawText) : null;
    } catch {
      // If JSON parsing fails, treat as error but keep UI safe.
      return { ok: true, status: "error", message: "AI returned an invalid JSON response." };
    }

    // Minimal normalization
    const insight: GeminiInsight = {
      summary: String(parsed?.summary ?? ""),
      likely_causes: Array.isArray(parsed?.likely_causes) ? parsed.likely_causes.map(String) : [],
      actions: Array.isArray(parsed?.actions)
        ? parsed.actions.map((a: any) => ({
            title: String(a?.title ?? ""),
            why: String(a?.why ?? ""),
            effort: (String(a?.effort ?? "low") as any) || "low",
            impact: (String(a?.impact ?? "low") as any) || "low",
          }))
        : [],
      confidence: (String(parsed?.confidence ?? "medium") as any) || "medium",
      note: parsed?.note ? String(parsed.note) : undefined,
    };

    return { ok: true, status: "ok", model, insight, rawText };
  } catch (e: any) {
    if (e?.name === "AbortError") {
      return { ok: true, status: "error", message: "AI timed out. Showing rules-based insight only." };
    }
    return { ok: true, status: "error", message: "AI failed. Showing rules-based insight only." };
  } finally {
    clearTimeout(timeout);
  }
}
