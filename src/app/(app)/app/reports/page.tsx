"use client";

import * as React from "react";
import Link from "next/link";
import { FileText, RefreshCw, Mail, TrendingUp, AlertTriangle } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/cn";

type EmailStatus = "sent" | "quota" | "unavailable" | "error" | "not_sent";

type TopService = {
  service: string;
  amount: number;
};

type AnomalySummary = {
  severity: string;
  service: string;
  date: string;
  message: string;
};

type WeeklyReportAnomalies = {
  totalCount: number;
  criticalCount: number;
  warningCount: number;
  top: AnomalySummary[];
};

type WeeklyReport = {
  id: string; // normalized from _id
  periodStart: string;
  periodEnd: string;
  currency: string;
  total: number;
  prevTotal: number;
  delta: number;
  deltaPct: number | null;
  emailStatus: EmailStatus;
  topServices: TopService[];
  anomalies: WeeklyReportAnomalies;
};

type ListOk = { ok: true; reports: unknown[] };
type ListErr = { ok: false; error: string };

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function toStr(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}

function toNum(v: unknown, fallback = 0): number {
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}

function toNumOrNull(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

function toId(v: unknown): string {
  if (typeof v === "string") return v;
  if (isRecord(v) && typeof (v as { toString?: unknown }).toString === "function") {
    try {
      return String((v as { toString: () => unknown }).toString());
    } catch {
      return "";
    }
  }
  return "";
}

function parseEmailStatus(v: unknown): EmailStatus {
  const s = String(v ?? "");
  if (s === "sent") return "sent";
  if (s === "quota") return "quota";
  if (s === "unavailable") return "unavailable";
  if (s === "error") return "error";
  return "not_sent";
}

function normalizeTopService(v: unknown): TopService | null {
  if (!isRecord(v)) return null;
  const service = toStr(v.service, "");
  if (!service) return null;
  return { service, amount: toNum(v.amount, 0) };
}

function normalizeAnomalySummary(v: unknown): AnomalySummary | null {
  if (!isRecord(v)) return null;
  return {
    severity: toStr(v.severity, "—"),
    service: toStr(v.service, "—"),
    date: toStr(v.date, "—"),
    message: toStr(v.message, "—"),
  };
}

function normalizeWeeklyReport(v: unknown): WeeklyReport | null {
  if (!isRecord(v)) return null;

  const id = toId(v._id);
  const periodStart = toStr(v.periodStart, "");
  const periodEnd = toStr(v.periodEnd, "");
  const currency = toStr(v.currency, "USD");

  const anomaliesRaw = isRecord(v.anomalies) ? v.anomalies : {};
  const topRaw = Array.isArray((anomaliesRaw as Record<string, unknown>).top)
    ? ((anomaliesRaw as Record<string, unknown>).top as unknown[])
    : [];

  const top = topRaw.map(normalizeAnomalySummary).filter((x): x is AnomalySummary => !!x);

  const topServicesRaw = Array.isArray(v.topServices) ? v.topServices : [];
  const topServices = topServicesRaw.map(normalizeTopService).filter((x): x is TopService => !!x);

  return {
    id: id || "",
    periodStart,
    periodEnd,
    currency,
    total: toNum(v.total, 0),
    prevTotal: toNum(v.prevTotal, 0),
    delta: toNum(v.delta, 0),
    deltaPct: toNumOrNull(v.deltaPct),
    emailStatus: parseEmailStatus(v.emailStatus),
    topServices,
    anomalies: {
      totalCount: toNum((anomaliesRaw as Record<string, unknown>).totalCount, 0),
      criticalCount: toNum((anomaliesRaw as Record<string, unknown>).criticalCount, 0),
      warningCount: toNum((anomaliesRaw as Record<string, unknown>).warningCount, 0),
      top,
    },
  };
}

function getErrorMessage(e: unknown): string {
  if (e instanceof Error && typeof e.message === "string") return e.message;
  if (typeof e === "string") return e;
  return "Something went wrong";
}

function fmtMoney(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: amount < 10 ? 2 : 0,
    }).format(amount);
  } catch {
    return `${currency} ${Number(amount ?? 0).toFixed(2)}`;
  }
}

function fmtPct(p: number | null | undefined) {
  if (p === null || p === undefined || !Number.isFinite(p)) return "—";
  const v = p * 100;
  const sign = v >= 0 ? "+" : "";
  return `${sign}${v.toFixed(Math.abs(v) < 10 ? 1 : 0)}%`;
}

