import { Container } from "@/components/Container";
import { Badge } from "@/components/ui/Badge";

function Glow() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div
        className="absolute -top-40 left-1/2 h-130 w-205 -translate-x-1/2 rounded-full blur-3xl"
        style={{ background: "radial-gradient(circle at center, rgba(124,58,237,0.18), transparent 60%)" }}
      />
    </div>
  );
}

function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="mt-10 text-lg font-semibold text-foreground">{children}</h2>;
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{children}</p>;
}

export default function TermsPage() {
  return (
    <section className="relative">
      <Glow />
      <Container className="py-16">
        <div className="mx-auto max-w-3xl">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-xs text-muted-foreground">Legal</div>
              <h1 className="mt-1 text-4xl font-semibold tracking-tight text-foreground">Terms of Service</h1>
            </div>
            <Badge variant="neutral">Last updated: Jan 2026</Badge>
          </div>

          <div className="mt-8 rounded-3xl border border-white/10 bg-surface/30 p-6">
            <p className="text-sm leading-relaxed text-muted-foreground">
              These terms govern your use of CloudBudgetGuard. By using the service, you agree to these terms.
            </p>

            <H2>Service description</H2>
            <P>
              CloudBudgetGuard provides spend tracking, anomaly detection alerts, and weekly summaries based on read-only billing and metrics access.
            </P>

            <H2>Your responsibilities</H2>
            <P>
              You are responsible for configuring the integration, maintaining access credentials on your side, and ensuring your use complies with applicable laws and your cloud provider’s terms.
            </P>

            <H2>Security + permissions</H2>
            <P>
              The integration is designed for read-only access. You control the IAM role and may revoke access at any time.
            </P>

            <H2>Availability</H2>
            <P>
              We aim for high availability, but the service may experience interruptions (maintenance, third-party outages, connectivity issues). Alerts are “best effort” and depend on upstream data.
            </P>

            <H2>Limitations</H2>
            <P>
              CloudBudgetGuard is an advisory tool. You remain responsible for your cloud configuration and costs. We do not guarantee savings or that all anomalies will be detected.
            </P>

            <H2>Termination</H2>
            <P>
              You may stop using the service at any time. On termination, you should revoke the integration role to immediately end access.
            </P>

            <H2>Contact</H2>
            <P>Questions about these terms can be sent through the support channel listed in the app.</P>
          </div>
        </div>
      </Container>
    </section>
  );
}
