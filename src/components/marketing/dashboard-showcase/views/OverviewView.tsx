import * as React from "react";
import { cn } from "@/lib/cn";
import { Badge } from "@/components/ui/Badge";
import { Activity, BellRing, LineChart, Shield } from "lucide-react";
import type { RangeData, RegionKey, Service, AnomalyRow, RangeKey } from "../types";
import { fmtUsd0, toneForForecast, toneForMtd, toneForScore, toneForToday } from "../utils";
import { Sparkline } from "../components/Sparkline";
import { MetricCard } from "../components/MetricCard";
import { RANGE_LABEL } from "../data";

const BUDGET = 6000;

export function OverviewView({
  range,
  base,
  activeService,
  hotRegion,
  mtd,
  today,
  forecast,
  score,
  q,
  servicesFiltered,
  anomaliesFiltered,
  focusService,
  setFocusService,
}: {
  range: RangeKey;
  base: RangeData;
  region: RegionKey;
  activeService: string;
  hotRegion: Exclude<RegionKey, "all">;
  mtd: number;
  today: number;
  forecast: number;
  score: number;
  q: string;
  servicesFiltered: Service[];
  anomaliesFiltered: AnomalyRow[];
  focusService: string | null;
  setFocusService: (v: string | null) => void;
}) {
  const mtdTone = toneForMtd(mtd, BUDGET);
  const todayTone = toneForToday(today, base.today);
  const forecastTone = toneForForecast(forecast, BUDGET);
  const scoreTone = toneForScore(score);

  return (
    <div className="relative h-full min-h-0 overflow-hidden">
      <div className="hideScroll h-full min-h-0 overflow-y-auto pb-10 pr-1">
        <div className="grid min-h-min min-w-0 grid-rows-[auto_1fr_1fr] gap-4">
          {/* Metrics */}
          <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
            <MetricCard
              label="Spend (MTD)"
              value={fmtUsd0(mtd)}
              hint="Budget: $6,000"
              icon={<LineChart className="h-4 w-4" />}
              tone={mtdTone}
              onClick={() => setFocusService("MTD")}
              active={focusService === "MTD"}
            />
            <MetricCard
              label="Spend (Today)"
              value={fmtUsd0(today)}
              hint="Trend: +4.2%"
              icon={<Activity className="h-4 w-4" />}
              tone={todayTone}
              onClick={() => setFocusService("Today")}
              active={focusService === "Today"}
            />
            <MetricCard
              label="Forecast"
              value={fmtUsd0(forecast)}
              hint="End of month"
              icon={<BellRing className="h-4 w-4" />}
              tone={forecastTone}
              onClick={() => setFocusService("Forecast")}
              active={focusService === "Forecast"}
            />
            <MetricCard
              label="Anomaly score"
              value={score.toFixed(2)}
              hint="Model confidence"
              icon={<Shield className="h-4 w-4" />}
              tone={scoreTone}
              onClick={() => setFocusService("Score")}
              active={focusService === "Score"}
            />
          </div>

          {/* Middle row */}
          <div className="grid min-h-0 grid-cols-1 gap-4 xl:grid-cols-[1.5fr_1fr]">
            <div className="min-h-0 rounded-2xl border border-white/10 bg-surface/30 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-muted-foreground">Spend trend</div>
                  <div className="mt-1 text-sm font-semibold text-foreground">Anomaly highlighted</div>
                </div>
                <Badge variant="warning">Spike</Badge>
              </div>

              <div className="mt-3 rounded-2xl border border-white/10 bg-black/20 p-3">
                <Sparkline values={base.chart} accent={range === "7d" ? "blue" : "violet"} />
                <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>09:00</span>
                  <span className="clamp1">13:10 • {activeService} • {hotRegion}</span>
                  <span>Now</span>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-3 gap-3">
                {[
                  { k: "Top region", v: hotRegion },
                  { k: "Hot service", v: activeService },
                  { k: "Likely cause", v: "Scale-up" },
                ].map((x) => (
                  <div key={x.k} className="rounded-2xl border border-white/10 bg-white/4 px-3 py-2">
                    <div className="text-[11px] text-muted-foreground">{x.k}</div>
                    <div className="mt-0.5 text-xs font-semibold text-foreground">{x.v}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="min-h-0 rounded-2xl border border-white/10 bg-surface/30 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-muted-foreground">Top services</div>
                  <div className="mt-1 text-sm font-semibold text-foreground">{RANGE_LABEL[range]}</div>
                </div>
                <Badge variant="neutral">USD</Badge>
              </div>

              <div className="mt-4 space-y-1.5">
                {servicesFiltered.map((s) => {
                  const qq = q.trim().toLowerCase();
                  const matches = qq ? s.name.toLowerCase().includes(qq) : false;
                  const isActive = matches || focusService === s.name;

                  return (
                    <button
                      type="button"
                      key={s.name}
                      onClick={() => setFocusService(s.name)}
                      className={cn(
                        "block w-full text-left rounded-2xl border border-transparent p-2 " +
                          "transition-[background-color,border-color,transform] duration-200 " +
                          "ease-(--ease-snappy) active:scale-[0.995]",
                        isActive ? "bg-primary/8 border-primary/20" : "hover:bg-white/4"
                      )}
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-foreground/90">{s.name}</span>
                        <span className="text-muted-foreground">{fmtUsd0(s.amt)}</span>
                      </div>
                      <div className="mt-1 h-2 w-full rounded-full bg-white/6 overflow-hidden">
                        <div
                          className={cn("h-2 rounded-full", isActive ? "bg-primary/75" : "bg-white/18")}
                          style={{ width: `${s.pct}%` }}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-3 rounded-2xl border border-white/10 bg-white/4 p-3 text-xs text-muted-foreground">
                Tip: Use Filters to simulate region-specific spikes.
              </div>
            </div>
          </div>

          {/* Bottom row */}
          <div className="min-h-0 rounded-2xl border border-white/10 bg-surface/30 p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-muted-foreground">Recent anomalies</div>
                <div className="mt-1 text-sm font-semibold text-foreground">Auto-triaged</div>
              </div>
              <Badge variant="neutral">Founder-friendly</Badge>
            </div>

            <div className="mt-4 min-h-0 overflow-auto rounded-2xl border border-white/10">
              <div className="grid grid-cols-[140px_1fr_120px_120px_120px] bg-white/3 px-3 py-2 text-[11px] font-semibold text-muted-foreground">
                <span>Time</span>
                <span>Signal</span>
                <span>Region</span>
                <span>Delta</span>
                <span>Status</span>
              </div>

              <div className="divide-y divide-white/8">
                {anomaliesFiltered.map((row) => (
                  <div
                    key={row.t + row.s}
                    className={cn(
                      "grid grid-cols-[140px_1fr_120px_120px_120px] items-center px-3 py-3 text-xs",
                      row.v === "warning" ? "bg-primary/6" : "bg-transparent"
                    )}
                  >
                    <span className="text-muted-foreground">{row.t}</span>
                    <span className="text-foreground/90 clamp1">{row.s}</span>
                    <span className="text-muted-foreground">{row.r}</span>
                    <span
                      className={cn(
                        "font-semibold",
                        row.v === "warning"
                          ? "text-warning"
                          : row.v === "success"
                          ? "text-success"
                          : "text-foreground/80"
                      )}
                    >
                      {row.d}
                    </span>
                    <span>
                      <Badge variant={row.v === "warning" ? "warning" : row.v === "success" ? "success" : "neutral"}>
                        {row.st}
                      </Badge>
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <style jsx>{`
              .clamp1 {
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
              }
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
      </div>
    </div>
  );
}
