"use client";

import Link from "next/link";
import * as React from "react";
import { AlertTriangle, RefreshCw, Plug, Sparkles } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/cn";

type AIInsightOut = {
  provider: "gemini" | "openai" | "local";
  model: string;
  summary: string;
  likelyCauses: string[];
  actionSteps: string[];
  createdAt?: string; // Date serialized from API/DB
};

type Anomaly = {
  id: string;
  date: string | null;
  service: string | null;
  severity: string | null;
  status: string;
  message: string | null;
  observed: number | null;
  baseline: number | null;
  pctChange: number | null;
  zScore: number | null;
  aiStatus: string | null;
  aiInsight: AIInsightOut | string | null; // tolerate older docs
  updatedAt: string | null;
  createdAt: string | null;
};

type RespOk = {
  ok: true;
  connected: boolean;
  lastSyncAt: string | null;
  days: number;
  anomalies: Anomaly[];
};

type RespErr = { ok: false; error: string };

type OkErr = { ok: boolean; error?: string };

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function isOkErr(v: unknown): v is OkErr {
  return isRecord(v) && typeof v.ok === "boolean";
}

function isAIInsight(v: unknown): v is AIInsightOut {
  if (!isRecord(v)) return false;
  if (typeof v.summary !== "string") return false;
  if (!Array.isArray(v.likelyCauses) || !Array.isArray(v.actionSteps)) return false;
  if (typeof v.provider !== "string" || typeof v.model !== "string") return false;
  return true;
}

