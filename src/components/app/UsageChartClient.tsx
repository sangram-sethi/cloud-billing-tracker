"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { SyncNowButton } from "@/components/app/SyncNowButton";
import { AlertTriangle, LineChart } from "lucide-react";

type Point = { date: string; amount: number };
type TopService = { service: string; amount: number };

export type UsageViewModel = {
  status: "not_connected" | "connected" | "failed";
  currency: string;
  points: Point[]; // ordered
  total: number;
  lastDay: number | null;
  lastSyncAt: string | null;
  topServices: TopService[];
};

function fmtMoney(amount: number, currency: string) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 2 }).format(
    Number.isFinite(amount) ? amount : 0
  );
}

function fmtShortDate(ymd: string) {
  const d = new Date(ymd + "T00:00:00Z");
  if (Number.isNaN(d.getTime())) return ymd;
  return d.toLocaleDateString(undefined, { month: "short", day: "2-digit" });
}

function buildPath(points: { x: number; y: number }[]) {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const cur = points[i];
    const mx = (prev.x + cur.x) / 2;
    const my = (prev.y + cur.y) / 2;
    d += ` Q ${prev.x} ${prev.y} ${mx} ${my}`;
  }
  const last = points[points.length - 1];
  d += ` T ${last.x} ${last.y}`;
  return d;
}

function statusBadge(status: UsageViewModel["status"]) {
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

export function UsageChartClient({ model }: { model: UsageViewModel }) {
  const [syncMsg, setSyncMsg] = useState<string | null>(null);
  const [syncErr, setSyncErr] = useState<string | null>(null);

  const badge = statusBadge(model.status);

  const chart = useMemo(() => {
    const W = 720;
    const H = 220;
    const PAD = 18;

    const pts = model.points;
    const max = Math.max(1, ...pts.map((p) => p.amount));
    const min = Math.min(0, ...pts.map((p) => p.amount));
    const span = Math.max(1e-6, max - min);

    const coords = pts.map((p, i) => {
      const x = PAD + (i * (W - PAD * 2)) / Math.max(1, pts.length - 1);
      const y = PAD + ((max - p.amount) * (H - PAD * 2)) / span;
      return { x, y, raw: p };
    });

    const line = buildPath(coords.map((c) => ({ x: c.x, y: c.y })));
    const area = line ? `${line} L ${coords[coords.length - 1].x} ${H - PAD} L ${coords[0].x} ${H - PAD} Z` : "";
    const last = coords.at(-1) || null;

    return { W, H, PAD, coords, line, area, last };
  }, [model.points]);

  const empty = model.points.length === 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Usage</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Daily spend for the last 30 days (Total). Premium, simple, explainable.
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
              else
                setSyncMsg(
                  `Synced ${r.stored.days} days · ${r.stored.services} services · ${(r.anomalies?.count ?? 0)} anomalies`
                );
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
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <LineChart className="h-4 w-4 text-muted-foreground" />
                  Total daily spend
                </CardTitle>
                <CardDescription>
                  Last sync: <span className="text-foreground">{fmtTime(model.lastSyncAt)}</span>
                </CardDescription>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Last 30 days</p>
                <p className="mt-1 text-lg font-semibold text-foreground">{fmtMoney(model.total, model.currency)}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Yesterday:{" "}
                  <span className="text-foreground">
                    {model.lastDay == null ? "—" : fmtMoney(model.lastDay, model.currency)}
                  </span>
                </p>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {model.status !== "connected" ? (
              <div className="rounded-2xl border border-white/10 bg-surface/35 p-4">
                <p className="text-sm font-semibold text-foreground">Connect AWS to start pulling costs</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Once connected, hit <span className="text-foreground">Sync now</span> to pull the last 30 days.
                </p>
              </div>
            ) : empty ? (
              <div className="rounded-2xl border border-white/10 bg-surface/35 p-4">
                <p className="text-sm font-semibold text-foreground">No data yet</p>
                <p className="mt-1 text-sm text-muted-foreground">Run a sync to populate your usage timeline.</p>
              </div>
            ) : (
              <div className="rounded-3xl border border-white/10 bg-surface/35 p-4">
                <svg viewBox={`0 0 ${chart.W} ${chart.H}`} className="h-56 w-full text-foreground">
                  <defs>
                    <linearGradient id="cbgFill" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="currentColor" stopOpacity="0.18" />
                      <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
                    </linearGradient>
                  </defs>

                  <path d={chart.area} fill="url(#cbgFill)" />
                  <path d={chart.line} fill="none" stroke="currentColor" strokeWidth="2" opacity="0.9" />

                  {chart.last ? (
                    <>
                      <circle cx={chart.last.x} cy={chart.last.y} r="4" fill="currentColor" />
                      <circle cx={chart.last.x} cy={chart.last.y} r="9" fill="currentColor" opacity="0.10" />
                    </>
                  ) : null}
                </svg>

                <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                  <span>{fmtShortDate(model.points[0].date)}</span>
                  <span>{fmtShortDate(model.points.at(-1)!.date)}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle>Top services (30d)</CardTitle>
                <CardDescription>By spend sum</CardDescription>
              </div>
              <Link href="/app/anomalies" className="text-xs font-semibold text-muted-foreground hover:text-foreground transition">
                View anomalies →
              </Link>
            </div>
          </CardHeader>

          <CardContent>
            {model.status !== "connected" ? (
              <div className="rounded-2xl border border-white/10 bg-surface/35 p-4">
                <p className="text-sm font-semibold text-foreground">Waiting for AWS</p>
                <p className="mt-1 text-sm text-muted-foreground">Connect + sync to see your service breakdown.</p>
              </div>
            ) : model.topServices.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-surface/35 p-4">
                <p className="text-sm font-semibold text-foreground">No service rows yet</p>
                <p className="mt-1 text-sm text-muted-foreground">Run a sync to populate spend per service.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {model.topServices.map((s) => (
                  <div key={s.service} className="rounded-2xl border border-white/10 bg-surface/40 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-semibold text-foreground">{s.service}</p>
                      <p className="text-sm font-semibold text-foreground">{fmtMoney(s.amount, model.currency)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {model.status === "connected" && model.topServices.length === 0 ? (
              <div className="mt-4 flex items-start gap-2 text-xs text-muted-foreground">
                <AlertTriangle className="mt-0.5 h-4 w-4" />
                Some AWS accounts only return totals until costs are allocated; try again after 24h.
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
