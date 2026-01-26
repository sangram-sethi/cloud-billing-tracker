import Container from "@/components/Container";

const items = [
  {
    title: "Read-only access via IAM Role",
    desc: "You’ll connect AWS using an IAM Role ARN + External ID. We use least-privilege permissions and start read-only for billing data.",
  },
  {
    title: "No long-lived AWS keys",
    desc: "We don’t ask for access keys. Role-based access helps avoid storing sensitive AWS secrets.",
  },
  {
    title: "Data minimization",
    desc: "We only need cost & usage data to detect anomalies and generate reports. No application data from your workloads.",
  },
  {
    title: "Encryption",
    desc: "Encrypt data in transit (HTTPS) and at rest (database encryption). Specific implementation will be documented in Week 2.",
  },
  {
    title: "Audit trail (planned)",
    desc: "Enterprise tier will include audit logs for admin actions and integration changes.",
  },
  {
    title: "SOC2-ready roadmap (planned)",
    desc: "We’ll align processes with SOC2 controls as we mature: access controls, change management, incident response, and vendor reviews.",
  },
];

export default function SecurityPage() {
  return (
    <div>
      <section className="border-b border-zinc-200 bg-white">
        <Container className="py-14 sm:py-16">
          <div className="max-w-2xl">
            <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">
              Security
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-zinc-600 sm:text-base">
              We’re building Cloud Budget Guard with least-privilege access and simple,
              understandable controls. Here’s what Week 1 covers and what’s planned next.
            </p>
          </div>
        </Container>
      </section>

      <section className="bg-zinc-50/60">
        <Container className="py-12">
          <div className="grid gap-4 sm:grid-cols-2">
            {items.map((x) => (
              <div
                key={x.title}
                className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm"
              >
                <h2 className="text-sm font-semibold text-zinc-900">{x.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-zinc-600">{x.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 rounded-2xl border border-zinc-200 bg-white p-6">
            <h3 className="text-sm font-semibold text-zinc-900">What we’ll need from AWS (later)</h3>
            <p className="mt-2 text-sm text-zinc-600">
              For anomaly detection we’ll typically pull AWS Cost Explorer / Cost & Usage style
              summaries. We’ll provide a copy-paste IAM policy and CloudFormation template in the
              AWS connect step.
            </p>

            <div className="mt-4 grid gap-3 text-sm text-zinc-700">
              <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3">
                <span className="font-medium">Integration method:</span> IAM Role ARN + External ID
              </div>
              <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3">
                <span className="font-medium">Scope:</span> Billing & cost metadata only
              </div>
              <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3">
                <span className="font-medium">Storage:</span> Minimal + encrypted (details in Week 2)
              </div>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}
