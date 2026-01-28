"use client";

import * as React from "react";
import { cn } from "@/lib/cn";
import { Badge } from "@/components/ui/Badge";
import { ArrowRight } from "lucide-react";

import type { Channel, Stage } from "./alerts-showcase/types";
import { BackgroundFX } from "./alerts-showcase/BackgroundFX";
import { SparklineMini } from "./alerts-showcase/SparklineMini";
import { RouteRail } from "./alerts-showcase/RouteRail";
import { StatusPill } from "./alerts-showcase/StatusPill";
import { MessageCard } from "./alerts-showcase/MessageCard";
import { DetailsModal } from "./alerts-showcase/DetailsModal";
import { clamp } from "./alerts-showcase/utils";

type Props = {
  className?: string;
};

const BASE_SERIES = [18, 19, 20, 22, 24, 23, 25, 27, 29, 28, 30, 31, 30, 32];
const SPIKE_SERIES = [18, 19, 20, 22, 24, 23, 25, 27, 29, 55, 72, 84, 79, 74];

export function AlertsShowcase({ className }: Props) {
  const [stage, setStage] = React.useState<Stage>("idle");
  const [confidence, setConfidence] = React.useState(0.22);
  const [spike, setSpike] = React.useState(false);
  const [incidentKey, setIncidentKey] = React.useState(1);

  const [open, setOpen] = React.useState(false);
  const [openChannel, setOpenChannel] = React.useState<Channel | null>(null);

  const timers = React.useRef<number[]>([]);
  const clearTimers = React.useCallback(() => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  }, []);

  const begin = React.useCallback(() => {
    clearTimers();
    setIncidentKey((k) => k + 1);
    setSpike(true);
    setStage("detecting");
    setConfidence(0.38);

    timers.current.push(
      window.setTimeout(() => {
        setConfidence(0.62);
        setStage("routing");
      }, 650)
    );

    timers.current.push(
      window.setTimeout(() => {
        setConfidence(0.79);
        setStage("sending");
      }, 1200)
    );

    timers.current.push(
      window.setTimeout(() => {
        setConfidence(0.91);
        setStage("delivered");
      }, 1950)
    );

    timers.current.push(
      window.setTimeout(() => {
        setSpike(false);
        setStage("idle");
        setConfidence(0.22);
      }, 5200)
    );
  }, [clearTimers]);

  React.useEffect(() => () => clearTimers(), [clearTimers]);

  React.useEffect(() => {
    if (stage === "idle") return;
    const id = window.setInterval(() => {
      setConfidence((c) => clamp(c + (Math.random() * 0.04 - 0.012), 0.28, 0.95));
    }, 280);
    return () => window.clearInterval(id);
  }, [stage]);

  const hot = stage !== "idle";

  return (
    <div
      className={cn(
        "relative aspect-16/10 w-full overflow-hidden rounded-3xl border border-white/10 bg-background/30",
        "shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_18px_80px_rgba(0,0,0,0.55)]",
        className
      )}
    >
      <BackgroundFX hot={hot} />

      <DetailsModal
        open={open}
        channel={openChannel}
        stage={stage}
        confidence={confidence}
        onClose={() => {
          setOpen(false);
          setOpenChannel(null);
        }}
      />

      <div className="relative h-full w-full">
        {/* scroll container (keeps frame safe on smaller sizes) */}
        <div className="asScroll h-full min-h-0 overflow-y-auto p-3 sm:p-4">
          {/* ✅ Rebalanced columns: sides are stronger, center slightly reduced */}
          <div className="grid gap-3 lg:grid-cols-[1.1fr_1.15fr_1.1fr]">
            {/* LEFT */}
            <div className="flex min-h-0 flex-col gap-3">
              {/* signal card stretches to balance */}
              <div className="flex-1 min-h-0 rounded-3xl border border-white/10 bg-surface/30 p-4 overflow-hidden flex flex-col">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs text-muted-foreground">Real-time signal</div>
                    <div className="mt-1 text-lg font-semibold tracking-tight text-foreground">Spend line</div>
                  </div>
                  <Badge variant={hot ? "warning" : "success"}>{hot ? "Spiking" : "Stable"}</Badge>
                </div>

                <button
                  type="button"
                  onClick={begin}
                  aria-label="Simulate spend spike"
                  className={cn(
                    "mt-4 w-full rounded-2xl border border-white/10 bg-black/20 p-3 text-left",
                    "transition-[background-color,transform] duration-200 ease-(--ease-snappy)",
                    "hover:bg-black/25 active:scale-[0.995]"
                  )}
                >
                  <SparklineMini
                    values={spike ? SPIKE_SERIES : BASE_SERIES}
                    spikeIndex={spike ? 10 : undefined}
                    hot={hot}
                  />
                  <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                    <span>09:00</span>
                    <span>13:10</span>
                    <span className={cn(hot ? "text-rose-200" : "")}>spike</span>
                    <span>Now</span>
                  </div>
                </button>

                {/* push CTA to bottom to fill space nicely */}
                <div className="mt-auto pt-4 flex items-center justify-between gap-3">
                  <div className="text-xs text-muted-foreground">Click the spike to fire alerts</div>
                  <button
                    type="button"
                    onClick={begin}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-4 py-2",
                      "text-xs font-semibold text-foreground",
                      "hover:bg-white/8 transition-[background-color,transform] duration-200 ease-(--ease-snappy)",
                      "active:scale-[0.99]"
                    )}
                  >
                    Simulate spike <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <StatusPill stage={stage} />
            </div>

            {/* MIDDLE */}
            <div className="flex min-h-0 flex-col gap-3">
              <div className="rounded-3xl border border-white/10 bg-surface/30 p-4 overflow-hidden">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs text-muted-foreground">Anomaly → Action</div>
                    <div className="mt-1 text-lg font-semibold tracking-tight text-foreground">Pipeline</div>
                  </div>
                  <Badge variant="neutral">No overlap • clean lanes</Badge>
                </div>
              </div>

              {/* RouteRail stretches so center doesn't feel like the only “full” column */}
              <div className="flex-1 min-h-0">
                <RouteRail stage={stage} confidence={confidence} />
              </div>
            </div>

            {/* RIGHT */}
            <div className="flex min-h-0 flex-col gap-3">
              {/* message cards stretch to remove dead space */}
              <MessageCard
                className="flex-1 min-h-0"
                channel="email"
                stage={stage}
                incidentKey={incidentKey}
                onOpen={() => {
                  setOpen(true);
                  setOpenChannel("email");
                }}
              />
              <MessageCard
                className="flex-1 min-h-0"
                channel="whatsapp"
                stage={stage}
                incidentKey={incidentKey}
                onOpen={() => {
                  setOpen(true);
                  setOpenChannel("whatsapp");
                }}
              />
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .asScroll::-webkit-scrollbar {
          width: 0px;
          height: 0px;
        }
        .asScroll {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }

        @keyframes asPulse {
          0% {
            transform: scale(0.9);
            opacity: 0.9;
          }
          100% {
            transform: scale(1.35);
            opacity: 0;
          }
        }
        .as-pulse {
          transform-origin: center;
          animation: asPulse 1.2s ease-out infinite;
        }

        @keyframes asPop {
          0% {
            transform: translateY(6px);
            opacity: 0;
          }
          100% {
            transform: translateY(0px);
            opacity: 1;
          }
        }
        .as-pop {
          animation: asPop 260ms ease-out both;
        }

        @media (prefers-reduced-motion: reduce) {
          .as-pulse,
          .as-pop {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}
