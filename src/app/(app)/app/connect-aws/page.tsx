"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Badge } from "@/components/ui/Badge";

function isRoleArn(value: string) {
  return /^arn:aws:iam::\d{12}:role\/.+$/.test(value.trim());
}

function isExternalId(value: string) {
  const v = value.trim();
  return v.length >= 8 && v.length <= 128 && !/\s/.test(v);
}

export default function ConnectAwsPage() {
  const [roleArn, setRoleArn] = useState("");
  const [externalId, setExternalId] = useState("");
  const [region, setRegion] = useState("ap-south-1");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const roleArnOk = useMemo(() => isRoleArn(roleArn), [roleArn]);
  const externalIdOk = useMemo(() => isExternalId(externalId), [externalId]);

  const canSubmit = roleArnOk && externalIdOk && !saving;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaved(false);
    setSaving(true);
    await new Promise((r) => setTimeout(r, 700));
    setSaving(false);
    setSaved(true);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Connect AWS</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Add an IAM Role ARN and External ID. We use least-privilege and start read-only (billing).
          </p>
        </div>

        <Link
          href="/security"
          className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors ease-(--ease-snappy)"
        >
          View security details →
        </Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Setup checklist</CardTitle>
                <CardDescription>Templates arrive in Week 2</CardDescription>
              </div>
              <Badge variant="neutral">MVP</Badge>
            </div>
          </CardHeader>

          <CardContent>
            <ol className="space-y-4 text-sm">
              {[
                ["Create IAM role", "We’ll provide CloudFormation + least-privilege policy."],
                ["Set External ID", "Prevents confused-deputy issues. Keep it secret."],
                ["Paste details here", "We’ll validate + test connection once backend is wired."],
              ].map(([title, desc], idx) => (
                <li key={title} className="flex gap-3">
                  <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-foreground text-xs font-semibold text-background">
                    {idx + 1}
                  </span>
                  <div>
                    <p className="font-semibold text-foreground">{title}</p>
                    <p className="mt-1 text-muted-foreground">{desc}</p>
                  </div>
                </li>
              ))}
            </ol>

            <div className="mt-5 rounded-2xl border border-white/10 bg-surface/30 p-4">
              <p className="text-xs font-semibold text-foreground">Permissions scope</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Billing & cost metadata only (read-only). No access keys required.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle>Connection details</CardTitle>
                <CardDescription>Week 1 UI only. We’ll store securely and verify in Week 2.</CardDescription>
              </div>
              {saved ? <Badge variant="success">Saved</Badge> : <Badge variant="neutral">Not connected</Badge>}
            </div>
          </CardHeader>

          <CardContent>
            <form onSubmit={onSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="roleArn">IAM Role ARN</Label>
                <Input
                  id="roleArn"
                  value={roleArn}
                  onChange={(e) => setRoleArn(e.target.value)}
                  placeholder="arn:aws:iam::123456789012:role/CloudBudgetGuardReadOnly"
                  state={roleArn.length === 0 ? "default" : roleArnOk ? "success" : "error"}
                />
                {roleArn.length > 0 && !roleArnOk ? (
                  <p className="text-xs text-danger">
                    Expected format: arn:aws:iam::123456789012:role/RoleName
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">Read-only role in your AWS account. No access keys.</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="externalId">External ID</Label>
                <Input
                  id="externalId"
                  value={externalId}
                  onChange={(e) => setExternalId(e.target.value)}
                  placeholder="e.g. cbg_9f3a2c1d8k..."
                  state={externalId.length === 0 ? "default" : externalIdOk ? "success" : "error"}
                />
                {externalId.length > 0 && !externalIdOk ? (
                  <p className="text-xs text-danger">Use 8–128 chars, no spaces. Keep it secret.</p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Used to prevent confused-deputy attacks. We’ll generate this for you later.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="region">Primary region (optional)</Label>
                <select
                  id="region"
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className={
                    "h-11 w-full rounded-2xl border border-border/70 bg-surface/55 px-3 text-sm text-foreground " +
                    "shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] backdrop-blur outline-none " +
                    "transition-[box-shadow,border-color] duration-200 ease-(--ease-snappy) " +
                    "focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/40"
                  }
                >
                  <option value="ap-south-1">ap-south-1 (Mumbai)</option>
                  <option value="us-east-1">us-east-1 (N. Virginia)</option>
                  <option value="us-west-2">us-west-2 (Oregon)</option>
                  <option value="eu-west-1">eu-west-1 (Ireland)</option>
                  <option value="ap-southeast-1">ap-southeast-1 (Singapore)</option>
                </select>
                <p className="text-xs text-muted-foreground">Helps default filters and reporting (mocked for now).</p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Button type="submit" variant="primary" size="md" disabled={!canSubmit}>
                  {saving ? "Saving..." : "Save connection"}
                </Button>

                {saved ? (
                  <div className="rounded-2xl border border-success/20 bg-success/10 px-3 py-2 text-sm font-medium text-success">
                    Saved (mock). Backend validation comes in Week 2.
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground">Tip: We’ll provide a copy-paste CloudFormation template later.</div>
                )}
              </div>
            </form>

            <div className="mt-6 rounded-3xl border border-white/10 bg-surface/30 p-5">
              <p className="text-xs font-semibold text-foreground">Connection preview (mock)</p>

              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-surface/40 p-3">
                  <p className="text-xs text-muted-foreground">Role ARN</p>
                  <p className="mt-1 break-all text-sm font-semibold text-foreground">{roleArn || "—"}</p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-surface/40 p-3">
                  <p className="text-xs text-muted-foreground">External ID</p>
                  <p className="mt-1 break-all text-sm font-semibold text-foreground">{externalId ? "••••••••••••••" : "—"}</p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-surface/40 p-3 sm:col-span-2">
                  <p className="text-xs text-muted-foreground">Region</p>
                  <p className="mt-1 text-sm font-semibold text-foreground">{region}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
