import { Badge } from "@/components/ui/Badge";
import { LinkButton } from "@/components/ui/LinkButton";
import { ArrowRight, BellRing, Mail, MessageCircle, CheckCircle2, Clock3 } from "lucide-react";

function Lane({
  icon,
  title,
  body,
  tone,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  tone: "primary" | "success" | "warning";
}) {
  const ring =
    tone === "success" ? "ring-emerald-500/12" : tone === "warning" ? "ring-amber-500/12" : "ring-primary/12";
  return <div className={`rounded-3xl border border-white/10 bg-white/4 p-4 ring-1 ${ring}`}>
    <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
      <span className="grid h-9 w-9 place-items-center rounded-2xl border border-white/10 bg-black/20">{icon}</span>
      {title}
    </div>
    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
  </div>;
}

function StatePill({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-xs text-muted-foreground">
      {icon}
      <span className="font-semibold text-foreground/85">{label}</span>
    </div>
  );
}

export default function AlertsDocs() {
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs text-muted-foreground">Docs</div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">Alerts</h1>
        </div>
        <Badge variant="success">Email + WhatsApp</Badge>
      </div>

      <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
        Alerts are designed as an incident pipeline: detect → enrich → route → deliver. Email carries the detail; WhatsApp is an instant ping optimized for “open this now.”
      </p>

      <div className="mt-6 grid gap-3 md:grid-cols-3">
        <Lane tone="primary" icon={<BellRing className="h-4 w-4 text-primary" />} title="Detection" body="We trigger when spend crosses thresholds or accelerates abnormally. A single incident represents one meaningful spike." />
        <Lane tone="warning" icon={<Mail className="h-4 w-4 text-amber-300" />} title="Email payload" body="Founder-friendly structure: what changed, where it happened, likely drivers, and suggested mitigation steps." />
        <Lane tone="success" icon={<MessageCircle className="h-4 w-4 text-emerald-300" />} title="WhatsApp ping" body="Short, urgent, and link-oriented. The goal is response time — not documentation." />
      </div>

      <div className="mt-6 rounded-3xl border border-white/10 bg-black/20 p-4">
        <div className="text-sm font-semibold text-foreground">Delivery states</div>
        <div className="mt-3 flex flex-wrap gap-2">
          <StatePill icon={<Clock3 className="h-4 w-4" />} label="Queued" />
          <StatePill icon={<Clock3 className="h-4 w-4 text-amber-300" />} label="Sending" />
          <StatePill icon={<CheckCircle2 className="h-4 w-4 text-emerald-300" />} label="Delivered" />
        </div>
        <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
          Each delivery channel is tracked independently. If a channel fails, we keep the incident active and surface a retry action in the console.
        </p>
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-white/10 bg-white/4 p-4">
        <div className="text-sm text-muted-foreground">
          Next: <span className="text-foreground/90 font-semibold">Reports</span>
        </div>
        <LinkButton href="/docs/reports" variant="secondary" size="sm" className="gap-2">
          Continue <ArrowRight className="h-4 w-4" />
        </LinkButton>
      </div>
    </div>
  );
}
