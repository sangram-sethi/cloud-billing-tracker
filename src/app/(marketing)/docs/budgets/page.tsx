import { Badge } from "@/components/ui/Badge";
import { LinkButton } from "@/components/ui/LinkButton";
import { ArrowRight, Wallet, SlidersHorizontal, Shield } from "lucide-react";

function Card({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/4 p-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <span className="grid h-9 w-9 place-items-center rounded-2xl border border-white/10 bg-black/20">{icon}</span>
        {title}
      </div>
      <div className="mt-2 text-sm text-muted-foreground leading-relaxed">{children}</div>
    </div>
  );
}

export default function BudgetsDocs() {
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs text-muted-foreground">Docs</div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">Budgets</h1>
        </div>
        <Badge variant="warning">Prevent surprises</Badge>
      </div>

      <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
        Budgets define what “normal” looks like. CloudBudgetGuard uses budgets to decide when an alert is meaningful
        (and to avoid noisy alert spam).
      </p>

      <div className="mt-6 grid gap-3 md:grid-cols-3">
        <Card title="Threshold alerts" icon={<Wallet className="h-4 w-4 text-amber-300" />}>
          Simple rule: if spend crosses a defined threshold within a window, we create an incident.
        </Card>
        <Card title="Spend caps" icon={<Shield className="h-4 w-4 text-emerald-300" />}>
          Caps are “hard lines” founders love: once crossed, alerts are immediate and persistent until acknowledged.
        </Card>
        <Card title="Sensitivity" icon={<SlidersHorizontal className="h-4 w-4 text-primary" />}>
          Sensitivity controls anomaly detection. Higher means earlier warnings; lower means fewer, stronger signals.
        </Card>
      </div>

      <div className="mt-6 rounded-3xl border border-white/10 bg-black/20 p-4">
        <div className="text-sm font-semibold text-foreground">Recommended defaults</div>
        <div className="mt-3 grid gap-2 text-sm text-muted-foreground">
          <div className="flex items-start gap-2">
            <span className="mt-2 h-1.5 w-1.5 rounded-full bg-white/20" />
            Start with <span className="text-foreground/85 font-semibold">Normal</span> sensitivity. Raise it only if you prefer early warnings.
          </div>
          <div className="flex items-start gap-2">
            <span className="mt-2 h-1.5 w-1.5 rounded-full bg-white/20" />
            Set one global monthly budget, then add a smaller “blast radius” budget for high-risk services (NAT, egress, logs).
          </div>
          <div className="flex items-start gap-2">
            <span className="mt-2 h-1.5 w-1.5 rounded-full bg-white/20" />
            Keep alert routes consistent: email for detail, WhatsApp for urgency.
          </div>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-white/10 bg-white/4 p-4">
        <div className="text-sm text-muted-foreground">
          Next: <span className="text-foreground/90 font-semibold">Alerts</span>
        </div>
        <LinkButton href="/docs/alerts" variant="secondary" size="sm" className="gap-2">
          Continue <ArrowRight className="h-4 w-4" />
        </LinkButton>
      </div>
    </div>
  );
}