function fmtDateLabel(ymd: string | null) {
  if (!ymd) return "—";
  const [y, m, d] = ymd.split("-").map((n) => Number(n));
  if (!y || !m || !d) return ymd;
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function sevVariant(sev: string | null) {
  const s = (sev || "").toLowerCase();
  if (s.includes("critical") || s.includes("high")) return "danger" as const;
  if (s.includes("warn") || s.includes("medium")) return "warning" as const;
  return "neutral" as const;
}

function pct(p: number | null) {
  if (p === null || !Number.isFinite(p)) return "—";
  const v = p * 100;
  const sign = v >= 0 ? "+" : "";
  return `${sign}${v.toFixed(Math.abs(v) < 10 ? 1 : 0)}%`;
}

export default function AnomaliesPage() {
  const [data, setData] = React.useState<RespOk | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [syncing, setSyncing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [severity, setSeverity] = React.useState<"all" | "warning" | "danger">("all");
  const [q, setQ] = React.useState("");

  const [openId, setOpenId] = React.useState<string | null>(null);
  const [aiBusyId, setAiBusyId] = React.useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/aws/anomalies?days=30&limit=80", { cache: "no-store" });
      const json = (await res.json().catch(() => null)) as RespOk | RespErr | null;

      if (!json || !("ok" in json)) {
        setError("Failed to load anomalies.");
        setData(null);
        return;
      }
      if (!json.ok) {
        setError(json.error || "Failed to load anomalies.");
        setData(null);
        return;
      }
      setData(json);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to load anomalies.";
      setError(msg);
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  async function syncNow() {
    setSyncing(true);
    setError(null);
    try {
      const res = await fetch("/api/aws/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ days: 30 }),
      });

      const json: unknown = await res.json().catch(() => null);
      if (isOkErr(json) && json.ok === false) {
        setError(typeof json.error === "string" ? json.error : "Sync failed.");
      }

      await load();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Sync failed.";
      setError(msg);
    } finally {
      setSyncing(false);
    }
  }

  async function generateAi(anomalyId: string) {
    setAiBusyId(anomalyId);
    setError(null);
    try {
      const res = await fetch("/api/ai/anomaly-insight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ anomalyId }),
      });

      const json: unknown = await res.json().catch(() => null);

      // Best-effort: quota hit should NOT crash UI.
      if (isOkErr(json) && json.ok === false) {
        setError(typeof json.error === "string" ? json.error : "AI insight unavailable right now.");
      }

      await load();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "AI insight unavailable right now.";
      setError(msg);
    } finally {
      setAiBusyId(null);
    }
  }

  React.useEffect(() => {
    void load();
  }, []);

  const filtered = React.useMemo(() => {
    const all = data?.anomalies ?? [];
    return all.filter((a) => {
      const s = sevVariant(a.severity);
      if (severity === "danger" && s !== "danger") return false;
      if (severity === "warning" && !(s === "warning" || s === "danger")) return false;

      if (q.trim().length) {
        const hay = `${a.service ?? ""} ${a.message ?? ""}`.toLowerCase();
        if (!hay.includes(q.trim().toLowerCase())) return false;
      }
      return true;
    });
  }, [data, severity, q]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Anomalies</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Spend spikes and unusual behavior detected from your cost time series.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {data?.connected === false ? (
            <Link href="/app/connect-aws" className="inline-flex">
              <Button variant="primary">
                <Plug className="h-4 w-4" />
                Connect AWS
              </Button>
            </Link>
          ) : null}

          <Button type="button" variant="secondary" onClick={() => void syncNow()} disabled={syncing || loading}>
            <RefreshCw className="h-4 w-4" />
            {syncing ? "Syncing…" : "Sync now"}
          </Button>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-danger/25 bg-danger/10 px-4 py-3 text-sm text-danger">
          {error}
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle>Alert history</CardTitle>
              <CardDescription>
                {data?.lastSyncAt ? `Last synced ${new Date(data.lastSyncAt).toLocaleString()}` : "Not synced yet"}
              </CardDescription>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="flex items-center gap-2">
                {loading ? (
                  <Badge variant="neutral">Loading</Badge>
                ) : (
                  <Badge variant={data?.connected ? "success" : "neutral"}>
                    {data?.connected ? "Connected" : "Not connected"}
                  </Badge>
                )}

                <Badge variant="neutral">{filtered.length} shown</Badge>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSeverity("all")}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs font-semibold backdrop-blur transition-colors",
                    severity === "all"
                      ? "border-white/15 bg-surface/60 text-foreground"
                      : "border-border/70 bg-surface/40 text-muted-foreground hover:text-foreground"
                  )}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => setSeverity("warning")}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs font-semibold backdrop-blur transition-colors",
                    severity === "warning"
                      ? "border-white/15 bg-surface/60 text-foreground"
                      : "border-border/70 bg-surface/40 text-muted-foreground hover:text-foreground"
                  )}
                >
                  Warning+
                </button>
                <button
                  type="button"
                  onClick={() => setSeverity("danger")}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs font-semibold backdrop-blur transition-colors",
                    severity === "danger"
                      ? "border-white/15 bg-surface/60 text-foreground"
                      : "border-border/70 bg-surface/40 text-muted-foreground hover:text-foreground"
                  )}
                >
                  Critical
                </button>
              </div>

              <div className="min-w-55">
                <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search service / message" />
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {!filtered.length ? (
            <div className="rounded-2xl border border-border/70 bg-surface/55 p-5">
              <p className="text-sm font-semibold text-foreground">No anomalies found</p>
              <p className="mt-1 text-sm text-muted-foreground">If you just connected AWS, hit Sync now and come back.</p>
            </div>
          ) : (
            <div className="max-h-140 space-y-3 overflow-auto pr-1">
              {filtered.map((a) => {
                const isOpen = openId === a.id;
                const sev = sevVariant(a.severity);

                const insight =
                  typeof a.aiInsight === "string" ? a.aiInsight : isAIInsight(a.aiInsight) ? a.aiInsight : null;

                return (
                  <div key={a.id} className="rounded-2xl border border-border/70 bg-surface/55 backdrop-blur">
                    <button
                      type="button"
                      onClick={() => setOpenId(isOpen ? null : a.id)}
                      className="w-full rounded-2xl px-4 py-4 text-left transition-colors hover:bg-surface/65"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <AlertTriangle
                              className={cn(
                                "h-4 w-4",
                                sev === "danger"
                                  ? "text-danger"
                                  : sev === "warning"
                                  ? "text-warning"
                                  : "text-muted-foreground"
                              )}
                            />
                            <p className="truncate text-sm font-semibold text-foreground">
                              {a.service || "Unknown service"}
                            </p>
                            <p className="text-xs text-muted-foreground">· {fmtDateLabel(a.date)}</p>
                          </div>

                          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{a.message || "—"}</p>

                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <Badge variant={sev}>{(a.severity || "Unknown").toString()}</Badge>
                            <Badge variant="neutral">{a.status || "open"}</Badge>
                            {a.pctChange !== null ? <Badge variant={sev}>{pct(a.pctChange)}</Badge> : null}
                            {a.aiStatus === "ready" ? <Badge variant="success">AI ready</Badge> : null}
                            {a.aiStatus === "unavailable" ? <Badge variant="neutral">AI unavailable</Badge> : null}
                          </div>
                        </div>

                        <div className="shrink-0 text-right">
                          <p className="text-xs text-muted-foreground">Observed</p>
                          <p className="mt-1 text-sm font-semibold text-foreground">
                            {typeof a.observed === "number" ? a.observed.toFixed(2) : "—"}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            baseline {typeof a.baseline === "number" ? a.baseline.toFixed(2) : "—"}
                          </p>
                        </div>
                      </div>
                    </button>

                    {isOpen ? (
                      <div className="border-t border-white/10 px-4 py-4">
                        <div className="grid gap-3 md:grid-cols-2">
                          <div className="rounded-2xl border border-white/10 bg-background/20 p-3">
                            <p className="text-xs font-semibold text-muted-foreground">Detection</p>
                            <div className="mt-2 grid gap-1 text-sm">
                              <div className="flex items-center justify-between gap-3">
                                <span className="text-muted-foreground">Observed</span>
                                <span className="font-semibold text-foreground">
                                  {typeof a.observed === "number" ? a.observed.toFixed(2) : "—"}
                                </span>
                              </div>
                              <div className="flex items-center justify-between gap-3">
                                <span className="text-muted-foreground">Baseline</span>
                                <span className="font-semibold text-foreground">
                                  {typeof a.baseline === "number" ? a.baseline.toFixed(2) : "—"}
                                </span>
                              </div>
                              <div className="flex items-center justify-between gap-3">
                                <span className="text-muted-foreground">Change</span>
                                <span className="font-semibold text-foreground">{pct(a.pctChange)}</span>
                              </div>
                              <div className="flex items-center justify-between gap-3">
                                <span className="text-muted-foreground">Z-score</span>
                                <span className="font-semibold text-foreground">
                                  {typeof a.zScore === "number" ? a.zScore.toFixed(2) : "—"}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="rounded-2xl border border-white/10 bg-background/20 p-3">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-xs font-semibold text-muted-foreground">AI insight</p>
                                <p className="mt-1 text-xs text-muted-foreground">
                                  Best-effort. If quota is hit, we gracefully fall back.
                                </p>
                              </div>
                              <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                onClick={() => void generateAi(a.id)}
                                disabled={aiBusyId === a.id}
                              >
                                <Sparkles className="h-4 w-4" />
                                {aiBusyId === a.id ? "Generating…" : "Explain"}
                              </Button>
                            </div>

                            <div className="mt-3 rounded-xl border border-border/70 bg-surface/55 p-3">
                              {insight ? (
                                typeof insight === "string" ? (
                                  <p className="text-sm text-foreground/90">{insight}</p>
                                ) : (
                                  <div className="space-y-3">
                                    <div>
                                      <p className="text-sm font-semibold text-foreground">Summary</p>
                                      <p className="mt-1 text-sm text-foreground/90">{insight.summary}</p>
                                      <p className="mt-1 text-xs text-muted-foreground">
                                        Provider: {insight.provider} · Model: {insight.model}
                                      </p>
                                    </div>

                                    {insight.likelyCauses?.length ? (
                                      <div>
                                        <p className="text-sm font-semibold text-foreground">Likely causes</p>
                                        <ul className="mt-1 list-disc space-y-1 pl-4 text-sm text-foreground/90">
                                          {insight.likelyCauses.slice(0, 6).map((c, idx) => (
                                            <li key={idx}>{c}</li>
                                          ))}
                                        </ul>
                                      </div>
                                    ) : null}

                                    {insight.actionSteps?.length ? (
                                      <div>
                                        <p className="text-sm font-semibold text-foreground">Recommended actions</p>
                                        <ol className="mt-1 list-decimal space-y-1 pl-4 text-sm text-foreground/90">
                                          {insight.actionSteps.slice(0, 8).map((s, idx) => (
                                            <li key={idx}>{s}</li>
                                          ))}
                                        </ol>
                                      </div>
                                    ) : null}
                                  </div>
                                )
                              ) : (
                                <p className="text-sm text-muted-foreground">
                                  {a.aiStatus === "unavailable"
                                    ? "AI is currently unavailable. Your anomaly detection still works normally."
                                    : "No AI insight yet. Click Explain to generate one."}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
