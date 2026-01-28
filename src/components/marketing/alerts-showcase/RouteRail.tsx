import * as React from "react";
import { cn } from "@/lib/cn";
import { Badge } from "@/components/ui/Badge";
import {
  Cloud,
  ShieldAlert,
  Send,
  Check,
  Clock,
  BellRing,
  Timer,
  Sparkles,
} from "lucide-react";
import type { Stage } from "./types";
import { fmtPct, stageLabel } from "./utils";

type StepState = "waiting" | "active" | "done";

function stepStateFor(stage: Stage, step: "signal" | "detect" | "route"): StepState {
  if (stage === "idle") return "waiting";

  if (step === "signal") {
    // once incident starts, signal is captured
    return "done";
  }

  if (step === "detect") {
    if (stage === "detecting") return "active";
    if (stage === "routing" || stage === "sending" || stage === "delivered") return "done";
    return "waiting";
  }

  // route
  if (stage === "routing" || stage === "sending") return "active";
  if (stage === "delivered") return "done";
  return "waiting";
}

function StateIcon({ state }: { state: StepState }) {
  if (state === "done") return <Check className="h-3.5 w-3.5 text-emerald-300" />;
  if (state === "active") return <Clock className="h-3.5 w-3.5 text-amber-300" />;
  return <Clock className="h-3.5 w-3.5 text-muted-foreground" />;
}

function StepRow({
  icon,
  title,
  subtitle,
  state,
  right,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  state: StepState;
  right?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-white/10 bg-white/4 p-3 overflow-hidden",
        state === "active" ? "ring-1 ring-primary/18 bg-primary/7" : "",
        state === "done" ? "ring-1 ring-emerald-500/12" : ""
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-white/10 bg-black/20">
            {icon}
          </div>
          <div className="min-w-0">
            <div className="text-xs font-semibold text-foreground/90">{title}</div>
            <div className="mt-0.5 text-[11px] text-muted-foreground leading-snug">{subtitle}</div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {right}
          <span className="grid h-7 w-7 place-items-center rounded-full border border-white/10 bg-black/20">
            <StateIcon state={state} />
          </span>
        </div>
      </div>

      {children ? <div className="mt-3">{children}</div> : null}
    </div>
  );
}

function CapabilityChip({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-3 py-2",
        "text-[11px] text-muted-foreground backdrop-blur"
      )}
    >
      <span className="grid h-6 w-6 place-items-center rounded-full border border-white/10 bg-white/4">
        {icon}
      </span>
      <span className="whitespace-nowrap">
        <span className="font-semibold text-foreground/85">{label}</span>
        <span className="mx-1 text-white/25">•</span>
        <span className="text-foreground/80">{value}</span>
      </span>
    </div>
  );
}

export function RouteRail({ stage, confidence }: { stage: Stage; confidence: number }) {
  const sSignal = stepStateFor(stage, "signal");
  const sDetect = stepStateFor(stage, "detect");
  const sRoute = stepStateFor(stage, "route");

  const routeText =
    stage === "idle"
      ? "Policies armed. Awaiting signal."
      : stage === "detecting"
      ? "Preparing channels + templates"
      : "Branching to Email + WhatsApp";

  const showConfidence = stage !== "idle";
  const showBranchPills = stage === "routing" || stage === "sending" || stage === "delivered";

  return (
    <div className="relative rounded-2xl border border-white/10 bg-surface/30 p-4 overflow-hidden">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs text-muted-foreground">Anomaly → Action</div>
          <div className="mt-1 text-sm font-semibold text-foreground">Pipeline steps</div>
        </div>
        <Badge variant={stage === "idle" ? "neutral" : stage === "delivered" ? "success" : "warning"}>
          {stageLabel(stage)}
        </Badge>
      </div>

      {/* ✅ Best alternative to the old mini-cards+rail: stacked stepper (no truncation, no overlays) */}
      <div className="mt-4 space-y-3">
        <StepRow
          icon={<Cloud className="h-4 w-4 text-foreground/90" />}
          title="Signal"
          subtitle="AWS Cost Explorer + usage stream"
          state={sSignal}
          right={<Badge variant={stage === "idle" ? "neutral" : "success"}>{stage === "idle" ? "Stable" : "Captured"}</Badge>}
        />

        <StepRow
          icon={<ShieldAlert className="h-4 w-4 text-primary" />}
          title="Detection"
          subtitle={stage === "idle" ? "No anomalies in the window" : "Anomaly detected. Confidence rising."}
          state={sDetect}
          right={
            showConfidence ? (
              <Badge variant={confidence >= 0.85 ? "success" : "warning"}>{fmtPct(confidence)}</Badge>
            ) : undefined
          }
        >
          {showConfidence ? (
            <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span>Confidence</span>
                <span className="font-semibold text-foreground/90">{fmtPct(confidence)}</span>
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/6">
                <div
                  className="h-2 rounded-full bg-linear-to-r from-primary/60 via-emerald-500/35 to-amber-500/25 transition-[width] duration-300 ease-(--ease-snappy)"
                  style={{ width: `${Math.round(confidence * 100)}%` }}
                />
              </div>
            </div>
          ) : null}
        </StepRow>

        <StepRow
          icon={<Send className="h-4 w-4 text-emerald-200" />}
          title="Routing"
          subtitle={routeText}
          state={sRoute}
          right={
            showBranchPills ? (
              <span className="hidden sm:inline-flex items-center gap-2">
                <span className="rounded-full border border-white/10 bg-white/6 px-2.5 py-1 text-[11px] text-foreground/85">
                  Email
                </span>
                <span className="rounded-full border border-white/10 bg-white/6 px-2.5 py-1 text-[11px] text-foreground/85">
                  WhatsApp
                </span>
              </span>
            ) : undefined
          }
        />
      </div>

      {/* Compact guarantees strip (kept premium + resilient) */}
      <div className="mt-5 rounded-2xl border border-white/10 bg-white/4 p-3 overflow-hidden">
        <div className="flex items-center justify-between gap-3">
          <div className="text-xs font-semibold text-foreground/90">Guarantees</div>
          <Badge variant={stage === "idle" ? "neutral" : stage === "delivered" ? "success" : "warning"}>
            {stage === "idle" ? "Armed" : stage === "delivered" ? "Completed" : "Processing"}
          </Badge>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <CapabilityChip
            icon={<BellRing className="h-3.5 w-3.5 text-emerald-300" />}
            label="Policy"
            value="Notify + cap"
          />
          <CapabilityChip
            icon={<Timer className="h-3.5 w-3.5 text-amber-300" />}
            label="Latency"
            value="p99 < 30s"
          />
          <CapabilityChip
            icon={<Sparkles className="h-3.5 w-3.5 text-primary" />}
            label="Format"
            value="Founder-friendly"
          />
        </div>
      </div>

      <div className="mt-4 flex justify-start">
        <Badge variant={stage === "idle" ? "neutral" : stage === "delivered" ? "success" : "warning"}>
          {stage === "idle" ? "Ready" : stage === "delivered" ? "Delivered" : "In flight"}
        </Badge>
      </div>
    </div>
  );
}
