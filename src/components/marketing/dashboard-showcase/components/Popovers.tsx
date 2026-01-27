import * as React from "react";
import { cn } from "@/lib/cn";
import { Badge } from "@/components/ui/Badge";
import type { PopoverKey, RegionKey } from "../types";

export function Popovers({
  popover,
  onClose,
  region,
  setRegion,
}: {
  popover: Exclude<PopoverKey, null>;
  onClose: () => void;
  region: RegionKey;
  setRegion: (r: RegionKey) => void;
}) {
  return (
    <div
      className="absolute right-4 top-[calc(100%+10px)] z-20 w-[320px]"
      role="dialog"
      aria-label="Popover"
    >
      <div
        className={cn(
          "relative isolate overflow-hidden rounded-2xl border border-white/18",
          // ✅ true glass: strong blur + saturate + enough opacity so text behind is unreadable
          "bg-black/80 supports-backdrop-filter:bg-black/60",
          "backdrop-blur-10xl backdrop-saturate-150 backdrop-brightness-110",
          "shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_40px_140px_rgba(0,0,0,0.82)]",
          "pop-in"
        )}
      >
        {/* subtle premium tint (NOT neon) */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-70 bg-linear-to-br from-violet-500/12 via-blue-500/10 to-emerald-500/8"
        />
        {/* extra veil so the grid/text never competes */}
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-black/80" />

        <div className="relative p-3">
          {popover === "alerts" ? (
            <div>
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-foreground">Alerts</div>
                <Badge variant="warning">Spike</Badge>
              </div>

              <div className="mt-3 space-y-2">
                <div className="rounded-2xl border border-white/14 bg-white/6 p-3">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-semibold text-foreground">AWS anomaly detected</div>
                    <span className="text-[11px] text-muted-foreground">13:10</span>
                  </div>
                  <div className="mt-1 text-[11px] text-muted-foreground">
                    EC2 • us-east-1 • +$184 in 20 min
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-2xl border border-white/14 bg-white/6 p-3">
                    <div className="text-[11px] text-muted-foreground">Email</div>
                    <div className="mt-1 text-xs font-semibold text-foreground">Queued</div>
                  </div>
                  <div className="rounded-2xl border border-white/14 bg-white/6 p-3">
                    <div className="text-[11px] text-muted-foreground">WhatsApp</div>
                    <div className="mt-1 text-xs font-semibold text-foreground">Standby</div>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/14 bg-white/6 p-3 text-[11px] text-muted-foreground">
                  Tip: open “Alerts” tab for triage.
                </div>
              </div>
            </div>
          ) : popover === "security" ? (
            <div>
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-foreground">Permissions</div>
                <Badge variant="success">Read-only</Badge>
              </div>

              <div className="mt-3 space-y-2">
                <div className="rounded-2xl border border-white/14 bg-white/6 p-3">
                  <div className="text-xs font-semibold text-foreground">Billing scope</div>
                  <div className="mt-1 text-[11px] text-muted-foreground">
                    Usage + cost explorer only. No write actions.
                  </div>
                </div>

                <div className="rounded-2xl border border-white/14 bg-white/6 p-3">
                  <div className="text-xs font-semibold text-foreground">Audit trail</div>
                  <div className="mt-1 text-[11px] text-muted-foreground">
                    Every rule change and alert delivery is logged.
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  className="mt-1 w-full rounded-2xl border border-white/14 bg-white/6 px-3 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-white/7 transition-colors ease-(--ease-snappy)"
                >
                  Close
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-foreground">Filters</div>
                <button
                  type="button"
                  className="text-[11px] text-muted-foreground hover:text-foreground transition-colors ease-(--ease-snappy)"
                  onClick={() => setRegion("all")}
                >
                  Reset
                </button>
              </div>

              <div className="mt-3">
                <div className="text-[11px] text-muted-foreground">Region</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {[
                    { k: "all" as const, label: "All" },
                    { k: "us-east-1" as const, label: "us-east-1" },
                    { k: "ap-south-1" as const, label: "ap-south-1" },
                    { k: "eu-west-1" as const, label: "eu-west-1" },
                  ].map((x) => (
                    <button
                      type="button"
                      key={x.k}
                      onClick={() => setRegion(x.k)}
                      className={cn(
                        "rounded-full border px-3 py-1 text-xs " +
                          "transition-[background-color,border-color,box-shadow,transform,color] duration-200 " +
                          "ease-(--ease-snappy) active:scale-[0.99]",
                        region === x.k
                          ? "border-primary/25 bg-primary/14 text-foreground shadow-[0_0_0_1px_rgba(124,58,237,0.18)]"
                          : "border-white/14 bg-white/6 text-muted-foreground hover:text-foreground hover:bg-white/7"
                      )}
                    >
                      {x.label}
                    </button>
                  ))}
                </div>

                <div className="mt-3 rounded-2xl border border-white/14 bg-white/6 p-3 text-[11px] text-muted-foreground">
                  Region filter affects services + anomalies.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
