"use client";

import * as React from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/cn";

type SettingsState = {
  emailAlertsEnabled: boolean;
  whatsappAlertsEnabled: boolean;
  whatsappNumber: string | null;
  whatsappVerifiedAt: string | null;
  aiInsightsEnabled: boolean;
};

type ApiOk = { ok: true; settings: SettingsState };
type ApiErr = { ok: false; error: string };

type WhatsAppStartOk =
  | { ok: true; status: "sent" }
  | { ok: true; status: "disabled" | "quota" | "unavailable"; message?: string }
  | { ok: true; status: "error"; message?: string };

type WhatsAppConfirmOk = { ok: true; status: "verified" };

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function getErrorMessage(e: unknown, fallback: string) {
  if (e instanceof Error && typeof e.message === "string" && e.message.trim()) return e.message;
  if (isRecord(e) && typeof e.message === "string" && e.message.trim()) return e.message;
  return fallback;
}

function toneForEnabled(enabled: boolean) {
  return enabled ? "primary" : "neutral";
}

function SwitchRow(props: {
  title: string;
  description?: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  tone?: "neutral" | "primary" | "success" | "warning" | "danger";
  disabled?: boolean;
}) {
  const { title, description, checked, onChange, tone = "neutral", disabled } = props;

  const track = (() => {
    if (!checked) return "border-border/70 bg-surface/45";
    if (tone === "primary") return "border-primary/25 bg-primary/12";
    if (tone === "success") return "border-success/25 bg-success/10";
    if (tone === "warning") return "border-warning/25 bg-warning/10";
    if (tone === "danger") return "border-danger/25 bg-danger/10";
    return "border-border/70 bg-surface/45";
  })();

  const knob = (() => {
    if (!checked) return "bg-white/35";
    if (tone === "primary") return "bg-primary shadow-[0_0_18px_rgba(124,58,237,0.20)]";
    if (tone === "success") return "bg-success shadow-[0_0_18px_rgba(16,185,129,0.18)]";
    if (tone === "warning") return "bg-warning shadow-[0_0_18px_rgba(245,158,11,0.18)]";
    if (tone === "danger") return "bg-danger shadow-[0_0_18px_rgba(244,63,94,0.18)]";
    return "bg-white/45";
  })();

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "w-full rounded-2xl border border-border/70 bg-surface/55 p-4 text-left backdrop-blur",
        "transition-[transform,background-color,border-color] duration-200 ease-(--ease-snappy) active:scale-[0.995]",
        "hover:bg-surface/65",
        disabled && "cursor-not-allowed opacity-60"
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-foreground">{title}</div>
          {description ? <div className="mt-1 text-xs text-muted-foreground">{description}</div> : null}
        </div>

        <div
          role="switch"
          aria-checked={checked}
          className={cn(
            "relative h-7 w-12 rounded-full border backdrop-blur",
            "transition-[background-color,border-color] duration-200 ease-(--ease-snappy)",
            track
          )}
        >
          <div
            className={cn(
              "absolute left-1 top-1/2 h-5 w-5 -translate-y-1/2 rounded-full",
              "transition-[transform,background-color,box-shadow] duration-200 ease-(--ease-snappy)",
              checked ? "translate-x-5" : "translate-x-0",
              knob
            )}
          />
        </div>
      </div>
    </button>
  );
}

function statusBadge(settings: SettingsState | null) {
  if (!settings) return <Badge variant="neutral">Loading</Badge>;
  if (settings.whatsappVerifiedAt) return <Badge variant="success">WhatsApp verified</Badge>;
  if (settings.whatsappNumber) return <Badge variant="warning">Pending verification</Badge>;
  return <Badge variant="neutral">Not connected</Badge>;
}

