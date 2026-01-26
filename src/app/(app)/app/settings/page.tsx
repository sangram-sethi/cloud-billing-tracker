import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

const blocks = [
  {
    title: "Budgets",
    desc: "Set monthly thresholds and burn-rate alerts.",
    tag: "Coming soon",
  },
  {
    title: "Notifications",
    desc: "Email now, WhatsApp later. Configure severity rules.",
    tag: "Coming soon",
  },
  {
    title: "Team access",
    desc: "Invite team members and control permissions.",
    tag: "Coming soon",
  },
  {
    title: "Integrations",
    desc: "Add AWS accounts, later GCP/Azure.",
    tag: "Coming soon",
  },
];

export default function SettingsPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Week 1 placeholder. These settings get wired in Week 2+.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {blocks.map((b) => (
          <Card key={b.title}>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle>{b.title}</CardTitle>
                  <CardDescription>{b.desc}</CardDescription>
                </div>
                <Badge variant="neutral">{b.tag}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-xl border border-border bg-surface-2 p-4">
                <p className="text-sm font-semibold text-foreground">Planned UX</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  This section will have an editable form + save confirmation toast.
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

