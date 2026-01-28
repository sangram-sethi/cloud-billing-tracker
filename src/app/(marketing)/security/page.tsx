import { Container } from "@/components/Container";
import { GlowCard } from "@/components/ui/GlowCard";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { LinkButton } from "@/components/ui/LinkButton";
import {
  ArrowRight,
  Check,
  X,
  Eye,
  KeyRound,
  ShieldCheck,
  Lock,
  Database,
  FileText,
  Layers,
} from "lucide-react";

function SectionGlow({ tone = "blue" }: { tone?: "violet" | "blue" | "green" | "amber" }) {
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

function Bullet({
  tone = "success",
  children,
}: {
  tone?: "success" | "danger";
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2 text-sm text-muted-foreground">
      <span className="mt-0.5 grid h-5 w-5 place-items-center rounded-md bg-white/4">
        {tone === "success" ? (
          <Check className="h-4 w-4 text-success" />
        ) : (
          <X className="h-4 w-4 text-danger" />
        )}
      </span>
      <span className="min-w-0">{children}</span>
    </div>
  );
}

export default function SecurityPage() {
  return (
    <div>
      <section className="relative">
        <SectionGlow tone="blue" />
        <Container className="py-16">
          <div className="mx-auto max-w-3xl text-center">
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Badge variant="neutral" className="px-3 py-1.5">
                AWS-only • read-only scope
              </Badge>
              <Badge variant="success" className="px-3 py-1.5">
                No access keys
              </Badge>
              <Badge variant="neutral" className="px-3 py-1.5">
                Least-privilege posture
              </Badge>
            </div>

            <h1 className="mt-7 text-5xl font-semibold tracking-tight text-foreground sm:text-6xl">
              Security that reads like a
              <br />
              <span className="text-muted-foreground">product spec.</span>
            </h1>
            <p className="mt-6 text-base leading-relaxed text-muted-foreground">
              CloudBudgetGuard is designed to earn trust: minimal permissions, clear boundaries, and founder-ready
              transparency. We start with billing + usage metadata — and nothing else.
            </p>

            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <LinkButton href="/docs" variant="secondary" size="lg" className="gap-2">
                Read docs <FileText className="h-5 w-5" />
              </LinkButton>
              <LinkButton href="/signup" variant="primary" size="lg" className="gap-2">
                Start free <ArrowRight className="h-5 w-5" />
              </LinkButton>
            </div>
          </div>

          <div className="mt-12 grid gap-5 lg:grid-cols-3">
            {[
              {
                title: "Read-only billing scope",
                desc: "Cost + usage metadata only. No writes, no data-plane access.",
                icon: <Eye className="h-5 w-5 text-primary" />,
                tag: "Default",
                glow: "59 130 246",
              },
              {
                title: "IAM Role ARN onboarding",
                desc: "Use a dedicated role + External ID style flow (no long-lived keys).",
                icon: <KeyRound className="h-5 w-5 text-primary" />,
                tag: "Best practice",
                glow: "124 58 237",
              },
              {
                title: "Encrypted transport + storage",
                desc: "TLS in transit. Encrypted at rest. Clear retention boundaries.",
                icon: <Lock className="h-5 w-5 text-primary" />,
                tag: "Baseline",
                glow: "34 197 94",
              },
            ].map((x) => (
              <GlowCard key={x.title} glowRgb={x.glow}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span className="grid h-10 w-10 place-items-center rounded-2xl border border-white/10 bg-surface/40">
                        {x.icon}
                      </span>
                      <div>
                        <CardTitle>{x.title}</CardTitle>
                        <CardDescription>{x.desc}</CardDescription>
                      </div>
                    </div>
                    <Badge variant="neutral">{x.tag}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="rounded-2xl border border-white/10 bg-surface/30 p-4 text-sm text-muted-foreground">
                    Everything is designed to be auditable: what we read, when we read it, and how we format delivery.
                  </div>
                </CardContent>
              </GlowCard>
            ))}
          </div>

          <div className="mt-14 grid gap-5 lg:grid-cols-2">
            <GlowCard glowRgb="34 197 94">
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle>What we read</CardTitle>
                    <CardDescription>Billing + usage metadata to detect spikes and summarize cost drivers.</CardDescription>
                  </div>
                  <Badge variant="success">Allowed</Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  <Bullet>Cost Explorer style aggregates (by service / account / tag)</Bullet>
                  <Bullet>Basic utilization signals used for recommendations (metadata-level)</Bullet>
                  <Bullet>Anomaly detection inputs (spend deltas, seasonality patterns)</Bullet>
                  <Bullet>Alert preferences (channels, thresholds, cooldown windows)</Bullet>
                </div>
              </CardContent>
            </GlowCard>

            <GlowCard glowRgb="244 63 94">
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle>What we never touch</CardTitle>
                    <CardDescription>No writes. No resource data-plane operations. No secrets.</CardDescription>
                  </div>
                  <Badge variant="danger">Never</Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  <Bullet tone="danger">Creating / deleting / modifying AWS resources</Bullet>
                  <Bullet tone="danger">Reading application data (S3 objects, DB rows, queues, etc.)</Bullet>
                  <Bullet tone="danger">Storing your AWS access keys (we don’t use them)</Bullet>
                  <Bullet tone="danger">Executing commands inside your infrastructure</Bullet>
                </div>
              </CardContent>
            </GlowCard>
          </div>

          <div className="mt-14">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-xs text-muted-foreground">Onboarding</div>
                <div className="mt-1 text-2xl font-semibold tracking-tight text-foreground">Connection flow (read-only)</div>
              </div>
              <Badge variant="neutral" className="px-3 py-1.5">
                No keys • Role ARN
              </Badge>
            </div>

            <div className="mt-6 grid gap-5 lg:grid-cols-3">
              {[
                {
                  step: "01",
                  title: "Create a dedicated IAM role",
                  desc: "Least-privilege policy targeting billing/usage metadata sources.",
                  icon: <Layers className="h-4 w-4 text-primary" />,
                },
                {
                  step: "02",
                  title: "Paste Role ARN",
                  desc: "You provide the Role ARN in Settings. We never ask for access keys.",
                  icon: <KeyRound className="h-4 w-4 text-primary" />,
                },
                {
                  step: "03",
                  title: "We assume role (read-only)",
                  desc: "We pull cost deltas, detect anomalies, and format alerts — then deliver.",
                  icon: <Database className="h-4 w-4 text-primary" />,
                },
              ].map((x) => (
                <div key={x.step} className="rounded-3xl border border-white/10 bg-surface/35 p-5 backdrop-blur">
                  <div className="flex items-center justify-between">
                    <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/4 px-3 py-1.5 text-xs text-muted-foreground">
                      <span className="grid h-6 w-6 place-items-center rounded-lg bg-white/5">{x.icon}</span>
                      Step {x.step}
                    </div>
                    <ShieldCheck className="h-4 w-4 text-success" />
                  </div>
                  <div className="mt-4 text-base font-semibold text-foreground">{x.title}</div>
                  <div className="mt-2 text-sm text-muted-foreground leading-relaxed">{x.desc}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-14 rounded-3xl border border-white/10 bg-surface/25 p-10 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/4 px-4 py-2 text-xs text-muted-foreground">
              <ShieldCheck className="h-4 w-4 text-primary" />
              Transparent boundaries. Founder-grade trust.
            </div>
            <div className="mt-4 text-2xl font-semibold tracking-tight text-foreground">Want the full picture?</div>
            <div className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
              Read the docs, review privacy/terms, and start free with one user. Security is a product surface — we treat
              it that way.
            </div>

            <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <LinkButton href="/privacy" variant="secondary" size="lg" className="gap-2">
                Privacy <ArrowRight className="h-5 w-5" />
              </LinkButton>
              <LinkButton href="/terms" variant="secondary" size="lg" className="gap-2">
                Terms <ArrowRight className="h-5 w-5" />
              </LinkButton>
              <LinkButton href="/pricing" variant="primary" size="lg" className="gap-2">
                See pricing <ArrowRight className="h-5 w-5" />
              </LinkButton>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}
