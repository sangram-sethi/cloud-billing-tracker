import * as React from "react";
import { cn } from "@/lib/cn";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Mail, MessageCircle, FileText, Sparkles, Clock } from "lucide-react";
import type { RangeData, RangeKey } from "../types";
import { fmtUsd0 } from "../utils";
import { RANGE_LABEL } from "../data";

type Channel = "email" | "whatsapp";
type Status = "idle" | "generating" | "sent";

export function ReportsView({
  range,
  base,
  mtd,
  forecast,
}: {
  range: RangeKey;
  base: RangeData;
  mtd: number;
  forecast: number;
}) {
  const [channel, setChannel] = React.useState<Channel>("email");
  const [status, setStatus] = React.useState<Status>("idle");

  React.useEffect(() => {
    if (status !== "generating") return;
    const t = window.setTimeout(() => setStatus("sent"), 900);
    return () => window.clearTimeout(t);
  }, [status]);

  const top = base.services.slice(0, 3);

  return (
    <div className="grid h-full min-h-0 grid-rows-[auto_1fr] gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-2xl border border-white/10 bg-white/5">
            <FileText className="h-4 w-4 text-primary" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Reports</div>
            <div className="text-sm font-semibold text-foreground">Founder report • {RANGE_LABEL[range]}</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setChannel("email")}
            className={cn(
              "rounded-full border px-3 py-2 text-xs transition-colors duration-200 ease-(--ease-snappy)",
              channel === "email"
                ? "border-primary/25 bg-primary/10 text-foreground"
                : "border-white/10 bg-white/4 text-muted-foreground hover:text-foreground hover:bg-white/5"
            )}
          >
            <span className="inline-flex items-center gap-2">
              <Mail className="h-4 w-4 text-primary" />
              Email
            </span>
          </button>

          <button
            type="button"
            onClick={() => setChannel("whatsapp")}
            className={cn(
              "rounded-full border px-3 py-2 text-xs transition-colors duration-200 ease-(--ease-snappy)",
              channel === "whatsapp"
                ? "border-success/25 bg-success/10 text-foreground"
                : "border-white/10 bg-white/4 text-muted-foreground hover:text-foreground hover:bg-white/5"
            )}
          >
            <span className="inline-flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-success" />
              WhatsApp
            </span>
          </button>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => setStatus("generating")}
            disabled={status === "generating"}
          >
            <Sparkles className={cn("h-4 w-4", status === "generating" ? "animate-pulse text-warning" : "text-primary")} />
            {status === "generating" ? "Generating…" : "Generate now"}
          </Button>
        </div>
      </div>

      <div className="grid min-h-0 grid-cols-1 gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        {/* Preview */}
        <div className="min-h-0 rounded-2xl border border-white/10 bg-surface/30 p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-muted-foreground">Preview</div>
              <div className="mt-1 text-sm font-semibold text-foreground">
                {channel === "email" ? "Email report" : "WhatsApp digest"}
              </div>
            </div>
            <Badge variant={status === "sent" ? "success" : status === "generating" ? "warning" : "neutral"}>
              {status === "sent" ? "Sent" : status === "generating" ? "In progress" : "Ready"}
            </Badge>
          </div>

          <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="flex items-center gap-2">
              {channel === "email" ? (
                <Mail className="h-4 w-4 text-primary" />
              ) : (
                <MessageCircle className="h-4 w-4 text-success" />
              )}
              <div className="text-xs font-semibold text-foreground">CloudBudgetGuard • Founder report</div>
              <div className="ml-auto text-[11px] text-muted-foreground">Week ending Fri</div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/4 p-3">
                <div className="text-[11px] text-muted-foreground">MTD</div>
                <div className="mt-1 text-sm font-semibold text-foreground">{fmtUsd0(mtd)}</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/4 p-3">
                <div className="text-[11px] text-muted-foreground">Forecast</div>
                <div className="mt-1 text-sm font-semibold text-foreground">{fmtUsd0(forecast)}</div>
              </div>
            </div>

            <div className="mt-3 rounded-2xl border border-white/10 bg-white/4 p-3">
              <div className="text-xs font-semibold text-foreground">Top spend drivers</div>
              <div className="mt-2 space-y-1.5">
                {top.map((s) => (
                  <div key={s.name} className="flex items-center justify-between text-xs">
                    <span className="text-foreground/90">{s.name}</span>
                    <span className="text-muted-foreground">{fmtUsd0(s.amt)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-3 rounded-2xl border border-white/10 bg-linear-to-br from-primary/10 via-success/6 to-warning/6 p-3">
              <div className="text-xs font-semibold text-foreground">Actionable recommendation</div>
              <div className="mt-1 text-xs text-muted-foreground">
                If spikes persist: cap EC2 autoscaling + move logs to cheaper tier for 48h.
              </div>
            </div>
          </div>
        </div>

        {/* Schedule / controls */}
        <div className="min-h-0 rounded-2xl border border-white/10 bg-surface/30 p-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs text-muted-foreground">Schedule</div>
              <div className="mt-1 text-sm font-semibold text-foreground">Auto-send every Friday</div>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-4 w-4 text-muted-foreground" />
              09:00
            </div>
          </div>

          <div className="mt-4 space-y-2">
            <div className="rounded-2xl border border-white/10 bg-white/4 p-3">
              <div className="text-xs font-semibold text-foreground">What’s included</div>
              <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                <li>• Top 5 cost drivers</li>
                <li>• Biggest anomaly + cause hypothesis</li>
                <li>• Suggested budget guardrails</li>
                <li>• 1-click mitigation checklist</li>
              </ul>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/4 p-3">
              <div className="text-xs font-semibold text-foreground">Delivery</div>
              <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                <Mail className="h-4 w-4 text-primary" />
                founders@acme.io
              </div>
              <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                <MessageCircle className="h-4 w-4 text-success" />
                WhatsApp: +91 •••• •••• 42
              </div>
            </div>
          </div>

          <div className="mt-4">
            <Button variant="secondary" size="sm" className="w-full">
              Export PDF (preview)
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
