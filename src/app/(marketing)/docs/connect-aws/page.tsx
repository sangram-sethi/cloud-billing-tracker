import { Badge } from "@/components/ui/Badge";
import { LinkButton } from "@/components/ui/LinkButton";
import { ArrowRight, KeyRound, ShieldCheck } from "lucide-react";

function CodeBlock({ title, code }: { title: string; code: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-black/20 p-4 overflow-hidden">
      <div className="text-xs font-semibold text-foreground/90">{title}</div>
      <pre className="mt-3 overflow-auto rounded-2xl border border-white/10 bg-white/4 p-3 text-[11px] leading-relaxed text-foreground/90">
        <code>{code}</code>
      </pre>
    </div>
  );
}

export default function ConnectAWS() {
  const trustPolicy = `{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": { "AWS": "arn:aws:iam::<YOUR_ACCOUNT_ID>:root" },
      "Action": "sts:AssumeRole",
      "Condition": {
        "StringEquals": { "sts:ExternalId": "<YOUR_EXTERNAL_ID>" }
      }
    }
  ]
}`;

  const permissionsPolicy = `{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "CostExplorerRead",
      "Effect": "Allow",
      "Action": [
        "ce:GetCostAndUsage",
        "ce:GetCostForecast",
        "ce:GetDimensionValues",
        "ce:GetReservationUtilization",
        "ce:GetSavingsPlansUtilization"
      ],
      "Resource": "*"
    },
    {
      "Sid": "CloudWatchRead",
      "Effect": "Allow",
      "Action": [
        "cloudwatch:GetMetricData",
        "cloudwatch:ListMetrics"
      ],
      "Resource": "*"
    },
    {
      "Sid": "AccountRead",
      "Effect": "Allow",
      "Action": [
        "organizations:DescribeOrganization",
        "organizations:ListAccounts"
      ],
      "Resource": "*"
    }
  ]
}`;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs text-muted-foreground">Docs</div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">Connect AWS</h1>
        </div>
        <Badge variant="success">Read-only</Badge>
      </div>

      <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
        The integration is intentionally conservative: you create a dedicated IAM role with a small read-only policy.
        CloudBudgetGuard assumes the role via STS and reads billing/metrics. No write access.
      </p>

      <div className="mt-6 grid gap-3 md:grid-cols-2">
        <div className="rounded-3xl border border-white/10 bg-white/4 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <KeyRound className="h-4 w-4 text-amber-300" /> Step 1 — Create a role
          </div>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            In IAM, create a new role dedicated to CloudBudgetGuard. Use an{" "}
            <span className="text-foreground/80 font-semibold">External ID</span> for safety.
          </p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/4 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <ShieldCheck className="h-4 w-4 text-emerald-300" /> Step 2 — Attach read policy
          </div>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            Attach the smallest policy that covers Cost Explorer + CloudWatch reads. Avoid admin policies.
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-3">
        <CodeBlock title="Trust policy (use External ID)" code={trustPolicy} />
        <CodeBlock title="Permissions policy (minimum read scope)" code={permissionsPolicy} />
      </div>

      <div className="mt-6 rounded-3xl border border-white/10 bg-black/20 p-4">
        <div className="text-sm font-semibold text-foreground">What we store</div>
        <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
          <li className="flex gap-2">
            <span className="mt-2 h-1.5 w-1.5 rounded-full bg-white/20" />
            Role ARN + External ID reference (not your secrets).
          </li>
          <li className="flex gap-2">
            <span className="mt-2 h-1.5 w-1.5 rounded-full bg-white/20" />
            Aggregated billing numbers used for charts, alerts, and weekly reports.
          </li>
          <li className="flex gap-2">
            <span className="mt-2 h-1.5 w-1.5 rounded-full bg-white/20" />
            Notification preferences (email/WhatsApp toggles, sensitivity).
          </li>
        </ul>
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-white/10 bg-white/4 p-4">
        <div className="text-sm text-muted-foreground">
          Next: <span className="text-foreground/90 font-semibold">Budgets</span>
        </div>
        <div className="flex items-center gap-2">
          <LinkButton href="/docs/budgets" variant="secondary" size="sm" className="gap-2">
            Continue <ArrowRight className="h-4 w-4" />
          </LinkButton>
        </div>
      </div>
    </div>
  );
}
