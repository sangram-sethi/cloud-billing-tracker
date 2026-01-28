import * as React from "react";
import { cn } from "@/lib/cn";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  KeyRound,
  ShieldCheck,
  Mail,
  MessageCircle,
  Sparkles,
  Link2,
  CheckCircle2,
  XCircle,
  Send,
  Zap,
  Database,
} from "lucide-react";

type AiMode = "off" | "smart" | "aggressive";
type Digest = "instant" | "hourly" | "daily";
type Retention = "7d" | "30d" | "90d";

function PillOption({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "h-8 rounded-full border px-3 text-xs font-semibold transition-[background-color,border-color,color] duration-200 ease-(--ease-snappy)",
        active
          ? "border-primary/25 bg-primary/12 text-foreground"
          : "border-white/10 bg-white/4 text-muted-foreground hover:bg-white/6 hover:text-foreground"
      )}
    >
      {children}
    </button>
  );
}

function SettingCard({
  icon,
  title,
  subtitle,
  right,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  right?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div className="w-full overflow-hidden rounded-2xl border border-white/10 bg-white/4 p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl border border-white/10 bg-white/5">
            {icon}
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-foreground">{title}</div>
            <div className="mt-1 text-xs text-muted-foreground">{subtitle}</div>
          </div>
        </div>

        {right ? <div className="shrink-0">{right}</div> : null}
      </div>

      {children ? <div className="mt-3">{children}</div> : null}
    </div>
  );
}

