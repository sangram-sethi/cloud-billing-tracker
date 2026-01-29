"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Badge } from "@/components/ui/Badge";
import { SyncNowButton } from "@/components/app/SyncNowButton";
import { Eye, EyeOff, ShieldCheck, KeyRound, AlertTriangle } from "lucide-react";

type ConnectionSummary = {
  status: "not_connected" | "connected" | "failed";
  accessKeySuffix: string | null;
  region: string | null;
  lastValidatedAt: string | null;
  lastSyncAt: string | null;
  lastError: string | null;
};

type ConnectOk = {
  ok: true;
  connection: {
    status: "connected";
    accessKeySuffix: string;
    region: string | null;
    lastValidatedAt: string;
    lastSyncAt: string | null;
  };
};

type ConnectErr = { ok: false; error: string; code?: string };

type ConnectResult = ConnectOk | ConnectErr;

function badgeForStatus(s: ConnectionSummary["status"]) {
  if (s === "connected") return { variant: "success" as const, text: "Connected" };
  if (s === "failed") return { variant: "danger" as const, text: "Needs attention" };
  return { variant: "neutral" as const, text: "Not connected" };
}

function fmtTime(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function maskAccessKey(accessKeySuffix: string | null) {
  if (!accessKeySuffix) return "—";
  return `••••••••••••${accessKeySuffix}`;
}

export function ConnectAwsClient({ initial }: { initial: ConnectionSummary }) {
  const router = useRouter();

  const [accessKeyId, setAccessKeyId] = useState("");
  const [secretAccessKey, setSecretAccessKey] = useState("");
  const [showSecret, setShowSecret] = useState(false);
  const [region, setRegion] = useState(initial.region || "ap-south-1");

  const [connecting, setConnecting] = useState(false);
  const [connectMsg, setConnectMsg] = useState<string | null>(null);
  const [connectErr, setConnectErr] = useState<string | null>(null);

  const [syncMsg, setSyncMsg] = useState<string | null>(null);
  const [syncErr, setSyncErr] = useState<string | null>(null);

  const accessOk = useMemo(() => accessKeyId.trim().length >= 16 && !/\s/.test(accessKeyId), [accessKeyId]);
  const secretOk = useMemo(() => secretAccessKey.trim().length >= 20 && !/\s/.test(secretAccessKey), [secretAccessKey]);

  const canConnect = accessOk && secretOk && !connecting;

  const statusBadge = badgeForStatus(initial.status);

  async function onConnect(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setConnectErr(null);
    setConnectMsg(null);
    setSyncErr(null);
    setSyncMsg(null);

    setConnecting(true);
    try {
      const res = await fetch("/api/aws/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accessKeyId: accessKeyId.trim(),
          secretAccessKey: secretAccessKey.trim(),
          region: region || undefined,
        }),
      });

      const json = (await res.json().catch(() => null)) as ConnectResult | null;
      const payload: ConnectResult =
        json && typeof json === "object" ? json : { ok: false, error: "Unexpected response" };

      if (!res.ok || !payload.ok) {
        setConnectErr((payload as ConnectErr).error || "Failed to connect AWS.");
        return;
      }

      setConnectMsg("Connected. You can sync costs now.");
      setAccessKeyId("");
      setSecretAccessKey("");

      router.refresh();
    } catch {
      setConnectErr("Network error. Please try again.");
    } finally {
      setConnecting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Connect AWS</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Add read-only Cost Explorer credentials and start pulling daily spend.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={statusBadge.variant}>{statusBadge.text}</Badge>
          <SyncNowButton
            variant="secondary"
            size="md"
            disabled={initial.status !== "connected"}
            onResult={(r) => {
              setSyncErr(null);
              setSyncMsg(null);
              if (!r.ok) setSyncErr(r.error);
              else setSyncMsg(`Synced ${r.stored.days} days · ${r.stored.services} services · ${(r.anomalies?.count ?? 0)} anomalies`);
            }}
          />
          <Link href="/app/usage">
            <Button variant="primary" size="md">
              View usage
            </Button>
          </Link>
        </div>
      </div>

      {connectErr ? (
        <div className="rounded-2xl border border-danger/20 bg-danger/10 px-4 py-3 text-sm text-danger">
          {connectErr}
        </div>
      ) : null}
      {connectMsg ? (
        <div className="rounded-2xl border border-success/20 bg-success/10 px-4 py-3 text-sm text-success">
          {connectMsg}
        </div>
      ) : null}

      {syncErr ? (
        <div className="rounded-2xl border border-danger/20 bg-danger/10 px-4 py-3 text-sm text-danger">{syncErr}</div>
      ) : null}
      {syncMsg ? (
        <div className="rounded-2xl border border-success/20 bg-success/10 px-4 py-3 text-sm text-success">{syncMsg}</div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-muted-foreground" />
              Credentials
            </CardTitle>
            <CardDescription>Access Key ID + Secret Access Key (read-only recommended)</CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={onConnect} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="accessKeyId">Access Key ID</Label>
                  <Input
                    id="accessKeyId"
                    placeholder="AKIA…"
                    value={accessKeyId}
                    onChange={(e) => setAccessKeyId(e.target.value)}
                    state={accessKeyId.length === 0 ? "default" : accessOk ? "success" : "error"}
                    autoComplete="off"
                    spellCheck={false}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="region">Preferred region (optional)</Label>
                  <Input
                    id="region"
                    placeholder="ap-south-1"
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    autoComplete="off"
                    spellCheck={false}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="secretAccessKey">Secret Access Key</Label>
                <div className="relative">
                  <Input
                    id="secretAccessKey"
                    type={showSecret ? "text" : "password"}
                    placeholder="••••••••••••••••••••"
                    value={secretAccessKey}
                    onChange={(e) => setSecretAccessKey(e.target.value)}
                    state={secretAccessKey.length === 0 ? "default" : secretOk ? "success" : "error"}
                    className="pr-12"
                    autoComplete="off"
                    spellCheck={false}
                  />
                  <button
                    type="button"
                    onClick={() => setShowSecret((v) => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full border border-white/10 bg-surface/60 p-2 text-muted-foreground hover:text-foreground hover:bg-surface/50 transition"
                    aria-label={showSecret ? "Hide secret" : "Show secret"}
                  >
                    {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-surface/35 p-4">
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-foreground">Connection status</p>
                  <p className="text-sm text-muted-foreground">
                    Key: <span className="text-foreground">{maskAccessKey(initial.accessKeySuffix)}</span> · Last validated:{" "}
                    <span className="text-foreground">{fmtTime(initial.lastValidatedAt)}</span>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Last sync: <span className="text-foreground">{fmtTime(initial.lastSyncAt)}</span>
                  </p>
                  {initial.lastError ? (
                    <p className="mt-2 text-sm text-danger">
                      <span className="inline-flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        {initial.lastError}
                      </span>
                    </p>
                  ) : null}
                </div>

                <Button type="submit" variant="primary" size="lg" disabled={!canConnect}>
                  {connecting ? "Connecting…" : initial.status === "connected" ? "Update connection" : "Connect"}
                </Button>
              </div>

              <p className="text-xs text-muted-foreground">
                We store secrets encrypted server-side. For best security, create an IAM user with read-only Cost Explorer access.
              </p>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-muted-foreground" />
              Recommended IAM policy
            </CardTitle>
            <CardDescription>Minimum to read daily cost usage</CardDescription>
          </CardHeader>

          <CardContent>
            <div className="rounded-2xl border border-white/10 bg-surface/35 p-4">
              <pre className="whitespace-pre-wrap text-xs text-muted-foreground">
{`{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "ReadCostExplorer",
      "Effect": "Allow",
      "Action": [
        "ce:GetCostAndUsage",
        "ce:GetCostForecast"
      ],
      "Resource": "*"
    }
  ]
}`}
              </pre>
            </div>

            <div className="mt-4 space-y-3">
              {[
                { title: "1) Add credentials", desc: "Use an IAM user with read-only Cost Explorer." },
                { title: "2) Sync now", desc: "Pull last 30 days into Mongo." },
                { title: "3) View usage + anomalies", desc: "Premium timeline + scrollable detections." },
              ].map((x) => (
                <div key={x.title} className="rounded-2xl border border-white/10 bg-surface/40 p-4">
                  <p className="text-sm font-semibold text-foreground">{x.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{x.desc}</p>
                </div>
              ))}
            </div>

            <Link
              href="/security"
              className="mt-4 inline-block text-sm font-semibold text-muted-foreground hover:text-foreground transition"
            >
              Security page →
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
