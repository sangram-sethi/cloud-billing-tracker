import { Container } from "@/components/Container";
import { LinkButton } from "@/components/ui/LinkButton";
import { Badge } from "@/components/ui/Badge";
import { DeviceFrame } from "@/components/DeviceFrame";
import { DemoVideo } from "@/components/DemoVideo";
import { ArrowRight, Sparkles, Shield, BellRing, LineChart } from "lucide-react";

function SectionGlow({ tone = "violet" }: { tone?: "violet" | "blue" | "green" | "red" }) {
  const map: Record<string, string> = {
    violet: "rgba(124,58,237,0.18)",
    blue: "rgba(59,130,246,0.16)",
    green: "rgba(34,197,94,0.14)",
    red: "rgba(244,63,94,0.12)",
  };

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
    >
      <div
        className="absolute -top-40 left-1/2 h-130 w-205 -translate-x-1/2 rounded-full blur-3xl"
        style={{
          background: `radial-gradient(circle at center, ${map[tone]}, transparent 60%)`,
        }}
      />
    </div>
  );
}

export default function MarketingHome() {
  return (
    <div>
      {/* HERO */}
      <section className="relative">
        <SectionGlow tone="violet" />
        <Container className="pt-16 pb-14">
          <div className="mx-auto max-w-3xl text-center">
            <div className="flex justify-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-surface/35 px-4 py-2 text-xs text-muted-foreground backdrop-blur">
                <span className="h-2 w-2 rounded-full bg-success" />
                <span className="text-foreground/90 font-semibold">CloudBudgetGuard</span>
                <span className="text-muted-foreground">•</span>
                <span>AWS-only • anomaly alerts • weekly founder report</span>
              </div>
            </div>

            <h1 className="mt-8 text-5xl font-semibold tracking-tight text-foreground sm:text-6xl">
              Stop Getting Surprised
              <br />
              <span className="text-muted-foreground">By Cloud Bills.</span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground">
              Track spend. Detect spikes. Get weekly executive summaries with suggested fixes.
              Built to feel premium — because founders judge trust by UI.
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <LinkButton href="/signup" variant="primary" size="lg" className="gap-2">
                Start Free <ArrowRight className="h-5 w-5" />
              </LinkButton>
              <LinkButton href="/pricing" variant="secondary" size="lg" className="gap-2">
                How it works <Sparkles className="h-5 w-5" />
              </LinkButton>
            </div>

            <div className="mt-10 flex items-center justify-center gap-6 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-2">
                <Shield className="h-4 w-4" /> Read-only billing scope
              </span>
              <span className="inline-flex items-center gap-2">
                <BellRing className="h-4 w-4" /> Alerts (email now, WhatsApp later)
              </span>
              <span className="inline-flex items-center gap-2">
                <LineChart className="h-4 w-4" /> Weekly founder report
              </span>
            </div>
          </div>

          {/* Demo frame */}
          <div className="mx-auto mt-14 max-w-6xl">
            <DeviceFrame>
              {/* Replace src with your real screen recording path in /public/demos */}
              <DemoVideo src="/demos/dashboard.mp4" className="aspect-video" />
            </DeviceFrame>
          </div>
        </Container>
      </section>

      {/* SECTIONS (phase-style) */}
      <section className="relative">
        <SectionGlow tone="blue" />
        <Container className="py-16">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-surface/35 px-4 py-2 text-xs text-muted-foreground backdrop-blur">
                <span className="grid h-6 w-6 place-items-center rounded-lg bg-white/5">
                  <Sparkles className="h-4 w-4 text-primary" />
                </span>
                <span className="tracking-widest text-primary">PHASE 01: ALERTS</span>
              </div>

              <h2 className="mt-6 text-4xl font-semibold tracking-tight text-foreground">
                Anomalies that actually matter.
              </h2>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                Detect spend spikes (EC2, NAT, logs), explain why it happened, and suggest next actions.
              </p>

              <ul className="mt-6 space-y-3 text-sm text-muted-foreground">
                <li className="flex items-center gap-3">
                  <span className="h-2 w-2 rounded-full bg-success" />
                  Threshold alerts + anomaly detection (AWS first)
                </li>
                <li className="flex items-center gap-3">
                  <span className="h-2 w-2 rounded-full bg-success" />
                  Root-cause hints (region, instance family, egress)
                </li>
                <li className="flex items-center gap-3">
                  <span className="h-2 w-2 rounded-full bg-success" />
                  Premium email formatting (founder-friendly)
                </li>
              </ul>
            </div>

            <DeviceFrame className="lg:translate-y-2">
              <DemoVideo src="/demos/alerts.mp4" className="aspect-16/10" />
            </DeviceFrame>
          </div>
        </Container>
      </section>
    </div>
  );
}
