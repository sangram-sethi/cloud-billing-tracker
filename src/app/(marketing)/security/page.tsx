import { Container } from "@/components/Container";
import { GlowCard } from "@/components/ui/GlowCard";
import { CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ShieldCheck, KeyRound, Eye, Database } from "lucide-react";

const items = [
  {
    title: "Read-only billing scope",
    desc: "We start with least-privilege access focused on cost + usage metadata.",
    icon: Eye,
    tag: "Recommended",
  },
  {
    title: "No access keys",
    desc: "Use IAM Role ARN + External ID. Safer posture than long-lived keys.",
    icon: KeyRound,
    tag: "Best practice",
  },
  {
    title: "Secure storage (Week 2+)",
    desc: "Encrypted at rest and in transit. Auditable connection lifecycle.",
    icon: Database,
    tag: "Planned",
  },
  {
    title: "Founder-grade transparency",
    desc: "Clear explanation of what we read and what we never touch.",
    icon: ShieldCheck,
    tag: "Core",
  },
];

export default function SecurityPage() {
  return (
    <Container className="py-16">
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-5xl font-semibold tracking-tight text-foreground">Security</h1>
        <p className="mt-5 text-base text-muted-foreground">
          Designed to look premium — and behave like a real security product.
        </p>
      </div>

      <div className="mt-12 grid gap-5 sm:grid-cols-2">
        {items.map((i) => (
          <GlowCard key={i.title} glowRgb="59 130 246">
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-2xl border border-white/10 bg-surface/40">
                    <i.icon className="h-5 w-5 text-primary" />
                  </span>
                  <div>
                    <CardTitle>{i.title}</CardTitle>
                    <CardDescription>{i.desc}</CardDescription>
                  </div>
                </div>
                <Badge variant="neutral">{i.tag}</Badge>
              </div>
            </CardHeader>

            <CardContent>
              <div className="rounded-2xl border border-white/10 bg-surface/30 p-4 text-sm text-muted-foreground">
                Details and copy-paste templates land as we wire backend + CloudFormation in Week 2.
              </div>
            </CardContent>
          </GlowCard>
        ))}
      </div>
    </Container>
  );
}
