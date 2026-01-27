"use client";

import * as React from "react";
import { cn } from "@/lib/cn";
import { Badge } from "@/components/ui/Badge";
import {
  ArrowRight,
  BellRing,
  Check,
  Cloud,
  Mail,
  MessageCircle,
  ShieldAlert,
  SlidersHorizontal,
  Sparkles,
  Wand2,
} from "lucide-react";

type Props = {
  className?: string;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function SparklineMini({
  values,
  spikeIndex,
}: {
  values: number[];
  spikeIndex?: number;
}) {
  const w = 260;
  const h = 78;
  const pad = 6;
  const min = Math.min(...values);
  const max = Math.max(...values);

  const pts = values
    .map((v, i) => {
      const x = pad + (i * (w - pad * 2)) / (values.length - 1);
      const t = (v - min) / (max - min || 1);
      const y = pad + (1 - t) * (h - pad * 2);
      return [x, y] as const;
    })
    .map(([x, y]) => `${x},${y}`)
    .join(" ");

  const spike =
    typeof spikeIndex === "number"
      ? (() => {
          const i = clamp(spikeIndex, 0, values.length - 1);
          const x = pad + (i * (w - pad * 2)) / (values.length - 1);
          const t = (values[i] - min) / (max - min || 1);
          const y = pad + (1 - t) * (h - pad * 2);
          return { x, y };
        })()
      : null;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-19.5 w-full">
      <defs>
        <linearGradient id="as_fill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="rgba(59,130,246,0.25)" />
          <stop offset="100%" stopColor="rgba(59,130,246,0.02)" />
        </linearGradient>
        <linearGradient id="as_stroke" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor="rgba(255,255,255,0.50)" />
          <stop offset="60%" stopColor="rgba(59,130,246,0.85)" />
          <stop offset="100%" stopColor="rgba(124,58,237,0.55)" />
        </linearGradient>
      </defs>

      <polyline
        points={`${pad},${h - pad} ${pts} ${w - pad},${h - pad}`}
        fill="url(#as_fill)"
        stroke="none"
      />
      <polyline
        points={pts}
        fill="none"
        stroke="url(#as_stroke)"
        strokeWidth={3}
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {spike ? (
        <g>
          <circle
            cx={spike.x}
            cy={spike.y}
            r={4}
            fill="rgba(255,255,255,0.85)"
          />
          <circle
            className="as-pulse"
            cx={spike.x}
            cy={spike.y}
            r={10}
            fill="none"
            stroke="rgba(59,130,246,0.55)"
            strokeWidth={2}
          />
        </g>
      ) : null}
    </svg>
  );
}

function Node({
  label,
  sub,
  icon,
  active,
}: {
  label: string;
  sub: string;
  icon: React.ReactNode;
  active: boolean;
}) {
  return (
    <div
      className={cn(
        "relative rounded-2xl border border-white/10 bg-white/4 px-3 py-3",
        active ? "ring-1 ring-primary/25 bg-primary/8" : ""
      )}
    >
      <div className="flex items-start gap-2">
        <div
          className={cn(
            "grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-black/20",
            active ? "text-foreground" : "text-muted-foreground"
          )}
        >
          {icon}
        </div>
        <div className="min-w-0">
          <div className="truncate text-xs font-semibold text-foreground/90">
            {label}
          </div>
          <div className="mt-0.5 truncate text-[11px] text-muted-foreground">
            {sub}
          </div>
        </div>
      </div>

      {active ? (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-2xl"
          style={{
            background:
              "radial-gradient(320px circle at 50% 0%, rgba(124,58,237,0.22), transparent 62%)",
          }}
        />
      ) : null}
    </div>
  );
}

