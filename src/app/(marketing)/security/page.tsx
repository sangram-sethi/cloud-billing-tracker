import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ShieldCheck, KeyRound, Lock, Eye, FileText, Check, Plug } from "lucide-react";

const principles = [
  {
    icon: KeyRound,
    title: "No access keys",
    desc: "We connect using an IAM Role ARN + External ID (no long-lived keys).",
  },
  {
    icon: Eye,
    title: "Read-only by default",
    desc: "MVP scope is billing/cost metadata only. Least-privilege policies.",
  },
  {
    icon: Lock,
    title: "Secure by design",
    desc: "Principle of least privilege, clear separation of concerns, audit-friendly architecture.",
  },
];

export default function SecurityPage() {
  return (
    <div className="space-y-10">
      {/* Header */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-muted-foreground" />
          <Badge variant="neutral">Trust & Security</Badge>
        </div>

        <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
          Security model
        </h1>
        <p className="max-w-2xl text-base leading-relaxed text-muted-foreground">
          We’re building Cloud Budget Guard to be safe-by-default: least privilege, no long-lived keys,
          and transparent security docs from day one.
        </p>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/app/connect-aws"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-foreground px-4 py-2 text-sm font-semibold text-background hover:opacity-90 transition"
          >
            <Plug className="h-4 w-4" />
            Connect AWS
          </Link>
          <Link
            href="/pricing"
            className="inline-flex items-center justify-center rounded-xl border border-border bg-surface px-4 py-2 text-sm font-semibold text-foreground hover:bg-surface-2 transition"
          >
            View pricing
          </Link>
        </div>
      </section>

      {/* Principles */}
      <section className="grid gap-4 lg:grid-cols-3">
        {principles.map((p) => {
          const Icon = p.icon;
          return (
            <Card key={p.title} glow className="min-h-42.5">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <CardTitle>{p.title}</CardTitle>
                </div>
                <CardDescription>{p.desc}</CardDescription>
              </CardHeader>
            </Card>
          );
        })}
      </section>

      {/* Main trust center sections */}
      <section className="grid gap-4 lg:grid-cols-3">
        {/* Access model */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle>Access model</CardTitle>
                <CardDescription>How we connect to AWS in the MVP</CardDescription>
              </div>
              <Badge variant="default">IAM Role + External ID</Badge>
            </div>
          </CardHeader>

          <CardContent>
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>
                You create an IAM role in <span className="text-foreground font-semibold">your</span> AWS account.
                We assume it using a trusted relationship and a unique External ID.
              </p>

              <div className="rounded-xl border border-border bg-surface-2 p-4">
                <p className="text-xs font-semibold text-foreground">MVP scope (read-only)</p>
                <ul className="mt-2 space-y-1">
                  <li className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4" />
                    <span>Billing & cost metadata (e.g., cost explorer / usage signals)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4" />
                    <span>No write permissions</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4" />
                    <span>No resource-level access (EC2/S3 control) in MVP</span>
                  </li>
                </ul>
              </div>

              <p className="text-xs">
                Note: Exact policy templates + automated validation ship in Week 2.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Data handling */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <CardTitle>Data handling</CardTitle>
            </div>
            <CardDescription>What we store and what we don’t</CardDescription>
          </CardHeader>

          <CardContent>
            <div className="space-y-3 text-sm text-muted-foreground">
              <div className="rounded-xl border border-border bg-surface p-4">
                <p className="text-xs font-semibold text-foreground">We store</p>
                <p className="mt-1">
                  Connection metadata (Role ARN, generated External ID), org settings, and alert/report outputs.
                </p>
              </div>

              <div className="rounded-xl border border-border bg-surface p-4">
                <p className="text-xs font-semibold text-foreground">We don’t store</p>
                <p className="mt-1">
                  Long-lived AWS access keys. We also avoid storing sensitive resource payloads in MVP.
                </p>
              </div>

              <p className="text-xs">
                Later: audit logs, retention controls, and customer-managed encryption options.
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* How it works */}
      <section className="space-y-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">How AWS connect works</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Simple, copy-paste friendly onboarding. (Templates come next.)
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {[
            {
              n: "1",
              title: "Create IAM role",
              desc: "Use our template (coming soon) to create a read-only billing role.",
            },
            {
              n: "2",
              title: "Set External ID",
              desc: "Unique ID prevents confused-deputy attacks. Keep it secret.",
            },
            {
              n: "3",
              title: "Paste Role ARN + External ID",
              desc: "Save and we’ll validate permissions & connectivity (Week 2).",
            },
          ].map((s) => (
            <Card key={s.n} glow>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-foreground text-sm font-semibold text-background">
                    {s.n}
                  </span>
                  <CardTitle>{s.title}</CardTitle>
                </div>
                <CardDescription>{s.desc}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      {/* Roadmap */}
      <section className="rounded-2xl border border-border bg-surface p-8 shadow-sm">
        <h3 className="text-xl font-semibold tracking-tight text-foreground">Security roadmap</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          We’ll ship these after MVP stability: policy templates, validation, audit logs, and enterprise controls.
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-border bg-surface-2 p-4">
            <p className="text-sm font-semibold text-foreground">Week 2</p>
            <p className="mt-1 text-sm text-muted-foreground">
              CloudFormation template + permission validation + connection test.
            </p>
          </div>
          <div className="rounded-xl border border-border bg-surface-2 p-4">
            <p className="text-sm font-semibold text-foreground">Later</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Audit logs, SSO, org policies, retention controls, and more cloud providers.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
