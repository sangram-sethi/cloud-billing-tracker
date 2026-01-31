"use client";

import Link from "next/link";
import * as React from "react";
import { RefreshCw, Plug, TrendingUp } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { SpendSparkline } from "@/components/app/SpendSparkline";

type UsagePoint = { date: string; amount: number };
type UsageService = { service: string; amount: number; pct: number };

type UsageOk = {
  ok: true;
  connected: boolean;
  lastSyncAt: string | null;
  days: number;
  currency: string;
  totals: UsagePoint[];
  byService: UsageService[];
};

type UsageErr = { ok: false; error: string };

type SyncResponse = { ok: true; result: unknown } | { ok: false; error: string };

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function isUsageOk(v: unknown): v is UsageOk {
  if (!isRecord(v)) return false;
  if (v.ok !== true) return false;
  return (
    typeof v.connected === "boolean" &&
    (typeof v.lastSyncAt === "string" || v.lastSyncAt === null) &&
    typeof v.days === "number" &&
    typeof v.currency === "string" &&
    Array.isArray(v.totals) &&
    Array.isArray(v.byService)
  );
}

function isUsageErr(v: unknown): v is UsageErr {
  return isRecord(v) && v.ok === false && typeof v.error === "string";
}

function isSyncResponse(v: unknown): v is SyncResponse {
  if (!isRecord(v)) return false;
  if (v.ok === true) return "result" in v;
  if (v.ok === false) return typeof v.error === "string";
  return false;
}

function errMsg(e: unknown, fallback: string) {
  if (e instanceof Error && typeof e.message === "string" && e.message.trim()) return e.message;
  if (typeof e === "string" && e.trim()) return e;
  return fallback;
}