function badgeForEmailStatus(s: unknown) {
  const v = parseEmailStatus(s);
  if (v === "sent") return <Badge variant="success">Email sent</Badge>;
  if (v === "quota") return <Badge variant="warning">Email quota</Badge>;
  if (v === "unavailable") return <Badge variant="neutral">Email unavailable</Badge>;
  if (v === "error") return <Badge variant="danger">Email error</Badge>;
  return <Badge variant="neutral">Not sent</Badge>;
}

type SimpleOk = { ok: true };
type SimpleErr = { ok: false; error?: string };

function isSimpleResp(v: unknown): v is SimpleOk | SimpleErr {
  return isRecord(v) && typeof v.ok === "boolean";
}

export default function ReportsPage() {
  const [reports, setReports] = React.useState<WeeklyReport[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [openId, setOpenId] = React.useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/reports/weekly?limit=10", { cache: "no-store" });
      const jsonUnknown: unknown = await res.json().catch(() => null);

      if (!isRecord(jsonUnknown) || typeof jsonUnknown.ok !== "boolean") {
        setError("Failed to load reports.");
        setReports([]);
        return;
      }

      if (jsonUnknown.ok === false) {
        const err = toStr((jsonUnknown as ListErr).error, "Failed to load reports.");
        setError(err);
        setReports([]);
        return;
      }

      const list = jsonUnknown as ListOk;
      const raw = Array.isArray(list.reports) ? list.reports : [];
      const normalized = raw.map(normalizeWeeklyReport).filter((x): x is WeeklyReport => !!x && !!x.id);

      setReports(normalized);
    } catch (e: unknown) {
      setError(getErrorMessage(e) || "Failed to load reports.");
      setReports([]);
    } finally {
      setLoading(false);
    }
  }

  async function generateNow() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/reports/weekly", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ days: 7 }),
      });

      const jsonUnknown: unknown = await res.json().catch(() => null);

      if (!isSimpleResp(jsonUnknown) || jsonUnknown.ok !== true) {
        const err = isRecord(jsonUnknown) ? toStr(jsonUnknown.error, "Failed to generate report.") : "Failed to generate report.";
        setError(err);
      }

      await load();
    } catch (e: unknown) {
      setError(getErrorMessage(e) || "Failed to generate report.");
    } finally {
      setBusy(false);
    }
  }

  async function sendEmail(reportId: string) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/reports/weekly/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId }),
      });

      const jsonUnknown: unknown = await res.json().catch(() => null);

      if (!isSimpleResp(jsonUnknown) || jsonUnknown.ok !== true) {
        const err = isRecord(jsonUnknown) ? toStr(jsonUnknown.error, "Failed to send email.") : "Failed to send email.";
        setError(err);
      }

      await load();
    } catch (e: unknown) {
      setError(getErrorMessage(e) || "Failed to send email.");
    } finally {
      setBusy(false);
    }
  }

  React.useEffect(() => {
    void load();
  }, []);

  const latest = reports?.[0];
  const latestCurrency = String(latest?.currency ?? "USD");

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Reports</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Weekly founder report generated from your cost series + anomaly engine.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link href="/app/usage" className="inline-flex">
            <Button variant="secondary">
              <TrendingUp className="h-4 w-4" />
              Usage
            </Button>
          </Link>

          <Link href="/app/anomalies" className="inline-flex">
            <Button variant="secondary">
              <AlertTriangle className="h-4 w-4" />
              Anomalies
            </Button>
          </Link>

          <Button variant="primary" onClick={() => void generateNow()} disabled={busy}>
            <FileText className="h-4 w-4" />
            {busy ? "Working…" : "Generate now"}
          </Button>

          <Button variant="secondary" onClick={() => void load()} disabled={busy}>
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-danger/25 bg-danger/10 px-4 py-3 text-sm text-danger">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle>Latest snapshot</CardTitle>
                <CardDescription>Quick read of the newest weekly report.</CardDescription>
              </div>
              {loading ? (
                <Badge variant="neutral">Loading</Badge>
              ) : (
                <Badge variant="neutral">{reports.length} total</Badge>
              )}
            </div>
          </CardHeader>

          <CardContent>
            {!latest ? (
              <div className="rounded-2xl border border-border/70 bg-surface/55 p-4">
                <p className="text-sm font-semibold text-foreground">No reports yet</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Click <span className="font-semibold text-foreground">Generate now</span> to create your first one.
                </p>
              </div>
            ) : (
              <div className="rounded-2xl border border-border/70 bg-surface/55 p-4">
                <p className="text-xs font-semibold text-muted-foreground">Period</p>
                <p className="mt-1 text-sm font-semibold text-foreground">
                  {latest.periodStart} → {latest.periodEnd}
                </p>

                <div className="mt-4 grid gap-2 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Total</span>
                    <span className="font-semibold text-foreground">
                      {fmtMoney(Number(latest.total ?? 0), latestCurrency)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">WoW</span>
                    <span
                      className={cn(
                        "font-semibold",
                        Number(latest.delta ?? 0) >= 0 ? "text-warning" : "text-success"
                      )}
                    >
                      {fmtPct(latest.deltaPct)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Anomalies</span>
                    <span className="font-semibold text-foreground">
                      {Number(latest?.anomalies?.totalCount ?? 0)}
                    </span>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between gap-2">
                  {badgeForEmailStatus(latest.emailStatus)}
                  <Button variant="secondary" size="sm" onClick={() => void sendEmail(latest.id)} disabled={busy}>
                    <Mail className="h-4 w-4" />
                    Send
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle>Weekly founder reports</CardTitle>
                <CardDescription>Click a report to expand details. Scroll stays inside the card.</CardDescription>
              </div>
              {loading ? <Badge variant="neutral">Loading</Badge> : <Badge variant="neutral">Last 10</Badge>}
            </div>
          </CardHeader>

          <CardContent>
            {!reports.length ? (
              <div className="rounded-2xl border border-border/70 bg-surface/55 p-5">
                <p className="text-sm font-semibold text-foreground">Nothing here yet</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Generate a report and it will appear here (and email will be best-effort).
                </p>
              </div>
            ) : (
              <div className="max-h-140 space-y-3 overflow-auto pr-1">
                {reports.map((r) => {
                  const id = r.id;
                  const isOpen = openId === id;
                  const currency = String(r.currency ?? "USD");
                  const wow = r.deltaPct ?? null;

                  return (
                    <div key={id} className="rounded-2xl border border-border/70 bg-surface/55 backdrop-blur">
                      <button
                        type="button"
                        onClick={() => setOpenId(isOpen ? null : id)}
                        className="w-full rounded-2xl px-4 py-4 text-left transition-colors hover:bg-surface/65"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-foreground">
                              {r.periodStart} → {r.periodEnd}
                            </p>
                            <p className="mt-1 text-sm text-muted-foreground">
                              Total {fmtMoney(Number(r.total ?? 0), currency)} · WoW {fmtPct(wow)} · Anomalies{" "}
                              {Number(r?.anomalies?.totalCount ?? 0)}
                            </p>

                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              {badgeForEmailStatus(r.emailStatus)}
                              <Badge variant="neutral">prev {fmtMoney(Number(r.prevTotal ?? 0), currency)}</Badge>
                            </div>
                          </div>

                          <div className="shrink-0 text-right">
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                void sendEmail(id);
                              }}
                              disabled={busy}
                            >
                              <Mail className="h-4 w-4" />
                              Send
                            </Button>
                          </div>
                        </div>
                      </button>

                      {isOpen ? (
                        <div className="border-t border-white/10 px-4 py-4">
                          <div className="grid gap-3 md:grid-cols-2">
                            <div className="rounded-2xl border border-white/10 bg-background/20 p-3">
                              <p className="text-xs font-semibold text-muted-foreground">Top services</p>
                              <div className="mt-2 space-y-2">
                                {(r.topServices ?? []).slice(0, 8).map((s) => (
                                  <div key={s.service} className="flex items-center justify-between gap-3">
                                    <span className="truncate text-sm font-semibold text-foreground">{s.service}</span>
                                    <span className="text-sm font-semibold text-foreground">
                                      {fmtMoney(Number(s.amount ?? 0), currency)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div className="rounded-2xl border border-white/10 bg-background/20 p-3">
                              <p className="text-xs font-semibold text-muted-foreground">Anomalies</p>
                              <div className="mt-2 space-y-2">
                                <div className="flex items-center gap-2">
                                  <Badge variant="danger">critical {Number(r?.anomalies?.criticalCount ?? 0)}</Badge>
                                  <Badge variant="warning">warning {Number(r?.anomalies?.warningCount ?? 0)}</Badge>
                                  <Badge variant="neutral">total {Number(r?.anomalies?.totalCount ?? 0)}</Badge>
                                </div>

                                {(r?.anomalies?.top ?? []).slice(0, 3).map((a, idx) => (
                                  <div key={`${a.service}-${a.date}-${idx}`} className="rounded-xl border border-border/70 bg-surface/55 p-3">
                                    <p className="text-xs font-semibold text-muted-foreground">
                                      [{a.severity}] {a.service} · {a.date}
                                    </p>
                                    <p className="mt-1 text-sm text-foreground/90">{a.message}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>

                          <div className="mt-3 text-xs text-muted-foreground">
                            Tip: reports become more meaningful after 2+ weeks of data.
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
    </div>
  );
}
