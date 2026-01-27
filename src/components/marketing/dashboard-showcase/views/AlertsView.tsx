import * as React from "react";
import { cn } from "@/lib/cn";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { BellRing, CheckCircle2, ChevronRight, Mail, MessageCircle, Siren } from "lucide-react";
import type { AnomalyRow, RangeData, RangeKey } from "../types";
import { RANGE_LABEL } from "../data";

type Tone = "neutral" | "success" | "warning" | "danger";
type AlertStatus = "open" | "acked";
type Channel = "email" | "whatsapp";

type AlertItem = {
  id: string;
  time: string;
  signal: string;
  region: string;
  delta: string;
  severity: Tone;
  status: AlertStatus;
};

function rowToneBadge(t: Tone) {
  if (t === "danger") return "danger";
  if (t === "warning") return "warning";
  if (t === "success") return "success";
  return "neutral";
}

function toneGlow(t: Tone) {
  switch (t) {
    case "danger":
      return "shadow-[0_0_0_1px_rgba(244,63,94,0.10),0_18px_60px_rgba(244,63,94,0.10)]";
    case "warning":
      return "shadow-[0_0_0_1px_rgba(245,158,11,0.10),0_18px_60px_rgba(245,158,11,0.10)]";
    case "success":
      return "shadow-[0_0_0_1px_rgba(16,185,129,0.08),0_18px_60px_rgba(16,185,129,0.08)]";
    default:
      return "shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_18px_60px_rgba(0,0,0,0.45)]";
  }
}

function mapAnomalyToTone(v: AnomalyRow["v"]): Tone {
  if (v === "warning") return "warning";
  if (v === "success") return "success";
  return "neutral";
}

