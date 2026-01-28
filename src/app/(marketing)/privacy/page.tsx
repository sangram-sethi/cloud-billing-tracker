import { Container } from "@/components/Container";
import { Badge } from "@/components/ui/Badge";

function Glow() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div
        className="absolute -top-40 left-1/2 h-130 w-205 -translate-x-1/2 rounded-full blur-3xl"
        style={{ background: "radial-gradient(circle at center, rgba(34,197,94,0.14), transparent 60%)" }}
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

export default function PrivacyPage() {
  return (
    <section className="relative">
      <Glow />
      <Container className="py-16">
        <div className="mx-auto max-w-3xl">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-xs text-muted-foreground">Legal</div>
              <h1 className="mt-1 text-4xl font-semibold tracking-tight text-foreground">Privacy Policy</h1>
            </div>
            <Badge variant="neutral">Last updated: Jan 2026</Badge>
          </div>

          <div className="mt-8 rounded-3xl border border-white/10 bg-surface/30 p-6">
            <p className="text-sm leading-relaxed text-muted-foreground">
              CloudBudgetGuard is built to be conservative with data. We focus on billing telemetry and delivery
              preferences so we can detect anomalies, notify you, and generate weekly summaries.
            </p>

            <H2>What we collect</H2>
            <P>
              <span className="text-foreground/85 font-semibold">Account metadata</span> (workspace name, environment labels),{" "}
              <span className="text-foreground/85 font-semibold">integration identifiers</span> (role ARN, external ID reference), and{" "}
              <span className="text-foreground/85 font-semibold">aggregated spend numbers</span> required to render dashboards, alerts, and reports.
            </P>

            <H2>What we don’t collect</H2>
            <P>
              We do not request AWS write permissions. We do not need access to your code, application data, or the contents of your AWS resources.
            </P>

            <H2>How we use information</H2>
            <P>
              We use your information to (1) compute spend trends, (2) detect anomalies, (3) send notifications through the channels you enable, and (4) generate weekly founder reports.
            </P>

            <H2>Sharing</H2>
            <P>
              We do not sell your data. We only share information with vendors required to deliver the service (for example, sending emails), and only to the extent necessary.
            </P>

            <H2>Security</H2>
            <P>
              Access is scoped to read-only billing and metrics. You can revoke access at any time by removing the IAM role trust relationship or deleting the role.
            </P>

            <H2>Contact</H2>
            <P>If you have questions, reach out via the support channel listed in the app.</P>
          </div>
        </div>
      </Container>
    </section>
  );
}
