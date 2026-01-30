import { auth } from "@/auth";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { NotificationSettingsCard } from "@/components/settings/NotificationSettingsCard";

const blocks = [
  { title: "Budgets", desc: "Set monthly thresholds and burn-rate alerts.", tag: "Soon" },
  { title: "Team access", desc: "Invite team members and control permissions.", tag: "Soon" },
  { title: "Integrations", desc: "Add AWS accounts, later GCP/Azure.", tag: "Soon" },
];

export default async function SettingsPage() {
  const session = await auth();

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Settings</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Configure alerts, AI insights, and your account. Budgets + team access land next.
          </p>
        </div>

        <SignOutButton />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle>Account</CardTitle>
              <CardDescription>Your signed-in identity for this workspace.</CardDescription>
            </div>
            <Badge variant="neutral">Auth</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 text-sm">
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">Email</span>
              <span className="font-semibold text-foreground">{session?.user?.email}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">User ID</span>
              <span className="font-mono text-xs text-muted-foreground">{session?.user?.id}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <NotificationSettingsCard />

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
          </Card>
        ))}
      </div>
    </div>
  );
}