export function SettingsView() {
  const [connected, setConnected] = React.useState(true);
  const [roleArn, setRoleArn] = React.useState(
    "arn:aws:iam::123456789012:role/CloudBudgetGuardReadOnly"
  );

  // Email channel
  const [emailEnabled, setEmailEnabled] = React.useState(true);
  const [emailVerified, setEmailVerified] = React.useState(true);
  const [emailTo, setEmailTo] = React.useState("founder@acme.ai");

  // WhatsApp channel
  const [waEnabled, setWaEnabled] = React.useState(true);
  const [waConnected, setWaConnected] = React.useState(true);
  const [waTo, setWaTo] = React.useState("+1 (555) 013-2048");

  // AI mode + cadence (moved to left side for balance)
  const [aiMode, setAiMode] = React.useState<AiMode>("smart");
  const [digest, setDigest] = React.useState<Digest>("instant");

  // retention (small but meaningful left-side filler)
  const [retention, setRetention] = React.useState<Retention>("30d");

  // Sensitivity slider (keep existing)
  const [sensitivity, setSensitivity] = React.useState(62);

  return (
    <div className="grid min-h-min grid-rows-[auto_1fr] gap-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-2xl border border-white/10 bg-white/5">
            <ShieldCheck className="h-4 w-4 text-emerald-300" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Settings</div>
            <div className="text-sm font-semibold text-foreground">Connections + channels + safety</div>
          </div>
        </div>

        <Badge variant={connected ? "success" : "neutral"}>
          {connected ? "AWS connected" : "Disconnected"}
        </Badge>
      </div>

      {/* ✅ Balanced columns */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {/* LEFT: Connection + Policy/AI */}
        <div className="space-y-4">
          {/* Connection */}
          <div className="rounded-2xl border border-white/10 bg-surface/30 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs text-muted-foreground">AWS connection</div>
                <div className="mt-1 text-sm font-semibold text-foreground">Read-only billing scope</div>
                <div className="mt-1 text-xs text-muted-foreground">No write permissions. Audit trail enabled.</div>
              </div>

              <Button variant="secondary" size="sm" onClick={() => setConnected((v) => !v)}>
                <Link2 className="h-4 w-4 text-primary" />
                {connected ? "Disconnect" : "Connect"}
              </Button>
            </div>

            <div className="mt-4 rounded-2xl border border-white/10 bg-white/4 p-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <KeyRound className="h-4 w-4 text-amber-300" />
                Role ARN
              </div>
              <Input
                value={roleArn}
                onChange={(e) => setRoleArn(e.target.value)}
                className="mt-2 h-9 rounded-2xl text-xs"
              />
              <div className="mt-2 text-[11px] text-muted-foreground">
                Tip: Use a dedicated IAM role with Cost Explorer + CloudWatch read permissions only.
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-white/10 bg-linear-to-br from-emerald-500/10 via-primary/8 to-amber-500/8 p-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <ShieldCheck className="h-4 w-4 text-emerald-300" />
                Security posture: <span className="font-semibold text-foreground/90">Strong</span>
              </div>
            </div>
          </div>

          {/* Policy / AI (moved here to balance layout) */}
          <div className="rounded-2xl border border-white/10 bg-surface/30 p-4">
            <div className="text-xs text-muted-foreground">Automation</div>
            <div className="mt-1 text-sm font-semibold text-foreground">How we notify + optimize</div>

            <div className="mt-4 space-y-2">
              <SettingCard
                icon={<Sparkles className="h-4 w-4 text-primary" />}
                title="AI recommendations"
                subtitle="Controls how aggressive optimization suggestions are."
                right={
                  <Badge variant={aiMode === "off" ? "neutral" : aiMode === "smart" ? "success" : "warning"}>
                    {aiMode === "off" ? "Off" : aiMode === "smart" ? "Smart" : "Aggressive"}
                  </Badge>
                }
              >
                <div className="flex flex-wrap gap-2">
                  <PillOption active={aiMode === "off"} onClick={() => setAiMode("off")}>
                    Off
                  </PillOption>
                  <PillOption active={aiMode === "smart"} onClick={() => setAiMode("smart")}>
                    Smart (recommended)
                  </PillOption>
                  <PillOption active={aiMode === "aggressive"} onClick={() => setAiMode("aggressive")}>
                    Aggressive
                  </PillOption>
                </div>

                <div className="mt-3 text-[11px] text-muted-foreground">
                  Smart = safe wins (idle cleanup, right-sizing). Aggressive = deeper refactors (RIs, architecture shifts).
                </div>
              </SettingCard>

              <SettingCard
                icon={<ShieldCheck className="h-4 w-4 text-amber-300" />}
                title="Alert cadence"
                subtitle="How often we send non-urgent notifications."
                right={
                  <Badge variant={digest === "instant" ? "success" : digest === "hourly" ? "warning" : "neutral"}>
                    {digest === "instant" ? "Instant" : digest === "hourly" ? "Hourly" : "Daily"}
                  </Badge>
                }
              >
                <div className="flex flex-wrap gap-2">
                  <PillOption active={digest === "instant"} onClick={() => setDigest("instant")}>
                    Instant
                  </PillOption>
                  <PillOption active={digest === "hourly"} onClick={() => setDigest("hourly")}>
                    Hourly digest
                  </PillOption>
                  <PillOption active={digest === "daily"} onClick={() => setDigest("daily")}>
                    Daily summary
                  </PillOption>
                </div>
              </SettingCard>

              <SettingCard
                icon={<Database className="h-4 w-4 text-primary" />}
                title="Data retention"
                subtitle="How long we keep anomaly context + audit snapshots."
                right={
                  <Badge variant={retention === "90d" ? "warning" : retention === "30d" ? "success" : "neutral"}>
                    {retention === "7d" ? "7 days" : retention === "30d" ? "30 days" : "90 days"}
                  </Badge>
                }
              >
                <div className="flex flex-wrap gap-2">
                  <PillOption active={retention === "7d"} onClick={() => setRetention("7d")}>
                    7d
                  </PillOption>
                  <PillOption active={retention === "30d"} onClick={() => setRetention("30d")}>
                    30d
                  </PillOption>
                  <PillOption active={retention === "90d"} onClick={() => setRetention("90d")}>
                    90d
                  </PillOption>
                </div>
              </SettingCard>
            </div>
          </div>
        </div>

        {/* RIGHT: Channels + Sensitivity + Save */}
        <div className="rounded-2xl border border-white/10 bg-surface/30 p-4">
          <div className="text-xs text-muted-foreground">Notifications</div>
          <div className="mt-1 text-sm font-semibold text-foreground">Delivery channels</div>

          <div className="mt-4 space-y-2">
            {/* Email */}
            <SettingCard
              icon={<Mail className="h-4 w-4 text-primary" />}
              title="Email channel"
              subtitle="Detailed anomaly context + recommended fixes."
              right={
                <div className="flex items-center gap-2">
                  <Badge variant={emailEnabled ? "success" : "neutral"}>{emailEnabled ? "Enabled" : "Disabled"}</Badge>
                  <Button
                    variant={emailEnabled ? "ghost" : "secondary"}
                    size="sm"
                    onClick={() => setEmailEnabled((v) => !v)}
                  >
                    {emailEnabled ? "Disable" : "Enable"}
                  </Button>
                </div>
              }
            >
              <div className="grid gap-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-[11px] font-semibold text-muted-foreground">Recipient</div>
                  <div className="flex items-center gap-2">
                    {emailVerified ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-300">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Verified
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-300">
                        <XCircle className="h-3.5 w-3.5" />
                        Pending
                      </span>
                    )}
                    <Button variant="secondary" size="sm" onClick={() => setEmailVerified(true)}>
                      Verify
                    </Button>
                  </div>
                </div>

                <Input
                  value={emailTo}
                  onChange={(e) => setEmailTo(e.target.value)}
                  className="h-9 rounded-2xl text-xs"
                />

                <div className="flex items-center justify-between gap-2">
                  <div className="text-[11px] text-muted-foreground">Sends a full breakdown + top cost drivers.</div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setEmailVerified(true);
                      setEmailEnabled(true);
                    }}
                  >
                    <Send className="h-4 w-4 text-primary" />
                    Send test
                  </Button>
                </div>
              </div>
            </SettingCard>

            {/* WhatsApp */}
            <SettingCard
              icon={<MessageCircle className="h-4 w-4 text-emerald-300" />}
              title="WhatsApp alerts"
              subtitle="Short, urgent alerts when spend accelerates."
              right={
                <div className="flex items-center gap-2">
                  <Badge variant={waEnabled ? "success" : "neutral"}>{waEnabled ? "Enabled" : "Disabled"}</Badge>
                  <Button
                    variant={waEnabled ? "ghost" : "secondary"}
                    size="sm"
                    onClick={() => setWaEnabled((v) => !v)}
                  >
                    {waEnabled ? "Disable" : "Enable"}
                  </Button>
                </div>
              }
            >
              <div className="grid gap-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-[11px] font-semibold text-muted-foreground">Destination</div>
                  {waConnected ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-300">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Connected
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-300">
                      <XCircle className="h-3.5 w-3.5" />
                      Not linked
                    </span>
                  )}
                </div>

                <Input value={waTo} onChange={(e) => setWaTo(e.target.value)} className="h-9 rounded-2xl text-xs" />

                <div className="flex items-center justify-between gap-2">
                  <div className="text-[11px] text-muted-foreground">Ideal for founders on the move.</div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setWaConnected(true);
                      setWaEnabled(true);
                    }}
                  >
                    <Zap className="h-4 w-4 text-emerald-300" />
                    Test ping
                  </Button>
                </div>
              </div>
            </SettingCard>
          </div>

          {/* Sensitivity */}
          <div className="mt-4 rounded-2xl border border-white/10 bg-white/4 p-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-foreground">Anomaly sensitivity</div>
                <div className="mt-1 text-[11px] text-muted-foreground">
                  Higher = more alerts. Lower = fewer, stronger signals.
                </div>
              </div>
              <Badge variant={sensitivity > 70 ? "warning" : "success"}>{sensitivity > 70 ? "High" : "Normal"}</Badge>
            </div>

            <input
              type="range"
              min={30}
              max={90}
              step={1}
              value={sensitivity}
              onChange={(e) => setSensitivity(Number(e.target.value))}
              className="mt-3 w-full accent-[color-mix(in_oklab,var(--color-primary),white_15%)]"
            />

            <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
              <Mail className="h-4 w-4 text-primary" />
              Email:{" "}
              <span className="text-foreground/90">
                {emailEnabled ? (emailVerified ? "Enabled" : "Pending verify") : "Off"}
              </span>
              <span className="mx-1 h-1 w-1 rounded-full bg-white/20" />
              <MessageCircle className="h-4 w-4 text-emerald-300" />
              WhatsApp:{" "}
              <span className="text-foreground/90">
                {waEnabled ? (waConnected ? "Enabled" : "Not linked") : "Off"}
              </span>
            </div>
          </div>

          <div className="mt-4">
            <Button variant="secondary" size="sm" className="w-full">
              <Sparkles className="h-4 w-4 text-primary" />
              Save settings
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