export function AlertsShowcase({ className }: Props) {
  const steps = React.useMemo(
    () => [
      {
        label: "AWS Billing",
        sub: "Read-only",
        icon: <Cloud className="h-4 w-4" />,
      },
      {
        label: "Anomaly Engine",
        sub: "Scores + flags",
        icon: <ShieldAlert className="h-4 w-4" />,
      },
      {
        label: "Budget Policy",
        sub: "Rules & caps",
        icon: <SlidersHorizontal className="h-4 w-4" />,
      },
      {
        label: "Formatter",
        sub: "Founder-friendly",
        icon: <Wand2 className="h-4 w-4" />,
      },
      {
        label: "Dispatch",
        sub: "Email + WhatsApp",
        icon: <BellRing className="h-4 w-4" />,
      },
    ],
    []
  );

  const [step, setStep] = React.useState(0);

  React.useEffect(() => {
    const id = window.setInterval(() => {
      setStep((s) => (s + 1) % steps.length);
    }, 1050);
    return () => window.clearInterval(id);
  }, [steps.length]);

  const progress = (step / (steps.length - 1)) * 100;

  return (
    <div
      className={cn(
        "relative aspect-16/10 w-full overflow-hidden rounded-3xl border border-white/10 bg-background/30",
        "shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_18px_80px_rgba(0,0,0,0.55)]",
        className
      )}
    >
      {/* Full-bleed texture (fills the entire frame) */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          background:
            "radial-gradient(900px 520px at 20% 0%, rgba(59,130,246,0.16), transparent 60%)," +
            "radial-gradient(760px 520px at 88% 20%, rgba(124,58,237,0.14), transparent 60%)," +
            "linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px)," +
            "linear-gradient(to bottom, rgba(255,255,255,0.04) 1px, transparent 1px)",
          backgroundSize: "auto, auto, 64px 64px, 64px 64px",
        }}
      />

      {/* 3-lane layout: Source → Pipeline → Destinations (no overlap, no dead space) */}
      <div className="relative grid h-full w-full grid-cols-1 gap-4 p-4 lg:grid-cols-[0.95fr_1.35fr_1fr]">
        {/* Lane 1: Source + Trigger */}
        <div className="grid h-full min-h-0 grid-rows-[auto_1fr] gap-4">
          <div className="rounded-2xl border border-white/10 bg-surface/30 p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-muted-foreground">Billing stream</div>
                <div className="mt-1 text-sm font-semibold text-foreground">
                  Spend signal
                </div>
              </div>
              <Badge variant="neutral">Last 24h</Badge>
            </div>

            <div className="mt-3 rounded-2xl border border-white/10 bg-black/20 p-3">
              <SparklineMini
                values={[
                  9, 10, 9, 10, 12, 11, 12, 14, 15, 18, 22, 40, 66, 52, 36,
                  28, 22,
                ]}
                spikeIndex={12}
              />
              <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
                <span>09:00</span>
                <span>13:10 spike</span>
                <span>Now</span>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-3">
              {[
                { k: "Service", v: "EC2" },
                { k: "Region", v: "us-east-1" },
                { k: "Delta", v: "+$184" },
              ].map((x) => (
                <div
                  key={x.k}
                  className="rounded-2xl border border-white/10 bg-white/4 px-3 py-2"
                >
                  <div className="text-[11px] text-muted-foreground">{x.k}</div>
                  <div className="mt-0.5 text-xs font-semibold text-foreground">
                    {x.v}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="min-h-0 rounded-2xl border border-white/10 bg-surface/30 p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-muted-foreground">Trigger</div>
                <div className="mt-1 text-sm font-semibold text-foreground">
                  Anomaly detected
                </div>
              </div>
              <Badge variant="warning">High</Badge>
            </div>

            <div className="mt-4 space-y-3">
              {[
                { k: "Window", v: "20 minutes" },
                { k: "Confidence", v: "0.92" },
                { k: "Likely cause", v: "Scale-up / new instance family" },
              ].map((x) => (
                <div
                  key={x.k}
                  className="rounded-2xl border border-white/10 bg-white/4 px-3 py-2"
                >
                  <div className="text-[11px] text-muted-foreground">{x.k}</div>
                  <div className="mt-0.5 text-xs font-semibold text-foreground">
                    {x.v}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 rounded-2xl border border-white/10 bg-white/4 p-3 text-xs text-muted-foreground">
              Next: route through policy → format → dispatch.
            </div>
          </div>
        </div>

        {/* Lane 2: Pipeline */}
        <div className="relative grid h-full min-h-0 grid-rows-[auto_1fr] gap-4">
          <div className="rounded-2xl border border-white/10 bg-surface/30 px-4 py-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-muted-foreground">Alert pipeline</div>
                <div className="mt-1 text-sm font-semibold text-foreground">
                  From spike → message
                </div>
              </div>
              <Badge variant="neutral">p99 &lt; 30s</Badge>
            </div>
          </div>

          <div className="relative min-h-0 rounded-2xl border border-white/10 bg-surface/30 p-4">
            {/* Connector rail + moving packet (contained inside this panel) */}
            <div className="pointer-events-none absolute left-6 right-6 top-1/2 -translate-y-1/2">
              <div className="relative h-0.5 w-full rounded-full bg-white/10">
                <div
                  className="absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-white/80 shadow-[0_0_0_6px_rgba(124,58,237,0.14),0_14px_40px_rgba(0,0,0,0.55)] transition-[left] duration-700 ease-(--ease-snappy) motion-reduce:transition-none"
                  style={{ left: `calc(${progress}% - 6px)` }}
                />
              </div>
            </div>

            <div className="grid h-full grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {steps.map((n, i) => (
                <Node
                  key={n.label}
                  label={n.label}
                  sub={n.sub}
                  icon={n.icon}
                  active={i === step}
                />
              ))}
            </div>

            <div className="mt-4 grid grid-cols-3 gap-3">
              {[
                { k: "Policy", v: "Notify + cap" },
                { k: "Channel", v: "Email + WhatsApp" },
                { k: "Format", v: "Founder report" },
              ].map((x) => (
                <div
                  key={x.k}
                  className="rounded-2xl border border-white/10 bg-white/4 px-3 py-2"
                >
                  <div className="text-[11px] text-muted-foreground">{x.k}</div>
                  <div className="mt-0.5 text-xs font-semibold text-foreground">
                    {x.v}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Lane 3: Destinations */}
        <div className="grid h-full min-h-0 grid-rows-2 gap-4">
          {/* Email */}
          <div className="min-h-0 rounded-2xl border border-white/10 bg-surface/30 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-white/4 text-foreground/90">
                  <Mail className="h-4 w-4" />
                </span>
                <div>
                  <div className="text-xs text-muted-foreground">Email</div>
                  <div className="mt-0.5 text-sm font-semibold text-foreground">
                    Anomaly alert
                  </div>
                </div>
              </div>
              <Badge variant={step === 4 ? "success" : "neutral"}>
                {step === 4 ? "Queued" : "Ready"}
              </Badge>
            </div>

            <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-3">
              <div className="flex items-center justify-between">
                <div className="text-[11px] text-muted-foreground">From</div>
                <div className="text-[11px] text-foreground/85">
                  Cloud Billing Tracker
                </div>
              </div>

              <div className="mt-2 text-xs font-semibold text-foreground">
                AWS spend anomaly detected — +$184 in 20 minutes
              </div>
              <div className="mt-2 text-[11px] text-muted-foreground">
                We flagged unusual spend in us-east-1. Alerts are active and budget
                actions are ready.
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
                <div className="rounded-xl border border-white/10 bg-white/4 px-2.5 py-2">
                  <div className="text-muted-foreground">Account</div>
                  <div className="mt-0.5 font-semibold text-foreground">
                    Acme Inc • Prod
                  </div>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/4 px-2.5 py-2">
                  <div className="text-muted-foreground">Confidence</div>
                  <div className="mt-0.5 font-semibold text-foreground">
                    High (0.92)
                  </div>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/4 px-2.5 py-2">
                  <div className="text-muted-foreground">Spike</div>
                  <div className="mt-0.5 font-semibold text-foreground">
                    +$184 (EC2)
                  </div>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/4 px-2.5 py-2">
                  <div className="text-muted-foreground">Region</div>
                  <div className="mt-0.5 font-semibold text-foreground">
                    us-east-1
                  </div>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/4 px-3 py-1.5 text-[11px] text-muted-foreground">
                  Review anomaly <ArrowRight className="h-3.5 w-3.5" />
                </div>
                <div className="text-[11px] text-muted-foreground">
                  View cost breakdown
                </div>
              </div>
            </div>
          </div>

          {/* WhatsApp */}
          <div className="min-h-0 rounded-2xl border border-white/10 bg-surface/30 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-white/4 text-foreground/90">
                  <MessageCircle className="h-4 w-4" />
                </span>
                <div>
                  <div className="text-xs text-muted-foreground">WhatsApp</div>
                  <div className="mt-0.5 text-sm font-semibold text-foreground">
                    Instant ping
                  </div>
                </div>
              </div>
              <Badge variant={step === 4 ? "success" : "neutral"}>
                {step === 4 ? "Delivered" : "Standby"}
              </Badge>
            </div>

            <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-3">
              <div className="flex items-center justify-between">
                <div className="inline-flex items-center gap-2 text-[11px] text-muted-foreground">
                  <span className="grid h-6 w-6 place-items-center rounded-lg bg-success/12 ring-1 ring-success/20">
                    <Sparkles className="h-3.5 w-3.5 text-success" />
                  </span>
                  <span className="font-semibold text-foreground/90">
                    Cloud Billing Tracker
                  </span>
                </div>
                <div className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Check
                    className={cn(
                      "h-3.5 w-3.5",
                      step === 4 ? "text-success" : "text-muted-foreground"
                    )}
                  />
                  Delivered
                </div>
              </div>

              <div className="mt-3 space-y-2">
                <div className="w-fit max-w-full rounded-2xl bg-white/6 px-3 py-2 text-xs text-foreground/90">
                  <span className="font-semibold">AWS anomaly:</span> +$184 in 20
                  min
                  <span className="text-muted-foreground">
                    {" "}
                    (EC2 • us-east-1)
                  </span>
                </div>
                <div className="w-fit max-w-full rounded-2xl bg-white/6 px-3 py-2 text-xs text-foreground/90">
                  Confidence: <span className="font-semibold">High</span>
                </div>
                <div className="w-fit max-w-full rounded-2xl bg-white/6 px-3 py-2 text-xs text-foreground/90">
                  Tap to review <span className="text-muted-foreground">→</span>
                </div>
              </div>

              <div className="mt-3 rounded-2xl border border-white/10 bg-white/4 p-2 text-[11px] text-muted-foreground">
                Founder-friendly formatting • short + actionable
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3">
              {[
                { k: "Owner", v: "Founder" },
                { k: "Mode", v: "Escalation" },
              ].map((x) => (
                <div
                  key={x.k}
                  className="rounded-2xl border border-white/10 bg-white/4 px-3 py-2"
                >
                  <div className="text-[11px] text-muted-foreground">{x.k}</div>
                  <div className="mt-0.5 text-xs font-semibold text-foreground">
                    {x.v}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .as-pulse {
          stroke-dasharray: 1;
          animation: asPulse 1.4s var(--ease-snappy) infinite;
          transform-origin: center;
          opacity: 0.85;
        }

        @keyframes asPulse {
          0% {
            transform: scale(0.75);
            opacity: 0.9;
          }
          70% {
            transform: scale(1.2);
            opacity: 0.2;
          }
          100% {
            transform: scale(1.2);
            opacity: 0;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .as-pulse {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}
