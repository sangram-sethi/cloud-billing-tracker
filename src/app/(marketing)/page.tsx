import Link from "next/link";
import Container from "@/components/Container";

const features = [
  {
    title: "Anomaly alerts (AWS-only, v1)",
    desc: "Get notified when spend patterns spike unexpectedly—before the bill surprises you.",
  },
  {
    title: "Weekly founder report",
    desc: "A clean summary of cost trends, biggest movers, and what changed this week.",
  },
  {
    title: "Optimization suggestions",
    desc: "Actionable, human-readable tips (right-sizing, idle resources, weird usage patterns).",
  },
  {
    title: "Budget guardrails",
    desc: "Set thresholds per account/team and stay on top of burn rate.",
  },
];

export default function MarketingHomePage() {
  return (
    <div>
      {/* Hero */}
      <section className="border-b border-zinc-200">
        <Container className="py-16 sm:py-20">
          <div className="max-w-2xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-zinc-200 px-3 py-1 text-xs font-medium text-zinc-700">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              AWS-only MVP · Anomaly alerts + weekly report
            </p>

            <h1 className="mt-6 text-4xl font-semibold tracking-tight text-zinc-900 sm:text-5xl">
              Stop surprise AWS bills.
              <span className="text-zinc-600"> Get alerts and a weekly founder report.</span>
            </h1>

            <p className="mt-4 text-base leading-relaxed text-zinc-600 sm:text-lg">
              Cloud Budget Guard tracks your AWS spend, flags anomalies early, and gives clear
              optimization steps—so startups don’t get wrecked by sudden spikes.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href="/app"
                className="inline-flex items-center justify-center rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800 transition-colors"
              >
                Get started
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center justify-center rounded-lg border border-zinc-200 px-4 py-2.5 text-sm font-semibold text-zinc-900 hover:bg-zinc-50 transition-colors"
              >
                View pricing
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap gap-3 text-xs text-zinc-600">
              <span className="rounded-full border border-zinc-200 px-3 py-1">No credit card for MVP</span>
              <span className="rounded-full border border-zinc-200 px-3 py-1">SOC2-ready roadmap</span>
              <span className="rounded-full border border-zinc-200 px-3 py-1">Founder-friendly UI</span>
            </div>
          </div>
        </Container>
      </section>

      {/* Social proof placeholder */}
      <section>
        <Container className="py-10">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-zinc-600">
              Trusted by early-stage teams (placeholder)
            </p>
            <div className="flex flex-wrap gap-3">
              {["Startup A", "Studio B", "SaaS C", "Agency D"].map((name) => (
                <span
                  key={name}
                  className="rounded-lg border border-zinc-200 px-3 py-2 text-xs font-medium text-zinc-700"
                >
                  {name}
                </span>
              ))}
            </div>
          </div>
        </Container>
      </section>

      {/* Features */}
      <section className="border-y border-zinc-200 bg-zinc-50/60">
        <Container className="py-14">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-semibold tracking-tight text-zinc-900">
              Everything you need for Week 1
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-zinc-600">
              We’ll ship the marketing pages + app shell + mocked dashboard + AWS connect UI first,
              then wire backend in Week 2.
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {features.map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm"
              >
                <h3 className="text-sm font-semibold text-zinc-900">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-600">{f.desc}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Bottom CTA */}
      <section>
        <Container className="py-16">
          <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm sm:p-10">
            <div className="max-w-2xl">
              <h3 className="text-2xl font-semibold tracking-tight text-zinc-900">
                Ready to see your AWS spend clearly?
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-600">
                Start with mocked data today. Connect AWS securely when you’re ready.
              </p>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/app"
                  className="inline-flex items-center justify-center rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800 transition-colors"
                >
                  Open dashboard
                </Link>
                <Link
                  href="/security"
                  className="inline-flex items-center justify-center rounded-lg border border-zinc-200 px-4 py-2.5 text-sm font-semibold text-zinc-900 hover:bg-zinc-50 transition-colors"
                >
                  Security details
                </Link>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}
