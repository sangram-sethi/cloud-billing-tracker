import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import {
  AlertTriangle,
  ShieldCheck,
  LineChart,
  Sparkles,
  BellRing,
  FileText,
  Plug,
  Check,
} from "lucide-react";
import { LinkButton } from "@/components/ui/LinkButton";



const features = [
  {
    icon: AlertTriangle,
    title: "Anomaly alerts",
    desc: "Detect spend spikes fast and notify instantly (email now, WhatsApp later).",
    tag: "Week 1 UI",
  },
  {
    icon: FileText,
    title: "Weekly founder report",
    desc: "One-page summary: spend trends, movers, anomalies, and action items.",
    tag: "Week 1 UI",
  },
  {
    icon: Plug,
    title: "AWS-first onboarding",
    desc: "Connect via IAM Role ARN + External ID. No long-lived access keys.",
    tag: "MVP",
  },
  {
    icon: ShieldCheck,
    title: "Security-by-default",
    desc: "Least privilege, read-only billing scope, transparent security docs.",
    tag: "MVP",
  },
  {
    icon: LineChart,
    title: "Service-level insights",
    desc: "See top AWS services by spend with deltas and quick explanations.",
    tag: "Mocked",
  },
  {
    icon: Sparkles,
    title: "AI optimization hints",
    desc: "Actionable suggestions: idle resources, log retention, SP/RIs (soon).",
    tag: "Mocked",
  },
];

export default function MarketingHomePage() {
  return (
    <div className="space-y-14">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl border border-border bg-surface p-8 shadow-sm sm:p-10">
        <div className="relative">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="neutral">AWS-only MVP</Badge>
            <Badge variant="default">Anomaly alerts</Badge>
            <Badge variant="default">Weekly founder report</Badge>
          </div>

          <h1 className="mt-5 text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
            Stop cloud bills from surprising you.
          </h1>

          <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
            Cloud Budget Guard tracks spend, flags anomalies, and sends a weekly founder-friendly summary.
            Start with AWS. Add GCP/Azure later.
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <LinkButton href="/signup" variant="primary" size="md">
              <BellRing className="h-4 w-4" />
              Get started
            </LinkButton>
            <LinkButton href="/security" variant="secondary" size="md">
              <ShieldCheck className="h-4 w-4" />
              Security model
            </LinkButton>
          </div>

          <div className="mt-7 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-border bg-surface-2 p-4">
              <p className="text-xs font-semibold text-foreground">Fast alerts</p>
              <p className="mt-1 text-sm text-muted-foreground">Catch spikes before month-end.</p>
            </div>
            <div className="rounded-xl border border-border bg-surface-2 p-4">
              <p className="text-xs font-semibold text-foreground">Founder-ready</p>
              <p className="mt-1 text-sm text-muted-foreground">Weekly summary you’ll actually read.</p>
            </div>
            <div className="rounded-xl border border-border bg-surface-2 p-4">
              <p className="text-xs font-semibold text-foreground">No access keys</p>
              <p className="mt-1 text-sm text-muted-foreground">IAM role + External ID.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Social proof / trust strip */}
      <section className="grid gap-4 lg:grid-cols-3">
        <Card className="hover:translate-y-0">
          <CardHeader>
            <CardTitle>Read-only by default</CardTitle>
            <CardDescription>Billing & cost metadata scope first</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4" />
                No long-lived access keys
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4" />
                Least privilege policy
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4" />
                External ID support
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card className="hover:translate-y-0">
          <CardHeader>
            <CardTitle>Built for small teams</CardTitle>
            <CardDescription>Startups → Enterprise-ready later</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Clean dashboards, clear alerts, and simple onboarding. Add advanced controls only when you need them.
            </p>
          </CardContent>
        </Card>

        <Card className="hover:translate-y-0">
          <CardHeader>
            <CardTitle>Open-source friendly</CardTitle>
            <CardDescription>We’ll publish it later with clean docs</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Clear setup, demo mode by default, and security reporting guidelines. (We’ll add OSS hygiene as we go.)
            </p>
          </CardContent>
        </Card>
      </section>

      {/* Features */}
      <section className="space-y-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">What you get</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Premium UX, simple workflows — and hard cost signals when something goes wrong.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <Card key={f.title} glow className="min-h-45">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <CardTitle>{f.title}</CardTitle>
                    </div>
                    <Badge variant="neutral">{f.tag}</Badge>
                  </div>
                  <CardDescription>{f.desc}</CardDescription>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="rounded-2xl border border-border bg-surface p-8 shadow-sm">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-xl font-semibold tracking-tight text-foreground">
              Ready to stop surprise bills?
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Start with AWS anomaly alerts + a weekly founder report.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <LinkButton href="/signup" variant="primary" size="md">
              Get started
            </LinkButton>
            <LinkButton href="/pricing" variant="secondary" size="md">
              View pricing
            </LinkButton>
          </div>
        </div>
      </section>
    </div>
  );
}
