"use client";

import * as React from "react";
import { cn } from "@/lib/cn";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import {
  BellRing,
  ChevronDown,
  LineChart,
  Search,
  Shield,
  SlidersHorizontal,
} from "lucide-react";

import type { PopoverKey, RangeKey, RegionKey, View, RangeData } from "./types";
import { RANGE_DATA, RANGE_LABEL } from "./data";
import { clamp, pillClass } from "./utils";
import { IconButton } from "./components/IconButton";
import { Popovers } from "./components/Popovers";

import { OverviewView } from "./views/OverviewView";
import { AlertsView } from "./views/AlertsView";
import { BudgetsView } from "./views/BudgetsView";
import { ReportsView } from "./views/ReportsView";
import { SettingsView } from "./views/SettingsView";


export function DashboardShowcase({ className }: { className?: string }) {
  const rootRef = React.useRef<HTMLDivElement | null>(null);

  const [view, setView] = React.useState<View>("overview");
  const [range, setRange] = React.useState<RangeKey>("24h");
  const [isLive, setIsLive] = React.useState<boolean>(true);
  const [q, setQ] = React.useState<string>("");
  const [region, setRegion] = React.useState<RegionKey>("all");
  const [popover, setPopover] = React.useState<PopoverKey>(null);
  const [focusService, setFocusService] = React.useState<string | null>(null);

  const base = React.useMemo<RangeData>(() => RANGE_DATA[range], [range]);

  const [mtd, setMtd] = React.useState<number>(base.mtd);
  const [today, setToday] = React.useState<number>(base.today);
  const [forecast, setForecast] = React.useState<number>(base.forecast);
  const [score, setScore] = React.useState<number>(base.score);

  React.useEffect(() => {
    setMtd(base.mtd);
    setToday(base.today);
    setForecast(base.forecast);
    setScore(base.score);
    setFocusService(null);
  }, [base]);

  React.useEffect(() => {
    if (!isLive) return;

    const id = window.setInterval(() => {
      setToday((v) => clamp(v + (Math.random() * 10 - 2), 0, 99999));
      setMtd((v) => clamp(v + (Math.random() * 6 - 1), 0, 999999));
      setForecast((v) => clamp(v + (Math.random() * 7 - 3), 0, 999999));
      setScore((v) => clamp(v + (Math.random() * 0.06 - 0.03), 0.1, 0.99));
    }, 1400);

    return () => window.clearInterval(id);
  }, [isLive]);

  React.useEffect(() => {
    function onDown(e: PointerEvent) {
      if (!rootRef.current) return;
      const t = e.target as Node;
      if (!rootRef.current.contains(t)) setPopover(null);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setPopover(null);
    }
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  const servicesFiltered = base.services
    .filter((s) => (region === "all" ? true : s.region === region))
    .filter((s) => {
      const qq = q.trim().toLowerCase();
      if (!qq) return true;
      return s.name.toLowerCase().includes(qq);
    });

  const anomaliesFiltered = base.anomalies.filter((a) =>
    region === "all" ? true : a.r === region
  );

  const activeService =
    focusService ?? (servicesFiltered[0]?.name ?? base.services[0]?.name ?? "EC2");

  const hotRegion: Exclude<RegionKey, "all"> = region === "all" ? "us-east-1" : region;

  function cycleRange() {
    setPopover(null);
    setRange((r) => (r === "24h" ? "7d" : r === "7d" ? "30d" : "24h"));
  }

  function togglePopover(next: Exclude<PopoverKey, null>) {
    setPopover((p) => (p === next ? null : next));
  }

  return (
    <div
      ref={rootRef}
      className={cn(
        "relative aspect-video w-full overflow-hidden rounded-3xl border border-white/10 bg-background/30",
        "shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_18px_80px_rgba(0,0,0,0.55)]",
        className
      )}
    >
      {/* Full-bleed texture */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          background:
            "radial-gradient(900px circle at 18% 0%, rgba(124,58,237,0.18), transparent 55%)," +
            "radial-gradient(760px circle at 88% 22%, rgba(59,130,246,0.14), transparent 55%)," +
            "radial-gradient(820px circle at 70% 92%, rgba(34,197,94,0.06), transparent 60%)," +
            "linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px)," +
            "linear-gradient(to bottom, rgba(255,255,255,0.04) 1px, transparent 1px)",
          backgroundSize: "auto, auto, auto, 64px 64px, 64px 64px",
        }}
      />

      {/* ✅ Scrim: use a non-focusable DIV (fixes weird top highlight) */}
      {popover ? (
        <div
          aria-hidden
          onPointerDown={() => setPopover(null)}
          className="absolute inset-0 z-5 bg-black/18"
        />
      ) : null}

      <div className="relative z-6 grid h-full w-full grid-cols-[220px_1fr]">
        {/* Sidebar */}
        <aside className="flex h-full flex-col gap-4 border-r border-white/10 bg-surface/35 px-4 py-4">
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-2xl bg-white/5 ring-1 ring-white/10">
              <LineChart className="h-5 w-5 text-primary" />
            </span>
            <div className="leading-tight">
              <div className="text-sm font-semibold text-foreground">CloudBudgetGuard</div>
              <div className="text-[11px] text-muted-foreground">AWS billing</div>
            </div>
          </div>

          <nav className="space-y-1">
            {[
              { label: "Overview", key: "overview" as const },
              { label: "Alerts", key: "alerts" as const },
              { label: "Budgets", key: "budgets" as const },
              { label: "Reports", key: "reports" as const },
              { label: "Settings", key: "settings" as const },
            ].map((item) => {
              const active = view === item.key;
              return (
                <button
                  type="button"
                  key={item.key}
                  onClick={() => {
                    setPopover(null);
                    setView(item.key);
                  }}
                  className={cn(
                    "group flex w-full items-center justify-between rounded-2xl px-3 py-2 text-sm " +
                      "transition-[background-color,border-color,transform,color] duration-200 " +
                      "ease-(--ease-snappy) active:scale-[0.995]",
                    active
                      ? "bg-white/6 text-foreground ring-1 ring-white/10"
                      : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                  )}
                >
                  <span>{item.label}</span>
                  <span
                    className={cn(
                      "h-2 w-2 rounded-full transition-[background-color,box-shadow] duration-200 ease-(--ease-snappy)",
                      active
                        ? "bg-primary/85 shadow-[0_0_0_6px_rgba(124,58,237,0.12)]"
                        : "bg-white/10 group-hover:bg-white/16"
                    )}
                  />
                </button>
              );
            })}
          </nav>

          <div className="mt-auto space-y-3">
            <div className="rounded-2xl border border-white/10 bg-white/4 p-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-muted-foreground">Connected</span>
                <Badge variant="success" className="px-2 py-0.5">
                  AWS ✓
                </Badge>
              </div>
              <div className="mt-2 text-xs text-muted-foreground">Read-only billing scope</div>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
              <Shield className="h-4 w-4 text-success/90" />
              Audit trail enabled
            </div>
          </div>
        </aside>

        {/* Main */}
        <section className="flex h-full flex-col">
          {/* Top bar */}
          <div className="relative flex items-center gap-3 border-b border-white/10 bg-surface/25 px-4 py-3">
            <button type="button" className={pillClass(false)} onClick={() => setPopover(null)}>
              Acme Inc • Prod <ChevronDown className="h-3.5 w-3.5" />
            </button>

            <div className="hidden w-[320px] lg:block">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search services… (try EC2)"
                  className="h-9 rounded-full pl-9 pr-3 text-xs"
                />
              </div>
            </div>

            <div className="ml-auto flex items-center gap-2">
              <button type="button" className={pillClass(true)} onClick={cycleRange}>
                {RANGE_LABEL[range]}
              </button>

              <button
                type="button"
                className={pillClass(isLive)}
                onClick={() => setIsLive((v) => !v)}
              >
                <span className={cn("h-2 w-2 rounded-full", isLive ? "bg-success animate-pulse" : "bg-white/20")} />
                {isLive ? "Live" : "Paused"}
              </button>

              {/* ✅ colored icons */}
              <IconButton
                label="Alerts"
                tone="violet"
                active={popover === "alerts"}
                onClick={() => togglePopover("alerts")}
              >
                <BellRing className="h-4 w-4" />
              </IconButton>

              <IconButton
                label="Security"
                tone="green"
                active={popover === "security"}
                onClick={() => togglePopover("security")}
              >
                <Shield className="h-4 w-4" />
              </IconButton>

              <IconButton
                label="Filters"
                tone="blue"
                active={popover === "filters"}
                onClick={() => togglePopover("filters")}
              >
                <SlidersHorizontal className="h-4 w-4" />
              </IconButton>
            </div>

            {popover ? (
              <Popovers
                popover={popover}
                onClose={() => setPopover(null)}
                region={region}
                setRegion={setRegion}
              />
            ) : null}
          </div>
{/* Views */}
<div className="min-h-0 flex-1 p-4">
  {view === "overview" ? (
    <OverviewView
      range={range}
      base={base}
      region={region}
      activeService={activeService}
      hotRegion={hotRegion}
      mtd={mtd}
      today={today}
      forecast={forecast}
      score={score}
      q={q}
      servicesFiltered={servicesFiltered}
      anomaliesFiltered={anomaliesFiltered}
      focusService={focusService}
      setFocusService={setFocusService}
    />
  ) : view === "alerts" ? (
    <AlertsView range={range} base={base} anomaliesFiltered={anomaliesFiltered} />
  ) : view === "budgets" ? (
    <BudgetsView
      range={range}
      base={base}
      mtd={mtd}
      forecast={forecast}
      servicesFiltered={servicesFiltered}
    />
  ) : view === "reports" ? (
    <ReportsView range={range} base={base} mtd={mtd} forecast={forecast} />
  ) : (
    <SettingsView />
  )}
</div>
        </section>
      </div>

      <style jsx>{`
        .pop-in {
          animation: popIn 170ms var(--ease-snappy) both;
        }
        @keyframes popIn {
          from {
            opacity: 0;
            transform: translateY(-6px) scale(0.98);
            filter: blur(2px);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
            filter: blur(0);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .pop-in {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}
