import { Badge } from "@/components/ui/Badge";
import { LinkButton } from "@/components/ui/LinkButton";
import { ArrowRight, LineChart, Sparkles, ListChecks, Wrench } from "lucide-react";

function Feature({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/4 p-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <span className="grid h-9 w-9 place-items-center rounded-2xl border border-white/10 bg-black/20">{icon}</span>
        {title}
      </div>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
    </div>
  );
}

export default function ReportsDocs() {
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs text-muted-foreground">Docs</div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">Reports</h1>
        </div>
        <Badge variant="neutral">Weekly founder report</Badge>
      </div>

      <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
        The report is intentionally short: what happened, what changed, and what you should do next. It’s formatted to be forwarded without edits.
      </p>

      <div className="mt-6 grid gap-3 md:grid-cols-2">
        <Feature icon={<LineChart className="h-4 w-4 text-primary" />} title="Spend summary" body="Week-over-week trend, top services, and a clean breakdown by account/environment." />
        <Feature icon={<ListChecks className="h-4 w-4 text-emerald-300" />} title="Incidents recap" body="A list of anomalies that fired, what triggered them, and whether they were acknowledged." />
        <Feature icon={<Wrench className="h-4 w-4 text-amber-300" />} title="Actionable optimizations" body="Founder-readable suggestions: right-size, commit discounts, egress controls, log retention, and more." />
        <Feature icon={<Sparkles className="h-4 w-4 text-primary" />} title="Premium formatting" body="Designed to look credible: tight hierarchy, clear numbers, and minimal visual noise." />
      </div>

      <div className="mt-6 rounded-3xl border border-white/10 bg-black/20 p-4">
        <div className="text-sm font-semibold text-foreground">Tip</div>
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
          Use the report as a weekly ritual: forward it to whoever owns infra, and track “top drivers” over time. That single habit prevents most surprise bills.
        </p>
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-white/10 bg-white/4 p-4">
        <div className="text-sm text-muted-foreground">
          Next: <span className="text-foreground/90 font-semibold">Pricing</span>
        </div>
        <LinkButton href="/pricing" variant="secondary" size="sm" className="gap-2">
          View pricing <ArrowRight className="h-4 w-4" />
        </LinkButton>
      </div>
    </div>
  );
}
