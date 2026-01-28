import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { LinkButton } from "@/components/ui/LinkButton";
import { ArrowRight, Shield, BellRing, LineChart } from "lucide-react";

function Step({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/4 p-4">
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-2xl border border-white/10 bg-black/20 text-sm font-black text-foreground">
          {n}
        </div>
        <div className="min-w-0">
          <div className="text-sm font-semibold text-foreground">{title}</div>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
        </div>
      </div>
    </div>
  );
}

export default function GettingStarted() {
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs text-muted-foreground">Docs</div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">Getting started</h1>
        </div>
        <Badge variant="neutral">5-min tour</Badge>
      </div>

      <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
        CloudBudgetGuard is a premium incident console for cloud spend: it detects abnormal spend acceleration, routes
        alerts, and summarizes the “so what” in a founder-readable way.
      </p>

      <div className="mt-6 grid gap-3">
        <Step
          n="01"
          title="Connect AWS (read-only)"
          body="You create a dedicated IAM role with Cost Explorer + CloudWatch read permissions only. No write access. No billing mutations."
        />
        <Step
          n="02"
          title="Define budgets + alert sensitivity"
          body="Set thresholds or caps per account/environment. Sensitivity controls how aggressive anomaly detection is—higher means more alerts."
        />
        <Step
          n="03"
          title="Alerts fire as spend accelerates"
          body="When spend spikes, we generate a clean incident payload: what changed, where, likely drivers, and suggested actions. Delivery starts with email; WhatsApp is designed as an instant ping channel."
        />
        <Step
          n="04"
          title="Weekly founder report"
          body="Every week, you get a short report: trend summary, top services, anomalies, and actionable optimization ideas—formatted to be forwarded to finance/infra without edits."
        />
      </div>

      <div className="mt-8 grid gap-3 md:grid-cols-3">
        <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Shield className="h-4 w-4 text-emerald-300" /> Read-only scope
          </div>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            We never request permissions that can modify resources or billing settings.
          </p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <BellRing className="h-4 w-4 text-amber-300" /> Alerts that matter
          </div>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            Designed to reduce spam: clear thresholds, caps, and sensible anomaly heuristics.
          </p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <LineChart className="h-4 w-4 text-primary" /> Executive reporting
          </div>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            Weekly summaries you can paste into Slack or forward to your CFO.
          </p>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-white/10 bg-white/4 p-4">
        <div className="text-sm text-muted-foreground">
          Next: <span className="text-foreground/90 font-semibold">Connect AWS</span>
        </div>
        <div className="flex items-center gap-2">
          <LinkButton href="/docs/connect-aws" variant="secondary" size="sm" className="gap-2">
            Continue <ArrowRight className="h-4 w-4" />
          </LinkButton>
          <LinkButton href="/signup" variant="primary" size="sm" className="gap-2">
            Start free <ArrowRight className="h-4 w-4" />
          </LinkButton>
        </div>
      </div>

      <p className="mt-6 text-xs text-muted-foreground">
        Want the short version? Jump to{" "}
        <Link className="text-foreground/80 hover:text-foreground" href="/docs/alerts">
          Alerts
        </Link>
        .
      </p>
    </div>
  );
}
