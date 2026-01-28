import * as React from "react";
import { cn } from "@/lib/cn";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DollarSign, Lock, SlidersHorizontal, Sparkles } from "lucide-react";
import type { RangeData, RangeKey, Service } from "../types";
import { fmtUsd0, toneForForecast, toneForMtd } from "../utils";
import { ToggleRow } from "../components/ToggleRow";
import { RANGE_LABEL } from "../data";

type Tone = "neutral" | "success" | "warning" | "danger";

function barTone(t: Tone) {
  if (t === "danger") return "bg-rose-500/70";
  if (t === "warning") return "bg-amber-500/70";
  if (t === "success") return "bg-emerald-500/70";
  return "bg-white/18";
}

export function BudgetsView({
  range,
  base,
  mtd,
  forecast,
  servicesFiltered,
}: {
  range: RangeKey;
  base: RangeData;
  mtd: number;
  forecast: number;
  servicesFiltered: Service[];
}) {
  const [budget, setBudget] = React.useState<number>(6000);
  const [hardCap, setHardCap] = React.useState<boolean>(true);
  const [autoPause, setAutoPause] = React.useState<boolean>(false);
  const [founderMode, setFounderMode] = React.useState<boolean>(true);

  const mtdTone = toneForMtd(mtd, budget);
  const forecastTone = toneForForecast(forecast, budget);

  const pct = Math.min(100, Math.round((mtd / Math.max(1, budget)) * 100));
  const forecastPct = Math.min(100, Math.round((forecast / Math.max(1, budget)) * 100));

  const top = servicesFiltered.slice(0, 5);

  // ✅ No internal scroll shell here — DashboardShowcase provides the scroll viewport.
  return (
    <div className="grid min-h-min grid-rows-[auto_1fr] gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-2xl border border-white/10 bg-white/5">
            <DollarSign className="h-4 w-4 text-emerald-300" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Budgets</div>
            <div className="text-sm font-semibold text-foreground">
              Caps + guardrails • {RANGE_LABEL[range]}
            </div>
          </div>
        </div>

        <Button variant="secondary" size="sm">
          <SlidersHorizontal className="h-4 w-4 text-primary" />
          Create rule
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        {/* Left column */}
        <div className="rounded-2xl border border-white/10 bg-surface/30 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-xs text-muted-foreground">Monthly budget</div>
              <div className="mt-1 text-2xl font-semibold text-foreground">{fmtUsd0(budget)}</div>
              <div className="mt-1 text-xs text-muted-foreground">
                Slide to see Forecast shift from <span className="text-emerald-300">Good</span> →{" "}
                <span className="text-amber-300">Watch</span> → <span className="text-rose-300">Spike</span>.
              </div>
            </div>
            <Badge
              variant={forecastTone === "danger" ? "danger" : forecastTone === "warning" ? "warning" : "success"}
            >
              {forecastTone === "danger" ? "Spike" : forecastTone === "warning" ? "Watch" : "Good"}
            </Badge>
          </div>

          <div className="mt-4 rounded-2xl border border-white/10 bg-white/4 p-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">MTD</span>
              <span
                className={cn(
                  "font-semibold",
                  mtdTone === "danger" ? "text-rose-300" : mtdTone === "warning" ? "text-amber-300" : "text-emerald-300"
                )}
              >
                {fmtUsd0(mtd)} • {pct}%
              </span>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/6">
              <div className={cn("h-2 rounded-full", barTone(mtdTone))} style={{ width: `${pct}%` }} />
            </div>

            <div className="mt-3 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Forecast</span>
              <span
                className={cn(
                  "font-semibold",
                  forecastTone === "danger"
                    ? "text-rose-300"
                    : forecastTone === "warning"
                    ? "text-amber-300"
                    : "text-emerald-300"
                )}
              >
                {fmtUsd0(forecast)} • {forecastPct}%
              </span>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/6">
              <div className={cn("h-2 rounded-full", barTone(forecastTone))} style={{ width: `${forecastPct}%` }} />
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Adjust budget</span>
              <span className="text-muted-foreground">{fmtUsd0(budget)}</span>
            </div>
            <input
              type="range"
              min={2000}
              max={15000}
              step={250}
              value={budget}
              onChange={(e) => setBudget(Number(e.target.value))}
              className="mt-2 w-full accent-[color-mix(in_oklab,var(--color-primary),white_15%)]"
            />
          </div>

          <div className="mt-4 grid grid-cols-1 gap-2">
            <ToggleRow
              title="Hard cap enforcement"
              description="Auto-stop risky services when budget is exceeded."
              checked={hardCap}
              onChange={setHardCap}
              tone={forecastTone === "danger" ? "danger" : "success"}
            />
            <ToggleRow
              title="Auto-pause on anomaly"
              description="Pause spend-heavy services until triage completes."
              checked={autoPause}
              onChange={setAutoPause}
              tone={autoPause ? "warning" : "neutral"}
            />
            <ToggleRow
              title="Founder mode"
              description="Less noise, clearer recommendations, weekly report at-a-glance."
              checked={founderMode}
              onChange={setFounderMode}
              tone={founderMode ? "success" : "neutral"}
            />
          </div>
        </div>

        {/* Right column */}
        <div className="rounded-2xl border border-white/10 bg-surface/30 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-xs text-muted-foreground">Service caps</div>
              <div className="mt-1 text-sm font-semibold text-foreground">Top spend drivers</div>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Lock className="h-4 w-4 text-emerald-300" />
              Guarded
            </div>
          </div>

          <div className="mt-4 space-y-2">
            {top.map((s) => (
              <div key={s.name} className="rounded-2xl border border-white/10 bg-white/4 p-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-foreground/90">{s.name}</span>
                  <span className="text-muted-foreground">{fmtUsd0(s.amt)}</span>
                </div>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/6">
                  <div
                    className="h-2 rounded-full bg-linear-to-r from-primary/70 via-emerald-500/40 to-amber-500/30"
                    style={{ width: `${Math.min(100, s.pct)}%` }}
                  />
                </div>
                <div className="mt-2 text-[11px] text-muted-foreground">
                  Cap suggestion:{" "}
                  <span className="text-foreground/80">{fmtUsd0(Math.max(50, Math.round(s.amt * 1.2)))}</span> (auto)
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-2xl border border-white/10 bg-white/4 p-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Sparkles className="h-4 w-4 text-primary" />
              AI suggestion: move logs to cheaper storage tier when spike persists.
            </div>
          </div>

          <div className="mt-4">
            <Button variant="secondary" size="sm" className="w-full">
              Apply recommended caps
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
