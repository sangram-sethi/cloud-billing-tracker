import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Check, Sparkles } from "lucide-react";
import { LinkButton } from "@/components/ui/LinkButton";

const tiers = [
  {
    name: "Starter",
    price: "₹0",
    period: "month",
    desc: "For solo founders testing spend visibility.",
    badge: "Free",
    features: [
      "Dashboard (mock now, real later)",
      "Weekly founder report (email)",
      "Basic anomaly alerts",
      "1 AWS account",
    ],
    cta: { label: "Get started", href: "/signup" },
  },
  {
    name: "Pro",
    price: "₹999",
    period: "month",
    desc: "For startups that want reliable alerts and reporting.",
    badge: "Most popular",
    highlight: true,
    features: [
      "Anomaly alerts with severity",
      "Weekly founder report",
      "AI optimization hints (phase 2)",
      "Up to 5 AWS accounts",
      "Priority email support",
    ],
    cta: { label: "Start Pro", href: "/signup" },
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    desc: "For teams needing SSO, audit logs, and approvals.",
    badge: "Talk to us",
    features: [
      "SSO / SAML (later)",
      "Audit logs (later)",
      "Custom policies + approvals (later)",
      "Multi-org support (later)",
      "Dedicated support",
    ],
    cta: { label: "Contact", href: "/security" },
  },
];

export default function PricingPage() {
  return (
    <div className="space-y-10">
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-muted-foreground" />
          <Badge variant="neutral">Pricing (MVP)</Badge>
        </div>
        <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
          Simple pricing that scales with you.
        </h1>
        <p className="max-w-2xl text-base leading-relaxed text-muted-foreground">
          Start free. Upgrade when alerts and reporting become mission-critical. (Billing and limits will
          be enforced once backend is live.)
        </p>

        {/* Toggle placeholder */}
        <div className="mt-5 inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2 text-sm">
          <span className="font-semibold text-foreground">Monthly</span>
          <span className="text-muted-foreground">/</span>
          <span className="text-muted-foreground">Annual (coming soon)</span>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        {tiers.map((t) => (
          <Card key={t.name} glow={!!t.highlight} className={t.highlight ? "border-primary/30" : ""}>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle>{t.name}</CardTitle>
                  <CardDescription>{t.desc}</CardDescription>
                </div>
                <Badge variant={t.highlight ? "default" : "neutral"}>{t.badge}</Badge>
              </div>

              <div className="mt-4">
                <div className="flex items-end gap-2">
                  <p className="text-3xl font-semibold tracking-tight text-foreground">{t.price}</p>
                  {t.period ? (
                    <p className="pb-1 text-sm text-muted-foreground">/{t.period}</p>
                  ) : null}
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {t.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-6">
                <LinkButton
                  href={t.cta.href}
                  variant={t.highlight ? "primary" : "secondary"}
                  size="md"
                  className="w-full"
                >
                  {t.cta.label}
                </LinkButton>

                <p className="mt-3 text-xs text-muted-foreground">
                  {t.name === "Enterprise"
                    ? "Enterprise features ship after MVP stabilization."
                    : "Cancel anytime. Upgrade/downgrade will be instant once backend is ready."}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="rounded-2xl border border-border bg-surface p-8 shadow-sm">
        <h2 className="text-xl font-semibold tracking-tight text-foreground">What’s included in MVP</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          AWS-only anomaly alerts + weekly founder report, with a premium UI and security-first AWS connection flow.
        </p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <LinkButton href="/signup" variant="primary" size="md">
              Start free
            </LinkButton>
            <LinkButton href="/security" variant="secondary" size="md">
              Security model
            </LinkButton>
          </div>
        </div>
      </section>
    </div>
  );
}