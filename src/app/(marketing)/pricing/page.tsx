"use client";

import * as React from "react";
import { Container } from "@/components/Container";
import { GlowCard } from "@/components/ui/GlowCard";
import { CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { LinkButton } from "@/components/ui/LinkButton";
import { cn } from "@/lib/cn";
import { ArrowRight, Check, CreditCard, ShieldCheck, Sparkles, Users } from "lucide-react";

type Billing = "monthly" | "annual";

function SectionGlow({ tone = "violet" }: { tone?: "violet" | "blue" | "green" | "amber" }) {
  const map: Record<string, string> = {
    violet: "rgba(124,58,237,0.18)",
    blue: "rgba(59,130,246,0.16)",
    green: "rgba(34,197,94,0.14)",
    amber: "rgba(245,158,11,0.12)",
  };

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div
        className="absolute -top-44 left-1/2 h-130 w-205 -translate-x-1/2 rounded-full blur-3xl"
        style={{ background: `radial-gradient(circle at center, ${map[tone]}, transparent 60%)` }}
      />
    </div>
  );
}

function Money({ value, period }: { value: string; period: Billing }) {
  return (
    <div className="flex items-end gap-2">
      <div className="text-4xl font-semibold tracking-tight text-foreground">{value}</div>
      {value !== "Custom" ? (
        <div className="pb-1 text-sm text-muted-foreground">/{period === "monthly" ? "mo" : "yr"}</div>
      ) : null}
    </div>
  );
}

function Feature({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 text-sm text-muted-foreground">
      <span className="mt-0.5 grid h-5 w-5 place-items-center rounded-md bg-white/4">
        <Check className="h-4 w-4 text-success" />
      </span>
      <span className="min-w-0">{children}</span>
    </div>
  );
}

const tiers = [
  {
    name: "Free",
    tag: "Free for 1 user",
    glowRgb: "34 197 94",
    highlight: false,
    monthly: "$0",
    annual: "$0",
    subtitle: "For solo founders validating spend discipline.",
    bullets: [
      "1 user account (single seat)",
      "1 AWS account connection",
      "Budgets + basic anomaly alerts",
      "Weekly founder report (lite)",
      "Email alerts",
    ],
    cta: { label: "Start free", href: "/signup", variant: "secondary" as const },
    footnote: "No credit card. Upgrade when you add seats.",
  },
  {
    name: "Pro",
    tag: "Most popular",
    glowRgb: "124 58 237",
    highlight: true,
    monthly: "$29",
    annual: "$290",
    subtitle: "For teams that need fast, founder-ready alerts.",
    bullets: [
      "Up to 5 user accounts",
      "Up to 5 AWS accounts",
      "Advanced anomaly routing (policy + cooldown)",
      "Email + WhatsApp delivery pipeline",
      "90-day retention for spend insights",
    ],
    cta: { label: "Go Pro", href: "/signup", variant: "primary" as const },
    footnote: "Annual includes 2 months free.",
  },
  {
    name: "Business",
    tag: "Scale",
    glowRgb: "59 130 246",
    highlight: false,
    monthly: "$99",
    annual: "$990",
    subtitle: "For multi-team visibility + governance.",
    bullets: [
      "Up to 25 user accounts",
      "Unlimited AWS accounts",
      "Workspace-level controls",
      "Audit-friendly alert history export",
      "Priority support + onboarding review",
    ],
    cta: { label: "Start Business", href: "/signup", variant: "secondary" as const },
    footnote: "Need SSO + SLA? We’ll do custom enterprise.",
  },
] as const;

