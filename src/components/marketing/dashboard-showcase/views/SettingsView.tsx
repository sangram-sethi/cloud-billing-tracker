import * as React from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { KeyRound, ShieldCheck, Mail, MessageCircle, Sparkles, Link2 } from "lucide-react";
import { ToggleRow } from "../components/ToggleRow";

export function SettingsView() {
  const [connected, setConnected] = React.useState<boolean>(true);
  const [roleArn, setRoleArn] = React.useState<string>(
    "arn:aws:iam::123456789012:role/CloudBudgetGuardReadOnly"
  );

  const [emailOn, setEmailOn] = React.useState<boolean>(true);
  const [waOn, setWaOn] = React.useState<boolean>(true);
  const [recommendations, setRecommendations] = React.useState<boolean>(true);

  const [sensitivity, setSensitivity] = React.useState<number>(62);

  return (
    <div className="relative h-full min-h-0 overflow-hidden">
      <div className="hideScroll h-full min-h-0 overflow-y-auto pb-10 pr-1">
        <div className="grid min-h-0 grid-rows-[auto_1fr] gap-4">
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

            <Badge variant={connected ? "success" : "neutral"}>{connected ? "AWS connected" : "Disconnected"}</Badge>
          </div>

          <div className="grid min-h-0 grid-cols-1 gap-4 xl:grid-cols-[1.1fr_0.9fr]">
            {/* Connection */}
            <div className="min-h-0 overflow-auto rounded-2xl border border-white/10 bg-surface/30 p-4">
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
                  Security posture: <span className="text-foreground/90 font-semibold">Strong</span>
                </div>
              </div>
            </div>

            {/* Notifications / AI */}
            <div className="min-h-0 overflow-auto rounded-2xl border border-white/10 bg-surface/30 p-4">
              <div className="text-xs text-muted-foreground">Notifications</div>
              <div className="mt-1 text-sm font-semibold text-foreground">Delivery channels</div>

              <div className="mt-4 space-y-2">
                <ToggleRow
                  title="Email alerts"
                  description="Send detailed anomaly context + suggested mitigation steps."
                  checked={emailOn}
                  onChange={setEmailOn}
                  tone="success"
                />
                <ToggleRow
                  title="WhatsApp instant alerts"
                  description="Short, urgent alerts when spend accelerates fast."
                  checked={waOn}
                  onChange={setWaOn}
                  tone="success"
                />
                <ToggleRow
                  title="AI recommendations"
                  description="Optimization tips included in alerts + weekly founder report."
                  checked={recommendations}
                  onChange={setRecommendations}
                  tone="primary"
                />
              </div>

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
                  Email: <span className="text-foreground/90">{emailOn ? "Enabled" : "Off"}</span>
                  <span className="mx-1 h-1 w-1 rounded-full bg-white/20" />
                  <MessageCircle className="h-4 w-4 text-emerald-300" />
                  WhatsApp: <span className="text-foreground/90">{waOn ? "Enabled" : "Off"}</span>
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

        <style jsx>{`
          .hideScroll::-webkit-scrollbar {
            width: 0px;
            height: 0px;
          }
          .hideScroll {
            scrollbar-width: none;
            -ms-overflow-style: none;
          }
        `}</style>
      </div>
    </div>
  );
}
