import * as React from "react";
import { cn } from "@/lib/cn";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Check, Mail, MessageCircle, X } from "lucide-react";
import type { Channel, Stage } from "./types";
import { fmtPct, formatUsd, stageLabel } from "./utils";

export function DetailsModal({
  open,
  channel,
  stage,
  confidence,
  onClose,
}: {
  open: boolean;
  channel: Channel | null;
  stage: Stage;
  confidence: number;
  onClose: () => void;
}) {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !channel) return null;

  const Icon = channel === "email" ? Mail : MessageCircle;
  const title = channel === "email" ? "Email delivery" : "WhatsApp delivery";

  return (
    <div className="absolute inset-0 z-20">
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 bg-black/55 backdrop-blur-sm" />

      <div className="absolute inset-0 grid place-items-center p-4">
        <div
          className={cn(
            "w-full max-w-140 rounded-3xl border border-white/10 bg-surface/80 backdrop-blur",
            "shadow-[0_0_0_1px_rgba(255,255,255,0.05),0_30px_120px_rgba(0,0,0,0.75)]",
            "overflow-hidden"
          )}
        >
          <div className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
            <div className="flex items-center gap-2 min-w-0">
              <span className="grid h-9 w-9 place-items-center rounded-2xl border border-white/10 bg-white/4">
                <Icon className="h-4 w-4 text-foreground/90" />
              </span>
              <div className="min-w-0">
                <div className="text-xs text-muted-foreground">Incident details</div>
                <div className="mt-0.5 truncate text-sm font-semibold text-foreground">{title}</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant={stage === "delivered" ? "success" : stage === "idle" ? "neutral" : "warning"}>{stageLabel(stage)}</Badge>
              <Button variant="ghost" size="sm" onClick={onClose} className="h-9 w-9 rounded-full px-0">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="p-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/4 p-3">
                <div className="text-[11px] text-muted-foreground">Account</div>
                <div className="mt-1 text-sm font-semibold text-foreground">Acme Inc • Prod</div>
                <div className="mt-2 text-[11px] text-muted-foreground">Scope: read-only billing</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/4 p-3">
                <div className="text-[11px] text-muted-foreground">Spike</div>
                <div className="mt-1 text-sm font-semibold text-foreground">
                  +<span className="text-rose-300">{formatUsd(184)}</span> / 20m
                </div>
                <div className="mt-2 text-[11px] text-muted-foreground">EC2 • us-east-1 • i-0c91…</div>
              </div>
            </div>

            <div className="mt-3 rounded-2xl border border-white/10 bg-black/20 p-3">
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span>Detection confidence</span>
                <span className="font-semibold text-foreground/90">{fmtPct(confidence)}</span>
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/6">
                <div className="h-2 rounded-full bg-linear-to-r from-primary/60 via-emerald-500/35 to-amber-500/25" style={{ width: `${Math.round(confidence * 100)}%` }} />
              </div>
              <div className="mt-2 text-[11px] text-muted-foreground">
                Routed to {channel === "email" ? "Email" : "WhatsApp"} based on alert policy.
              </div>
            </div>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/4 p-3">
                <div className="text-[11px] font-semibold text-foreground">Suggested mitigation</div>
                <ul className="mt-2 space-y-1 text-[11px] text-muted-foreground">
                  <li>• Check new instances/ASG scale events</li>
                  <li>• Review region + service breakdown</li>
                  <li>• Consider budget cap + alarms</li>
                </ul>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/4 p-3">
                <div className="text-[11px] font-semibold text-foreground">Delivery receipt</div>
                <div className="mt-2 flex items-center gap-2 text-[11px] text-muted-foreground">
                  <Check className="h-4 w-4 text-emerald-300" />
                  <span>{stage === "delivered" ? "Delivered" : "In progress"}</span>
                </div>
                <div className="mt-2 text-[11px] text-muted-foreground">
                  Timestamp: <span className="text-foreground/85">13:10 • just now</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