function fmtMoney(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: amount < 10 ? 2 : 0,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

function fmtDateLabel(ymd: string) {
  // "YYYY-MM-DD" -> "Jan 12"
  const [y, m, d] = ymd.split("-").map((n) => Number(n));
  if (!y || !m || !d) return ymd;
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function UsagePage() {
  const [data, setData] = React.useState<UsageOk | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [syncing, setSyncing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/aws/usage?days=30", { cache: "no-store" });
      const json: unknown = await res.json().catch(() => null);

      if (!isUsageOk(json) && !isUsageErr(json)) {
        setError("Failed to load usage.");
        setData(null);
        return;
      }

      if (!json.ok) {
        setError(json.error || "Failed to load usage.");
        setData(null);
        return;
      }

      setData(json);
    } catch (e: unknown) {
      setError(errMsg(e, "Failed to load usage."));
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

      if (isSyncResponse(json)) {
        if (!json.ok) setError(json.error || "Sync failed.");
      } else {
        // If API returned something unexpected, still show a safe error
        if (!res.ok) setError("Sync failed.");
      }

      await load();
    } catch (e: unknown) {
      setError(errMsg(e, "Sync failed."));
    } finally {
      setSyncing(false);
    }
  }

  React.useEffect(() => {
    void load();
  }, []);

  const currency = data?.currency || "USD";

  const totalSum = React.useMemo(() => {
    if (!data?.totals?.length) return 0;
    return data.totals.reduce((acc, p) => acc + (Number.isFinite(p.amount) ? p.amount : 0), 0);
  }, [data]);

  const last = data?.totals?.[data.totals.length - 1];

  const avg7 = React.useMemo(() => {
    if (!data?.totals?.length) return 0;
    const slice = data.totals.slice(-7);
    const s = slice.reduce((acc, p) => acc + (Number.isFinite(p.amount) ? p.amount : 0), 0);
    return slice.length ? s / slice.length : 0;
  }, [data]);

  const maxSvc = Math.max(1, ...(data?.byService?.map((s) => s.amount) ?? [1]));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Usage</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Daily spend for the last 30 days, plus your top cost drivers.
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
        <div className="rounded-2xl border border-danger/25 bg-danger/10 px-4 py-3 text-sm text-danger">{error}</div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle>Daily spend</CardTitle>
                <CardDescription>
                  {data?.lastSyncAt ? `Last synced ${new Date(data.lastSyncAt).toLocaleString()}` : "Not synced yet"}
                </CardDescription>
              </div>
              {loading ? (
                <Badge variant="neutral">Loading</Badge>
              ) : (
                <Badge variant={data?.connected ? "success" : "neutral"}>
                  {data?.connected ? "Connected" : "Not connected"}
                </Badge>
              )}
            </div>
          </CardHeader>

          <CardContent>
            {!data?.totals?.length ? (
              <div className="rounded-2xl border border-border/70 bg-surface/55 p-5">
                <p className="text-sm font-semibold text-foreground">No usage data yet</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Connect AWS, then hit <span className="font-semibold text-foreground">Sync now</span>.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-[1fr_220px]">
                <div className="rounded-2xl border border-border/70 bg-surface/45 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground">Last 30 days total</p>
                      <p className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
                        {fmtMoney(totalSum, currency)}
                      </p>
                    </div>
                    <div className="hidden sm:flex items-center gap-2 rounded-full border border-border/70 bg-surface/50 px-3 py-1.5">
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">7d avg</p>
                      <p className="text-xs font-semibold text-foreground">{fmtMoney(avg7, currency)}</p>
                    </div>
                  </div>

                  <div className="mt-4 rounded-2xl border border-white/10 bg-background/20 p-3">
                    <SpendSparkline points={data.totals} />
                    <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                      <span>{fmtDateLabel(data.totals[0].date)}</span>
                      <span>{fmtDateLabel(data.totals[data.totals.length - 1].date)}</span>
                    </div>
                  </div>

                  {last ? (
                    <p className="mt-3 text-xs text-muted-foreground">
                      Latest day:{" "}
                      <span className="font-semibold text-foreground">{fmtMoney(last.amount, currency)}</span> on{" "}
                      {fmtDateLabel(last.date)}
                    </p>
                  ) : null}
                </div>

                <div className="rounded-2xl border border-border/70 bg-surface/45 p-4">
                  <p className="text-xs font-semibold text-muted-foreground">Top services</p>
                  <div className="mt-3 space-y-3">
                    {(data.byService ?? []).slice(0, 6).map((s) => {
                      const w = Math.max(6, Math.round((s.amount / maxSvc) * 100));
                      return (
                        <div key={s.service} className="grid grid-cols-[1fr_90px] items-center gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center justify-between gap-3">
                              <p className="truncate text-sm font-semibold text-foreground">{s.service}</p>
                              <p className="text-xs text-muted-foreground">{Math.round(s.pct * 100)}%</p>
                            </div>
                            <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                              <div className="h-full bg-foreground" style={{ width: `${w}%` }} />
                            </div>
                          </div>
                          <p className="text-right text-sm font-semibold text-foreground">{fmtMoney(s.amount, currency)}</p>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-4 text-xs text-muted-foreground">Want per-service daily charts? That’s next.</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick actions</CardTitle>
            <CardDescription>Jump to alerts and weekly reports.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/app/anomalies" className="block">
              <div className="rounded-2xl border border-border/70 bg-surface/55 p-4 transition-colors hover:bg-surface/65">
                <p className="text-sm font-semibold text-foreground">View anomalies</p>
                <p className="mt-1 text-xs text-muted-foreground">Warnings + critical spend spikes.</p>
              </div>
            </Link>

            <Link href="/app/reports" className="block">
              <div className="rounded-2xl border border-border/70 bg-surface/55 p-4 transition-colors hover:bg-surface/65">
                <p className="text-sm font-semibold text-foreground">Founder report</p>
                <p className="mt-1 text-xs text-muted-foreground">Weekly digest (email + in-app).</p>
              </div>
            </Link>

            <Link href="/app/settings" className="block">
              <div className="rounded-2xl border border-border/70 bg-surface/55 p-4 transition-colors hover:bg-surface/65">
                <p className="text-sm font-semibold text-foreground">Notification settings</p>
                <p className="mt-1 text-xs text-muted-foreground">Email + WhatsApp + AI toggles.</p>
              </div>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