export function NotificationSettingsCard() {
  const [settings, setSettings] = React.useState<SettingsState | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  const [phone, setPhone] = React.useState("+");
  const [code, setCode] = React.useState("");
  const [waState, setWaState] = React.useState<
    | { kind: "idle" }
    | { kind: "sending" }
    | { kind: "sent" }
    | { kind: "verifying" }
    | { kind: "done" }
    | { kind: "soft"; message: string }
    | { kind: "error"; message: string }
  >({ kind: "idle" });

  async function refresh() {
    setLoading(true);
    try {
      const res = await fetch("/api/settings/notifications", { cache: "no-store" });
      const json = (await res.json().catch(() => null)) as ApiOk | ApiErr | null;
      if (json && "ok" in json && json.ok) {
        setSettings(json.settings);
        setPhone(json.settings.whatsappNumber ?? "+");
      }
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    void refresh();
  }, []);

  async function patch(next: Partial<SettingsState>) {
    setSaving(true);
    try {
      const res = await fetch("/api/settings/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      });
      const json = (await res.json().catch(() => null)) as ApiOk | ApiErr | null;
      if (json && "ok" in json && json.ok) setSettings(json.settings);
    } finally {
      setSaving(false);
    }
  }

  async function startWhatsApp() {
    setWaState({ kind: "sending" });
    try {
      const res = await fetch("/api/whatsapp/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });

      const json = (await res.json().catch(() => null)) as WhatsAppStartOk | ApiErr | null;

      if (json && "ok" in json && json.ok) {
        if (json.status === "sent") {
          setWaState({ kind: "sent" });
          await refresh();
          return;
        }

        const msg =
          ("message" in json && typeof json.message === "string" && json.message.trim())
            ? json.message
            : "WhatsApp is unavailable right now.";

        if (json.status === "error") setWaState({ kind: "error", message: msg });
        else setWaState({ kind: "soft", message: msg });
        return;
      }

      setWaState({ kind: "error", message: "Could not start verification." });
    } catch (e: unknown) {
      setWaState({
        kind: "error",
        message: getErrorMessage(e, "Could not start verification."),
      });
    }
  }

  async function confirmWhatsApp() {
    setWaState({ kind: "verifying" });
    try {
      const res = await fetch("/api/whatsapp/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code }),
      });

      const json = (await res.json().catch(() => null)) as WhatsAppConfirmOk | ApiErr | null;

      if (json && "ok" in json && json.ok && json.status === "verified") {
        setWaState({ kind: "done" });
        setCode("");
        await refresh();
        return;
      }

      const msg =
        json && "error" in json && typeof json.error === "string" ? json.error : "Verification failed.";
      setWaState({ kind: "error", message: msg });
    } catch (e: unknown) {
      setWaState({
        kind: "error",
        message: getErrorMessage(e, "Verification failed."),
      });
    }
  }

  const waVerified = !!settings?.whatsappVerifiedAt;
  const canEnableWhatsApp = waVerified;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>
              Control email + WhatsApp alerts. WhatsApp requires verification (E.164, like +91…)
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {statusBadge(settings)}
            {saving ? <Badge variant="neutral">Saving</Badge> : null}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="grid gap-3">
          <SwitchRow
            title="Email alerts"
            description="Get anomaly alerts and weekly founder reports by email."
            checked={!!settings?.emailAlertsEnabled}
            onChange={(v) => settings && void patch({ emailAlertsEnabled: v })}
            tone={toneForEnabled(!!settings?.emailAlertsEnabled)}
            disabled={loading || saving || !settings}
          />

          <SwitchRow
            title="AI anomaly insights"
            description="Generate a short explanation + next action for each anomaly (Gemini)."
            checked={!!settings?.aiInsightsEnabled}
            onChange={(v) => settings && void patch({ aiInsightsEnabled: v })}
            tone={toneForEnabled(!!settings?.aiInsightsEnabled)}
            disabled={loading || saving || !settings}
          />

          <SwitchRow
            title="WhatsApp alerts"
            description={
              waVerified
                ? "Send warning/critical anomalies to WhatsApp."
                : "Verify a phone number first — then you can enable WhatsApp alerts."
            }
            checked={!!settings?.whatsappAlertsEnabled}
            onChange={(v) => settings && void patch({ whatsappAlertsEnabled: v })}
            tone={waVerified ? toneForEnabled(!!settings?.whatsappAlertsEnabled) : "neutral"}
            disabled={loading || saving || !settings || !canEnableWhatsApp}
          />
        </div>

        <div className="mt-5 rounded-2xl border border-border/70 bg-surface/55 p-4 backdrop-blur">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-foreground">WhatsApp verification</p>
              <p className="mt-1 text-xs text-muted-foreground">
                We send a one-time code. If provider quota is hit, the app won’t crash — it’ll just show “unavailable”.
              </p>
            </div>
            {waVerified ? <Badge variant="success">Verified</Badge> : <Badge variant="neutral">Required</Badge>}
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto]">
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+919876543210"
              disabled={loading}
            />
            <Button
              type="button"
              variant="secondary"
              onClick={() => void startWhatsApp()}
              disabled={loading || waState.kind === "sending"}
            >
              {waState.kind === "sending" ? "Sending…" : "Send code"}
            </Button>
          </div>

          <div className="mt-3 grid gap-3 md:grid-cols-[1fr_auto]">
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="6-digit code"
              inputMode="numeric"
              disabled={loading || waVerified}
            />
            <Button
              type="button"
              variant="primary"
              onClick={() => void confirmWhatsApp()}
              disabled={loading || waVerified || code.trim().length !== 6 || waState.kind === "verifying"}
            >
              {waState.kind === "verifying" ? "Verifying…" : "Verify"}
            </Button>
          </div>

          {waState.kind === "sent" ? (
            <p className="mt-3 text-xs text-muted-foreground">Code sent. Check WhatsApp and paste it above.</p>
          ) : null}
          {waState.kind === "done" ? (
            <p className="mt-3 text-xs text-success">Verified. You can enable WhatsApp alerts now.</p>
          ) : null}
          {waState.kind === "soft" ? <p className="mt-3 text-xs text-muted-foreground">{waState.message}</p> : null}
          {waState.kind === "error" ? <p className="mt-3 text-xs text-danger">{waState.message}</p> : null}
        </div>
      </CardContent>
    </Card>
  );
}
