import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

const kpis = [
  { label: "This month spend", value: "$1,842", hint: "+12% vs last month" },
  { label: "Forecast (EOM)", value: "$2,410", hint: "based on last 14 days" },
  { label: "Active alerts", value: "3", hint: "2 high, 1 medium" },
  { label: "Connected accounts", value: "0", hint: "connect AWS to go live" },
];

const topServices = [
  { name: "EC2", spend: 624, change: "+18%" },
  { name: "RDS", spend: 412, change: "+6%" },
  { name: "S3", spend: 221, change: "-3%" },
  { name: "CloudWatch", spend: 118, change: "+22%" },
  { name: "Lambda", spend: 77, change: "+4%" },
];

const anomalies = [
  {
    id: "ALRT-1042",
    severity: "High",
    title: "EC2 spend spiked in ap-south-1",
    when: "Today, 10:40",
    note: "New instance family appears (m7i.*) + higher hours.",
  },
  {
    id: "ALRT-1039",
    severity: "High",
    title: "NAT Gateway costs jumped",
    when: "Yesterday, 19:10",
    note: "Data processing up 3.2x. Check egress + VPC routing.",
  },
  {
    id: "ALRT-1033",
    severity: "Medium",
    title: "CloudWatch Logs ingestion increased",
    when: "2 days ago",
    note: "Possible debug logs left on. Consider retention policies.",
  },
];

function dollars(n: number) {
  return `$${n.toLocaleString()}`;
}

export default function AppDashboardPage() {
  const maxSpend = Math.max(...topServices.map((s) => s.spend));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Mocked data for Week 1. Connect AWS when you’re ready.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/app/connect-aws"
            className="rounded-lg bg-foreground px-3 py-2 text-sm font-semibold text-background hover:opacity-90 transition"
          >
            Connect AWS
          </Link>
          <Button type="button" variant="secondary" size="md">
            Generate report
          </Button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <Card key={k.label}>
            <CardContent className="pt-6">
              <p className="text-xs font-medium text-muted-foreground">
                {k.label}
              </p>
              <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
                {k.value}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{k.hint}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main grid */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Top services */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-start justify-between gap-4">
            <div>
              <CardTitle>Top services (month)</CardTitle>
              <CardDescription>Spend distribution by service (mock)</CardDescription>
            </div>
            <p className="text-xs text-muted-foreground">mock</p>
          </CardHeader>

          <CardContent>
            <div className="space-y-3">
              {topServices.map((s) => {
                const w = Math.max(6, Math.round((s.spend / maxSpend) * 100));
                return (
                  <div
                    key={s.name}
                    className="grid grid-cols-[120px_1fr_90px] items-center gap-3"
                  >
                    <div className="text-sm font-medium text-foreground">
                      {s.name}
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full bg-foreground"
                        style={{ width: `${w}%` }}
                      />
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-foreground">
                        {dollars(s.spend)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {s.change}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-5 rounded-xl border border-border bg-surface-2 p-4">
              <p className="text-xs font-semibold text-foreground">
                AI suggestion (mock)
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                EC2 is trending up. Check for new instance families, idle
                instances, and consider Savings Plans if usage is steady.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Alerts */}
        <Card>
          <CardHeader className="flex-row items-start justify-between gap-4">
            <div>
              <CardTitle>Recent alerts</CardTitle>
              <CardDescription>Latest anomalies detected (mock)</CardDescription>
            </div>
            <Link
              href="/app/reports"
              className="text-xs font-medium text-muted-foreground hover:text-foreground transition"
            >
              View all
            </Link>
          </CardHeader>

          <CardContent>
            <div className="space-y-3">
              {anomalies.map((a) => (
                <div
                  key={a.id}
                  className="rounded-xl border border-border bg-surface p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {a.title}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {a.when}
                      </p>
                    </div>
                    <Badge variant={a.severity === "High" ? "danger" : "warning"}>
                      {a.severity}
                    </Badge>
                  </div>

                  <p className="mt-2 text-sm text-muted-foreground">
                    {a.note}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-4 text-xs text-muted-foreground">
              Alerts will be email/WhatsApp in later phases.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
