"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { SyncNowButton } from "@/components/app/SyncNowButton";
import { AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";

type Severity = "info" | "warning" | "critical";

type AnomalyRow = {
  date: string; // YYYY-MM-DD
  service: string;
  severity: Severity;
  message: string;
  observed: number;
  baseline: number;
  pctChange: number;
  zScore: number | null;
  status: "open" | "resolved" | string;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type AnomaliesViewModel = {
  status: "not_connected" | "connected" | "failed";
  currency: string;
  lastSyncAt: string | null;
  anomalies: AnomalyRow[];
};

type Filter = "all" | "total" | "services";

function badgeForSeverity(s: Severity) {
  if (s === "critical") return { variant: "danger" as const, text: "Critical" };
  if (s === "warning") return { variant: "warning" as const, text: "Warning" };
  return { variant: "neutral" as const, text: "Info" };
}

function statusBadge(status: AnomaliesViewModel["status"]) {
  if (status === "connected") return { variant: "success" as const, text: "Connected" };
  if (status === "failed") return { variant: "danger" as const, text: "Needs attention" };
  return { variant: "neutral" as const, text: "Not connected" };
}

function fmtTime(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, { month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function fmtMoney(amount: number, currency: string) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 2 }).format(
    Number.isFinite(amount) ? amount : 0
  );
}

function fmtPct(p: number) {
  if (!Number.isFinite(p)) return "∞";
  return `${Math.round(p * 100)}%`;
}

function fmtShortDate(ymd: string) {
  const d = new Date(ymd + "T00:00:00Z");
  if (Number.isNaN(d.getTime())) return ymd;
  return d.toLocaleDateString(undefined, { month: "short", day: "2-digit" });
}

export function AnomaliesListClient({ model }: { model: AnomaliesViewModel }) {
  const [syncMsg, setSyncMsg] = useState<string | null>(null);
  const [syncErr, setSyncErr] = useState<string | null>(null);
  const [showResolved, setShowResolved] = useState(false);
  const [openSet, setOpenSet] = useState<Set<string>>(() => new Set());
  const [filter, setFilter] = useState<Filter>("all");

  const badge = statusBadge(model.status);

  const rows = useMemo(() => {
    let list = [...model.anomalies];

    if (!showResolved) list = list.filter((a) => a.status !== "resolved");
    if (filter === "total") list = list.filter((a) => a.service === "__TOTAL__");
    if (filter === "services") list = list.filter((a) => a.service !== "__TOTAL__");

    return list;
  }, [model.anomalies, showResolved, filter]);

  const counts = useMemo(() => {
    const total = model.anomalies.filter((a) => a.service === "__TOTAL__").length;
    const services = model.anomalies.length - total;
    return { total, services, all: model.anomalies.length };
  }, [model.anomalies]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Anomalies</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Spikes detected using a 7-day baseline (moving average + % jump). Now includes top services.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={badge.variant}>{badge.text}</Badge>
          <SyncNowButton
            variant="secondary"
            size="md"
            disabled={model.status !== "connected"}
            onResult={(r) => {
              setSyncErr(null);
              setSyncMsg(null);
              if (!r.ok) setSyncErr(r.error);
              else setSyncMsg(`Synced · total ${r.anomalies?.totalCount ?? 0} · services ${r.anomalies?.serviceCount ?? 0}`);
            }}
          />
          <Link href="/app/connect-aws">
            <Button variant="primary" size="md">
              Connect AWS
            </Button>
          </Link>
        </div>
      </div>

      {syncErr ? (
        <div className="rounded-2xl border border-danger/20 bg-danger/10 px-4 py-3 text-sm text-danger">{syncErr}</div>
      ) : null}
      {syncMsg ? (
        <div className="rounded-2xl border border-success/20 bg-success/10 px-4 py-3 text-sm text-success">{syncMsg}</div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle>Recent anomalies</CardTitle>
                <CardDescription>
                  Last sync: <span className="text-foreground">{fmtTime(model.lastSyncAt)}</span>
                </CardDescription>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="rounded-2xl border border-white/10 bg-black/20 p-1">
                  <div className="grid grid-cols-3 gap-1">
                    {(
                      [
                        ["all", `All (${counts.all})`],
                        ["total", `Total (${counts.total})`],
                        ["services", `Services (${counts.services})`],
                      ] as const
                    ).map(([k, label]) => {
                      const active = filter === k;
                      return (
                        <button
                          key={k}
                          type="button"
                          onClick={() => setFilter(k)}
                          className={
                            "h-9 rounded-xl px-3 text-sm font-semibold transition " +
                            (active
                              ? "bg-white/10 text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
                              : "text-muted-foreground hover:text-foreground")
                          }
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowResolved((v) => !v)}
                  className="rounded-full border border-white/10 bg-surface/60 px-4 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-surface/50 transition"
                >
                  {showResolved ? "Showing all" : "Showing open"}
                </button>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {model.status !== "connected" ? (
              <div className="rounded-2xl border border-white/10 bg-surface/35 p-4">
                <p className="text-sm font-semibold text-foreground">Connect AWS to detect anomalies</p>
                <p className="mt-1 text-sm text-muted-foreground">Once connected, run a sync and we’ll compute spikes automatically.</p>
              </div>
            ) : rows.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-surface/35 p-4">
                <p className="text-sm font-semibold text-foreground">No anomalies found</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  That’s good. If you just connected, run <span className="text-foreground">Sync now</span>.
                </p>
              </div>
            ) : (
              <div className="max-h-140 space-y-3 overflow-auto pr-1">
                {rows.map((a) => {
                  const key = `${a.service}:${a.date}`;
                  const expanded = openSet.has(key);
                  const sev = badgeForSeverity(a.severity);

                  return (
                    <div key={key} className="rounded-2xl border border-border bg-surface p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-foreground">
                            {fmtShortDate(a.date)} · {a.service === "__TOTAL__" ? "Total" : a.service}
                          </p>
                          <p className="mt-1 text-sm text-muted-foreground">{a.message}</p>
                        </div>

                        <div className="flex flex-col items-end gap-2">
                          <Badge variant={sev.variant}>{sev.text}</Badge>
                          <p className="text-xs font-semibold text-foreground">+{fmtPct(a.pctChange)}</p>
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="rounded-full border border-white/10 bg-surface/40 px-3 py-1">
                            Observed: <span className="text-foreground">{fmtMoney(a.observed, model.currency)}</span>
                          </span>
                          <span className="rounded-full border border-white/10 bg-surface/40 px-3 py-1">
                            Baseline: <span className="text-foreground">{fmtMoney(a.baseline, model.currency)}</span>
                          </span>
                          {a.zScore != null ? (
                            <span className="rounded-full border border-white/10 bg-surface/40 px-3 py-1">
                              z: <span className="text-foreground">{a.zScore.toFixed(2)}</span>
                            </span>
                          ) : null}
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            setOpenSet((prev) => {
                              const next = new Set(prev);
                              if (next.has(key)) next.delete(key);
                              else next.add(key);
                              return next;
                            })
                          }
                          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-surface/60 px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-surface/50 transition"
                        >
                          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          Details
                        </button>
                      </div>

                      {expanded ? (
                        <div className="mt-3 rounded-2xl border border-white/10 bg-surface/35 p-4">
                          <p className="text-xs font-semibold text-foreground">How this was detected</p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            We compare the day’s spend to the previous 7 days’ average for the same series (Total or service).
                            If it jumps above thresholds, we flag it.
                          </p>
                          <div className="mt-3 grid gap-2 sm:grid-cols-3">
                            <div className="rounded-xl border border-white/10 bg-surface/40 p-3">
                              <p className="text-xs text-muted-foreground">Status</p>
                              <p className="mt-1 text-sm font-semibold text-foreground">{String(a.status)}</p>
                            </div>
                            <div className="rounded-xl border border-white/10 bg-surface/40 p-3">
                              <p className="text-xs text-muted-foreground">Created</p>
                              <p className="mt-1 text-sm font-semibold text-foreground">{a.createdAt ? fmtTime(a.createdAt) : "—"}</p>
                            </div>
                            <div className="rounded-xl border border-white/10 bg-surface/40 p-3">
                              <p className="text-xs text-muted-foreground">Updated</p>
                              <p className="mt-1 text-sm font-semibold text-foreground">{a.updatedAt ? fmtTime(a.updatedAt) : "—"}</p>
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

        <Card>
          <CardHeader>
            <CardTitle>What’s next</CardTitle>
            <CardDescription>After MVP A is rock-solid</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {["AI suggestions (Gemini, optional)", "Email alerts", "Weekly founder report"].map((t) => (
                <div key={t} className="rounded-2xl border border-white/10 bg-surface/40 p-4">
                  <p className="text-sm font-semibold text-foreground">{t}</p>
                  <p className="mt-1 text-sm text-muted-foreground">We’ll keep it pluggable and non-crashy on quota limits.</p>
                </div>
              ))}
            </div>

            <div className="mt-4 flex items-start gap-2 text-xs text-muted-foreground">
              <AlertTriangle className="mt-0.5 h-4 w-4" />
              Service anomalies are computed only for the top services by spend to keep results high-signal.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
