import * as React from "react";
import { cn } from "@/lib/cn";
import { Badge } from "@/components/ui/Badge";
import { Check, Clock, Mail, MessageCircle, Sparkles } from "lucide-react";
import type { Channel, Stage } from "./types";
import { channelStatus, formatUsd, statusBadgeVariant } from "./utils";

export function MessageCard({
  channel,
  stage,
  onOpen,
  incidentKey,
  className,
}: {
  channel: Channel;
  stage: Stage;
  onOpen: () => void;
  incidentKey: number;
  className?: string;
}) {
  const status = channelStatus(stage);
  const delivered = stage === "delivered";
  const sending = stage === "sending";
  const animateIn = stage !== "idle";
  const variant = statusBadgeVariant(stage);

  const title = channel === "email" ? "Email" : "WhatsApp";
  const subtitle = channel === "email" ? "Founder-ready" : "Instant ping";
  const Icon = channel === "email" ? Mail : MessageCircle;

  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        "w-full h-full text-left outline-none",
        "rounded-3xl border border-white/10 bg-surface/30 p-4 overflow-hidden",
        "transition-[transform,background-color,border-color] duration-200 ease-(--ease-snappy)",
        "hover:bg-surface/35 active:scale-[0.995]",
        stage !== "idle" ? "ring-1 ring-white/10" : "",
        "flex flex-col min-h-0",
        className
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className={cn(
              "grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-white/4",
              channel === "whatsapp" ? "text-emerald-200" : "text-foreground/90"
            )}
          >
            <Icon className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <div className="text-xs text-muted-foreground">{title}</div>
            <div className="mt-0.5 truncate text-sm font-semibold text-foreground">{subtitle}</div>
          </div>
        </div>
        <Badge variant={variant}>{status}</Badge>
      </div>

      {/* Body takes remaining space so cards feel balanced */}
      <div className="mt-4 flex-1 min-h-0">
        {animateIn ? (
          <div
            key={`${channel}-${incidentKey}-${animateIn ? "on" : "off"}`}
            className={cn(
              "rounded-2xl border border-white/10 bg-black/20 p-3 overflow-hidden",
              "as-pop"
            )}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="inline-flex items-center gap-2 text-[11px] text-muted-foreground min-w-0">
                <span
                  className={cn(
                    "grid h-6 w-6 place-items-center rounded-lg ring-1",
                    channel === "whatsapp"
                      ? "bg-emerald-500/10 ring-emerald-500/20"
                      : "bg-primary/10 ring-primary/20"
                  )}
                >
                  <Sparkles
                    className={cn(
                      "h-3.5 w-3.5",
                      channel === "whatsapp" ? "text-emerald-300" : "text-primary"
                    )}
                  />
                </span>
                <span className="truncate font-semibold text-foreground/90">CloudBudgetGuard</span>
              </div>

              <div className="inline-flex shrink-0 items-center gap-1 text-[11px] text-muted-foreground">
                {delivered ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-300" />
                    <span>Delivered</span>
                  </>
                ) : sending ? (
                  <>
                    <Clock className="h-3.5 w-3.5 text-amber-300" />
                    <span>Sending</span>
                  </>
                ) : (
                  <>
                    <Clock className="h-3.5 w-3.5" />
                    <span>Queued</span>
                  </>
                )}
              </div>
            </div>

            {channel === "email" ? (
              <>
                <div className="mt-3 text-xs font-semibold text-foreground">
                  AWS spend anomaly detected —{" "}
                  <span className="text-rose-300">+{formatUsd(184)}</span> in 20 minutes
                </div>
                <div className="mt-2 text-[11px] text-muted-foreground">
                  Spike in <span className="text-foreground/85">us-east-1</span> (EC2). Suggested mitigation included.
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
                  <div className="rounded-xl border border-white/10 bg-white/4 px-2.5 py-2">
                    <div className="text-muted-foreground">Account</div>
                    <div className="mt-0.5 font-semibold text-foreground">Acme Inc • Prod</div>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/4 px-2.5 py-2">
                    <div className="text-muted-foreground">Action</div>
                    <div className="mt-0.5 font-semibold text-foreground">Review top drivers</div>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/4 px-3 py-1.5 text-[11px] text-muted-foreground">
                    Open details <span className="text-muted-foreground">→</span>
                  </div>
                  <div className="text-[11px] text-muted-foreground">Cost breakdown</div>
                </div>
              </>
            ) : (
              <>
                <div className="mt-3 space-y-2">
                  <div className="w-fit max-w-full rounded-2xl bg-white/6 px-3 py-2 text-xs text-foreground/90">
                    <span className="font-semibold">AWS anomaly:</span> +{formatUsd(184)} in 20m
                    <span className="text-muted-foreground"> (EC2 • us-east-1)</span>
                  </div>
                  <div className="w-fit max-w-full rounded-2xl bg-white/6 px-3 py-2 text-xs text-foreground/90">
                    Tap to open incident console <span className="text-muted-foreground">→</span>
                  </div>
                </div>
                <div className="mt-3 rounded-2xl border border-white/10 bg-white/4 p-2 text-[11px] text-muted-foreground">
                  Short + urgent. Designed for fast response.
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="rounded-2xl border border-white/10 bg-white/4 p-3 text-[11px] text-muted-foreground">
            Click the spike to preview a real alert.
          </div>
        )}
      </div>

      {/* Footer pinned visually lower by flex layout */}
      <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
        <span>{stage === "idle" ? "Standby" : "Tap to expand"}</span>
        <span className={cn("inline-flex items-center gap-1", delivered ? "text-emerald-300" : "")}>
          {delivered ? <Check className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
          {delivered ? "Just now" : "—"}
        </span>
      </div>
    </button>
  );
}
