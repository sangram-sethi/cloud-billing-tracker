import Link from "next/link";
import Container from "@/components/Container";

const tiers = [
  {
    name: "Starter",
    price: "₹999",
    cadence: "/month",
    blurb: "For early-stage teams who want alerts + weekly founder report.",
    features: [
      "AWS spend anomaly alerts",
      "Weekly founder report (email)",
      "1 AWS account",
      "Basic optimization tips",
    ],
    cta: "Start Starter",
    href: "/signup",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "₹2,999",
    cadence: "/month",
    blurb: "For growing startups with multiple projects and stricter budgets.",
    features: [
      "Everything in Starter",
      "Up to 5 AWS accounts",
      "Team budgets (by tags/cost centers — later)",
      "Priority support",
    ],
    cta: "Go Pro",
    href: "/signup",
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    cadence: "",
    blurb: "For enterprises needing SSO, audit trails, and custom workflows.",
    features: [
      "Unlimited AWS accounts",
      "SSO / SAML (later)",
      "Audit logs (later)",
      "Custom reports + SLAs",
    ],
    cta: "Contact us",
    href: "/contact",
    highlighted: false,
  },
];

export default function PricingPage() {
  return (
    <div>
      <section className="border-b border-zinc-200 bg-white">
        <Container className="py-14 sm:py-16">
          <div className="max-w-2xl">
            <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">
              Simple pricing that scales with your AWS usage
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-zinc-600 sm:text-base">
              Start small with anomaly alerts + a weekly founder report. Upgrade when you add more
              accounts and teams.
            </p>
          </div>
        </Container>
      </section>

      <section className="bg-zinc-50/60">
        <Container className="py-12">
          <div className="grid gap-4 lg:grid-cols-3">
            {tiers.map((t) => (
              <div
                key={t.name}
                className={[
                  "rounded-2xl border bg-white p-6 shadow-sm",
                  t.highlighted ? "border-zinc-900" : "border-zinc-200",
                ].join(" ")}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-sm font-semibold text-zinc-900">{t.name}</h2>
                    <p className="mt-1 text-sm text-zinc-600">{t.blurb}</p>
                  </div>
                  {t.highlighted ? (
                    <span className="rounded-full bg-zinc-900 px-3 py-1 text-xs font-semibold text-white">
                      Most popular
                    </span>
                  ) : null}
                </div>

                <div className="mt-6 flex items-end gap-2">
                  <div className="text-3xl font-semibold tracking-tight text-zinc-900">
                    {t.price}
                  </div>
                  <div className="pb-1 text-sm text-zinc-600">{t.cadence}</div>
                </div>

                <ul className="mt-6 space-y-3 text-sm text-zinc-700">
                  {t.features.map((f) => (
                    <li key={f} className="flex gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-zinc-900" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={t.href}
                  className={[
                    "mt-8 inline-flex w-full items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors",
                    t.highlighted
                      ? "bg-zinc-900 text-white hover:bg-zinc-800"
                      : "border border-zinc-200 text-zinc-900 hover:bg-zinc-50",
                  ].join(" ")}
                >
                  {t.cta}
                </Link>

                <p className="mt-3 text-xs text-zinc-500">
                  * WhatsApp alerts, multi-cloud (GCP/Azure), and SSO are planned for later phases.
                </p>
              </div>
            ))}
          </div>

          <div className="mt-10 rounded-2xl border border-zinc-200 bg-white p-6">
            <h3 className="text-sm font-semibold text-zinc-900">FAQ (quick)</h3>
            <div className="mt-4 grid gap-6 sm:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-zinc-900">Do you need AWS access?</p>
                <p className="mt-1 text-sm text-zinc-600">
                  Not for the UI demo. You can explore with mocked data first, then connect AWS via
                  a secure IAM role when ready.
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-900">Can I cancel anytime?</p>
                <p className="mt-1 text-sm text-zinc-600">
                  Yes. Billing and subscriptions will be added after the MVP UX is finalized.
                </p>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}
