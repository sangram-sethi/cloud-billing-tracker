import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

export default function ReportsPage() {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Reports</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Week 1 placeholder. Weekly founder report UI will land here next.
          </p>
        </div>

        <Link href="/app/connect-aws">
          <Button variant="primary">Connect AWS</Button>
        </Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle>Weekly founder report</CardTitle>
                <CardDescription>Summary of trends, movers, and anomalies</CardDescription>
              </div>
              <Badge variant="neutral">Mock</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-xl border border-border bg-surface-2 p-4">
              <p className="text-xs font-semibold text-foreground">What you’ll see</p>
              <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                <li>• Week-over-week spend change</li>
                <li>• Top services + deltas</li>
                <li>• New anomalies + suggested actions</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle>Alert history</CardTitle>
                <CardDescription>All anomalies with severity and notes</CardDescription>
              </div>
              <Badge variant="neutral">Mock</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {["EC2 spike (ap-south-1)", "NAT Gateway surge", "CloudWatch logs growth"].map((t) => (
                <div key={t} className="rounded-xl border border-border bg-surface p-4">
                  <p className="text-sm font-semibold text-foreground">{t}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Details + root-cause hints coming soon</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Link href="/app">
        <Button variant="secondary">Back to dashboard</Button>
      </Link>
    </div>
  );
}