export default function PricingPage() {
  const [billing, setBilling] = React.useState<Billing>("monthly");

  return (
    <div>
      <section className="relative">
        <SectionGlow tone="violet" />
        <Container className="py-16">
          <div className="mx-auto max-w-3xl text-center">
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Badge variant="success" className="px-3 py-1.5">
                Free for 1 user
              </Badge>
              <Badge variant="neutral" className="px-3 py-1.5">
                AWS-only • read-only scope
              </Badge>
              <Badge variant="neutral" className="px-3 py-1.5">
                Founder report included
              </Badge>
            </div>

            <h1 className="mt-7 text-5xl font-semibold tracking-tight text-foreground sm:text-6xl">
              Pricing that stays
              <br />
              <span className="text-muted-foreground">honest under pressure.</span>
            </h1>
            <p className="mt-6 text-base leading-relaxed text-muted-foreground">
              Start solo for free. Pay when your team needs multi-seat workflows and faster, richer alert routing.
            </p>

            <div className="mt-8 inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/4 p-1 backdrop-blur">
              <button
                type="button"
                onClick={() => setBilling("monthly")}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-semibold transition-colors",
                  billing === "monthly"
                    ? "bg-white/8 text-foreground border border-white/10"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setBilling("annual")}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-semibold transition-colors",
                  billing === "annual"
                    ? "bg-white/8 text-foreground border border-white/10"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Annual
                <span className="ml-2 rounded-full border border-success/25 bg-success/10 px-2 py-0.5 text-[11px] font-semibold text-success">
                  2 months free
                </span>
              </button>
            </div>
          </div>

          <div className="mt-12 grid gap-5 lg:grid-cols-3">
            {tiers.map((t) => {
              const price = billing === "monthly" ? t.monthly : t.annual;
              return (
                <GlowCard
                  key={t.name}
                  glowRgb={t.glowRgb}
                  className={cn(t.highlight ? "border-primary/20" : undefined, "flex h-full flex-col")}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <CardTitle className="text-lg">{t.name}</CardTitle>
                        <CardDescription>{t.subtitle}</CardDescription>
                      </div>
                      <Badge variant={t.highlight ? "success" : "neutral"}>{t.tag}</Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-0">
                    <Money value={price} period={billing} />

                    <div className="mt-6 space-y-2">
                      {t.bullets.map((b) => (
                        <Feature key={b}>{b}</Feature>
                      ))}
                    </div>
                  </CardContent>

                  <CardFooter className="mt-auto flex-col items-stretch gap-3">
                    <LinkButton href={t.cta.href} variant={t.cta.variant} size="lg" className="w-full">
                      {t.cta.label} <ArrowRight className="h-4 w-4" />
                    </LinkButton>
                    <div className="text-center text-[11px] text-muted-foreground">{t.footnote}</div>
                  </CardFooter>
                </GlowCard>
              );
            })}
          </div>

          <div className="mt-10 grid gap-4 lg:grid-cols-3">
            {[
              {
                icon: <Users className="h-4 w-4 text-foreground/90" />,
                title: "Seats are simple",
                desc: "Free covers 1 user account. Upgrades unlock more seats — no hidden ‘workspace’ math.",
              },
              {
                icon: <ShieldCheck className="h-4 w-4 text-foreground/90" />,
                title: "Read-only by default",
                desc: "We don’t write to AWS. We read billing + usage metadata with least-privilege scope.",
              },
              {
                icon: <CreditCard className="h-4 w-4 text-foreground/90" />,
                title: "No surprise upsells",
                desc: "Your tier is your boundary. You can grow when the product earns it.",
              },
            ].map((x) => (
              <div key={x.title} className="rounded-2xl border border-white/10 bg-surface/35 px-4 py-4 backdrop-blur">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 grid h-8 w-8 place-items-center rounded-xl border border-white/10 bg-white/4">
                    {x.icon}
                  </span>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-foreground">{x.title}</div>
                    <div className="mt-1 text-xs text-muted-foreground leading-relaxed">{x.desc}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-14">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-xs text-muted-foreground">FAQ</div>
                <div className="mt-1 text-2xl font-semibold tracking-tight text-foreground">Common questions</div>
              </div>
              <Badge variant="neutral" className="px-3 py-1.5">
                Pricing is early-stage
              </Badge>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              {[
                {
                  q: "What does ‘1 user account’ mean?",
                  a: "A user account is one login/seat. Free includes a single seat. Pro/Business unlock additional team seats.",
                },
                {
                  q: "Do you need AWS access keys?",
                  a: "No. The intended flow is IAM Role ARN + External ID. Read-only scope for billing/usage metadata.",
                },
                {
                  q: "What happens when spend spikes?",
                  a: "We detect the anomaly, format a founder-friendly summary, and route delivery to your enabled channels (Email; WhatsApp on paid tiers).",
                },
                {
                  q: "Can I start free and upgrade later?",
                  a: "Yes. Start on Free with one seat. When you add team members or need richer delivery/routing, upgrade in minutes.",
                },
              ].map((x) => (
                <GlowCard key={x.q} glowRgb="245 158 11">
                  <CardHeader>
                    <CardTitle className="text-base">{x.q}</CardTitle>
                    <CardDescription>{x.a}</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="rounded-2xl border border-white/10 bg-surface/30 p-4 text-sm text-muted-foreground">
                      If you need enterprise requirements (SSO, SLA, custom retention), we’ll scope it as a custom plan.
                    </div>
                  </CardContent>
                </GlowCard>
              ))}
            </div>

            <div className="mt-10 flex flex-col items-center justify-center gap-3 rounded-3xl border border-white/10 bg-surface/25 p-10 text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/4 px-4 py-2 text-xs text-muted-foreground">
                <Sparkles className="h-4 w-4 text-primary" />
                Founder-grade clarity, end-to-end.
              </div>
              <div className="text-2xl font-semibold tracking-tight text-foreground">Ready to stop surprise bills?</div>
              <div className="max-w-xl text-sm text-muted-foreground">
                Start free with one seat. When your team grows, your alerts and reporting grow with you.
              </div>
              <div className="mt-2 flex flex-col gap-3 sm:flex-row">
                <LinkButton href="/signup" variant="primary" size="lg" className="gap-2">
                  Start free <ArrowRight className="h-5 w-5" />
                </LinkButton>
                <LinkButton href="/security" variant="secondary" size="lg" className="gap-2">
                  Read security <ShieldCheck className="h-5 w-5" />
                </LinkButton>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}
