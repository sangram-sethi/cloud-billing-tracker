import { Container } from "@/components/Container";
import { GlowCard } from "@/components/ui/GlowCard";
import { CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { LinkButton } from "@/components/ui/LinkButton";

const tiers = [
  {
    name: "Starter",
    price: "$19",
    desc: "Perfect for early-stage startups.",
    tag: "Phase 1",
    highlight: true,
  },
  {
    name: "Growth",
    price: "$49",
    desc: "More accounts + more alert rules.",
    tag: "Coming soon",
  },
  {
    name: "Enterprise",
    price: "Custom",
    desc: "SSO, audit logs, SLAs.",
    tag: "Talk to us",
  },
];

export default function PricingPage() {
  return (
    <Container className="py-16">
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-5xl font-semibold tracking-tight text-foreground">Pricing</h1>
        <p className="mt-5 text-base text-muted-foreground">
          Premium UI. Founder-grade clarity. Start AWS-only, expand later.
        </p>
      </div>

      <div className="mt-12 grid gap-5 lg:grid-cols-3">
        {tiers.map((t) => (
          <GlowCard
            key={t.name}
            glowRgb={t.highlight ? "34 197 94" : "124 58 237"}
            className={t.highlight ? "border-success/25" : undefined}
          >
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle className="text-lg">{t.name}</CardTitle>
                  <CardDescription>{t.desc}</CardDescription>
                </div>
                <Badge variant={t.highlight ? "success" : "neutral"}>{t.tag}</Badge>
              </div>
            </CardHeader>

            <CardContent className="pt-2">
              <div className="text-4xl font-semibold tracking-tight text-foreground">
                {t.price}
                {t.price !== "Custom" && <span className="text-base text-muted-foreground">/mo</span>}
              </div>

              <div className="mt-6 space-y-2 text-sm text-muted-foreground">
                <div>• AWS anomaly alerts</div>
                <div>• Weekly founder report</div>
                <div>• Budget thresholds</div>
              </div>

              <div className="mt-8">
                <LinkButton
                  href="/signup"
                  variant={t.highlight ? "primary" : "secondary"}
                  size="lg"
                  className="w-full"
                >
                  Choose {t.name}
                </LinkButton>
              </div>
            </CardContent>
          </GlowCard>
        ))}
      </div>
    </Container>
  );
}