export function AlertsView({
  range,
  base,
  anomaliesFiltered,
}: {
  range: RangeKey;
  base: RangeData;
  anomaliesFiltered: AnomalyRow[];
}) {
  const [q, setQ] = React.useState<string>("");
  const [channel, setChannel] = React.useState<Channel>("email");
  const [onlyOpen, setOnlyOpen] = React.useState<boolean>(true);

  // ✅ Explicitly type the initializer so TS doesn't widen "open" to string
  const [alerts, setAlerts] = React.useState<AlertItem[]>(() => {
    const seeded: AlertItem[] = anomaliesFiltered.slice(0, 6).map((a, idx): AlertItem => {
      const sev: Tone = idx === 0 ? "danger" : mapAnomalyToTone(a.v);
      return {
        id: `${a.t}-${a.s}-${idx}`,
        time: a.t,
        signal: a.s,
        region: a.r,
        delta: a.d,
        severity: sev,
        status: "open",
      };
    });

    if (seeded.length) return seeded;

    return [
      {
        id: "13:10-ec2",
        time: "13:10",
        signal: "EC2 spend spike detected",
        region: "us-east-1",
        delta: "+$184",
        severity: "danger",
        status: "open",
      },
    ];
  });

  const [selected, setSelected] = React.useState<string>(alerts[0]?.id ?? "");

  const selectedItem = React.useMemo(
    () => alerts.find((a) => a.id === selected) ?? alerts[0],
    [alerts, selected]
  );

  const filtered = React.useMemo(() => {
    const qq = q.trim().toLowerCase();
    return alerts.filter((a) => {
      if (onlyOpen && a.status !== "open") return false;
      if (!qq) return true;
      return a.signal.toLowerCase().includes(qq) || a.region.toLowerCase().includes(qq) || a.delta.toLowerCase().includes(qq);
    });
  }, [alerts, q, onlyOpen]);

  function ack(id: string) {
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, status: "acked", severity: "success" } : a)));
  }

  function simulateSpike() {
    const svc = base.services[0]?.name ?? "EC2";
    const rg = base.services[0]?.region ?? "us-east-1";
    const amt = base.services[0]?.amt ?? 184;

    const now = new Date();
    const hh = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");

    const item: AlertItem = {
      id: `${hh}:${mm}-${Math.random().toString(16).slice(2)}`,
      time: `${hh}:${mm}`,
      signal: `${svc} unusual spend`,
      region: rg,
      delta: `+$${Math.max(40, Math.round(amt))}`,
      severity: "danger",
      status: "open",
    };

    setAlerts((prev) => [item, ...prev].slice(0, 10));
    setSelected(item.id);
  }

  return (
    <div className="grid h-full min-h-0 grid-rows-[auto_1fr] gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-2xl border border-white/10 bg-white/5">
            <Siren className="h-4 w-4 text-rose-300" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Alerts</div>
            <div className="text-sm font-semibold text-foreground">Live triage • {RANGE_LABEL[range]}</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search signal / region / delta…"
            className="h-9 w-60 rounded-full text-xs"
          />

          <button
            type="button"
            onClick={() => setOnlyOpen((v) => !v)}
            className={cn(
              "rounded-full border px-3 py-2 text-xs transition-colors duration-200 ease-(--ease-snappy)",
              onlyOpen
                ? "border-amber-500/25 bg-amber-500/10 text-amber-200"
                : "border-white/10 bg-white/4 text-muted-foreground hover:text-foreground hover:bg-white/5"
            )}
          >
            {onlyOpen ? "Open only" : "All"}
          </button>

          <Button variant="secondary" size="sm" onClick={simulateSpike}>
            <BellRing className="h-4 w-4 text-amber-300" />
            Simulate spike
          </Button>
        </div>
      </div>

      <div className="grid min-h-0 grid-cols-1 gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        {/* List */}
        <div className="min-h-0 overflow-hidden rounded-2xl border border-white/10 bg-surface/30">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <div className="text-sm font-semibold text-foreground">Queue</div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{filtered.length} items</span>
              <span className="h-1 w-1 rounded-full bg-white/20" />
              <span className="text-amber-200">p99 &lt; 30s</span>
            </div>
          </div>

          <div className="min-h-0 overflow-auto p-2">
            <div className="space-y-2">
              {filtered.map((a) => {
                const isSel = a.id === selected;
                return (
                  <button
                    type="button"
                    key={a.id}
                    onClick={() => setSelected(a.id)}
                    className={cn(
                      "w-full rounded-2xl border p-3 text-left transition-[transform,background-color,border-color] duration-200 ease-(--ease-snappy) active:scale-[0.995]",
                      isSel ? "border-primary/25 bg-primary/8" : "border-white/10 bg-white/4 hover:bg-white/5"
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">{a.time}</span>
                          <Badge variant={rowToneBadge(a.severity)}>{a.status === "open" ? "Open" : "Acked"}</Badge>
                        </div>
                        <div className="mt-1 clamp2 text-sm font-semibold text-foreground">{a.signal}</div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          {a.region} • <span className="text-foreground/80">{a.delta}</span>
                        </div>
                      </div>

                      <ChevronRight className="mt-1 h-4 w-4 text-muted-foreground" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <style jsx>{`
            .clamp2 {
              display: -webkit-box;
              -webkit-line-clamp: 2;
              -webkit-box-orient: vertical;
              overflow: hidden;
            }
          `}</style>
        </div>

        {/* Details */}
        <div className={cn("min-h-0 rounded-2xl border border-white/10 bg-surface/30 p-4", selectedItem ? toneGlow(selectedItem.severity) : "")}>
          {selectedItem ? (
            <>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs text-muted-foreground">Selected</div>
                  <div className="mt-1 text-sm font-semibold text-foreground">{selectedItem.signal}</div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {selectedItem.region} • {selectedItem.time} • {selectedItem.delta}
                  </div>
                </div>

                {selectedItem.status === "open" ? (
                  <Button variant="secondary" size="sm" onClick={() => ack(selectedItem.id)}>
                    <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                    Acknowledge
                  </Button>
                ) : (
                  <Badge variant="success">Resolved</Badge>
                )}
              </div>

              <div className="mt-4 rounded-2xl border border-white/10 bg-white/4 p-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-semibold text-foreground">Delivery preview</div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setChannel("email")}
                      className={cn(
                        "rounded-full border px-3 py-1 text-xs transition-colors duration-200 ease-(--ease-snappy)",
                        channel === "email"
                          ? "border-primary/25 bg-primary/10 text-foreground"
                          : "border-white/10 bg-white/4 text-muted-foreground hover:text-foreground"
                      )}
                    >
                      Email
                    </button>
                    <button
                      type="button"
                      onClick={() => setChannel("whatsapp")}
                      className={cn(
                        "rounded-full border px-3 py-1 text-xs transition-colors duration-200 ease-(--ease-snappy)",
                        channel === "whatsapp"
                          ? "border-emerald-500/25 bg-emerald-500/10 text-foreground"
                          : "border-white/10 bg-white/4 text-muted-foreground hover:text-foreground"
                      )}
                    >
                      WhatsApp
                    </button>
                  </div>
                </div>

                <div className="mt-3 rounded-2xl border border-white/10 bg-black/20 p-3">
                  <div className="flex items-center gap-2 text-xs text-foreground/90">
                    {channel === "email" ? (
                      <Mail className="h-4 w-4 text-primary" />
                    ) : (
                      <MessageCircle className="h-4 w-4 text-emerald-300" />
                    )}
                    <span className="font-semibold">{channel === "email" ? "Anomaly alert" : "Instant alert"}</span>
                    <span className="text-muted-foreground">• CloudBudgetGuard</span>
                  </div>

                  <div className="mt-2 text-xs text-muted-foreground">
                    We detected unusual spend in <span className="text-foreground/90">{selectedItem.region}</span>:{" "}
                    <span className="text-foreground/90">{selectedItem.delta}</span>. Recommended action:{" "}
                    <span className="text-foreground/90">check EC2 scale-up</span>.
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="grid h-full place-items-center text-sm text-muted-foreground">Select an alert to preview.</div>
          )}
        </div>
      </div>
    </div>
  );
}
