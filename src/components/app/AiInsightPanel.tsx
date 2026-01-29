"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Sparkles, Loader2 } from "lucide-react";

type AiStatus = "ready" | "unavailable" | "error";

type AiPayload = {
  rules: string;
  provider?: { name?: string; status?: string; model?: string };
  ai?: {
    summary: string;
    likely_causes: string[];
    actions: Array<{ title: string; why: string; effort: string; impact: string }>;
    confidence: string;
    note?: string;
  };
};

export function AiInsightPanel({ date, service }: { date: string; service: string }) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<AiStatus | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [payload, setPayload] = useState<AiPayload | null>(null);

  async function generate(force?: boolean) {
    if (loading) return;
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/ai/anomaly-insight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, service, force: !!force }),
      });

      const json = await res.json().catch(() => null);

      if (!json || typeof json !== "object" || json.ok !== true) {
        setStatus("error");
        setMessage("Could not generate insight.");
        setLoading(false);
        return;
      }

      setStatus((json.aiStatus as AiStatus) ?? "unavailable");
      setMessage(typeof json.message === "string" ? json.message : null);
      setPayload((json.insight as AiPayload) ?? null);
    } catch {
      setStatus("error");
      setMessage("Network error while generating insight.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-3 rounded-2xl border border-white/10 bg-surface/35 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold text-foreground">AI insight</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Optional. If AI is unavailable, you still get rules-based insight (no crash).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="neutral">Beta</Badge>

          <Button variant="secondary" size="sm" onClick={() => generate(false)} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {loading ? "Generating…" : "Generate"}
          </Button>

          <Button variant="ghost" size="sm" onClick={() => generate(true)} disabled={loading} title="Force regenerate">
            Refresh
          </Button>
        </div>
      </div>

      {message ? (
        <div className="mt-3 rounded-2xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-muted-foreground">
          {message}
        </div>
      ) : null}

      {status ? (
        <div className="mt-3 text-xs text-muted-foreground">
          Status: <span className="text-foreground font-semibold">{status}</span>
        </div>
      ) : null}

      {payload ? (
        <div className="mt-4 space-y-4">
          <div>
            <p className="text-xs font-semibold text-foreground">Rules-based breakdown</p>
            <pre className="mt-2 whitespace-pre-wrap rounded-2xl border border-white/10 bg-black/20 p-3 text-sm text-muted-foreground">
{payload.rules}
            </pre>
          </div>

          {payload.ai ? (
            <div>
              <p className="text-xs font-semibold text-foreground">AI suggestions</p>

              <div className="mt-2 space-y-3">
                <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                  <p className="text-sm font-semibold text-foreground">{payload.ai.summary}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Confidence: {payload.ai.confidence}</p>
                </div>

                {payload.ai.likely_causes?.length ? (
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                    <p className="text-sm font-semibold text-foreground">Likely causes</p>
                    <ul className="mt-2 list-disc pl-5 text-sm text-muted-foreground">
                      {payload.ai.likely_causes.slice(0, 5).map((c, i) => (
                        <li key={i}>{c}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {payload.ai.actions?.length ? (
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                    <p className="text-sm font-semibold text-foreground">Actions</p>
                    <div className="mt-2 space-y-2">
                      {payload.ai.actions.slice(0, 5).map((a, i) => (
                        <div key={i} className="rounded-xl border border-white/10 bg-surface/40 p-3">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-sm font-semibold text-foreground">{a.title}</p>
                            <p className="text-xs text-muted-foreground">
                              Impact: <span className="text-foreground">{a.impact}</span> · Effort:{" "}
                              <span className="text-foreground">{a.effort}</span>
                            </p>
                          </div>
                          <p className="mt-1 text-sm text-muted-foreground">{a.why}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                {payload.ai.note ? (
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-3 text-sm text-muted-foreground">
                    {payload.ai.note}
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
