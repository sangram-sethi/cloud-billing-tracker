"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";

function isRoleArn(value: string) {
  // lightweight check (MVP): arn:aws:iam::<12 digits>:role/<name>
  return /^arn:aws:iam::\d{12}:role\/.+$/.test(value.trim());
}

function isExternalId(value: string) {
  // keep it simple: 8–128 chars, no spaces (you can relax later)
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

    // Mock save: Week 1 only UI
    await new Promise((r) => setTimeout(r, 700));

    setSaving(false);
    setSaved(true);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Connect AWS</h1>
          <p className="mt-1 text-sm text-zinc-600">
            Add an IAM Role ARN and External ID. We use least-privilege and start read-only (billing).
          </p>
        </div>

        <Link
          href="/security"
          className="text-sm font-semibold text-zinc-700 hover:text-zinc-900"
        >
          View security details →
        </Link>
      </div>

      {/* Steps */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Left: Instructions */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-zinc-900">Setup checklist (Week 2)</h2>
          <ol className="mt-3 space-y-3 text-sm text-zinc-700">
            <li className="flex gap-3">
              <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-zinc-900 text-xs font-semibold text-white">
                1
              </span>
              <div>
                <p className="font-medium text-zinc-900">Create IAM role</p>
                <p className="mt-1 text-zinc-600">
                  We’ll provide CloudFormation + policy template. For now, use placeholders.
                </p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-zinc-900 text-xs font-semibold text-white">
                2
              </span>
              <div>
                <p className="font-medium text-zinc-900">Set External ID</p>
                <p className="mt-1 text-zinc-600">
                  Prevents confused-deputy issues. Keep it secret.
                </p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-zinc-900 text-xs font-semibold text-white">
                3
              </span>
              <div>
                <p className="font-medium text-zinc-900">Paste details here</p>
                <p className="mt-1 text-zinc-600">
                  We’ll validate + test connection once backend is wired.
                </p>
              </div>
            </li>
          </ol>

          <div className="mt-5 rounded-xl border border-zinc-200 bg-zinc-50 p-4">
            <p className="text-xs font-semibold text-zinc-900">Permissions scope</p>
            <p className="mt-1 text-sm text-zinc-700">
              Billing & cost metadata only (read-only). No access keys required.
            </p>
          </div>
        </div>

        {/* Right: Form */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm lg:col-span-2">
          <h2 className="text-sm font-semibold text-zinc-900">Connection details</h2>
          <p className="mt-1 text-sm text-zinc-600">
            This is UI-only in Week 1. We’ll store securely and verify in Week 2.
          </p>

          <form onSubmit={onSubmit} className="mt-6 space-y-5">
            <div>
              <Label htmlFor="roleArn">IAM Role ARN</Label>
              <Input
                id="roleArn"
                value={roleArn}
                onChange={(e) => setRoleArn(e.target.value)}
                placeholder="arn:aws:iam::123456789012:role/CloudBudgetGuardReadOnly"
                state={roleArn.length === 0 ? "default" : roleArnOk ? "success" : "error"}
              />
              {roleArn.length > 0 && !roleArnOk ? (
                <p className="mt-2 text-xs text-red-600">
                  Expected format: arn:aws:iam::123456789012:role/RoleName
                </p>
              ) : (
                <p className="mt-2 text-xs text-zinc-500">
                  Read-only role in your AWS account. No access keys.
                </p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-zinc-900" htmlFor="externalId">
                External ID
              </label>
              <input
                id="externalId"
                value={externalId}
                onChange={(e) => setExternalId(e.target.value)}
                placeholder="e.g. cbg_9f3a2c1d8k..."
                className={[
                  "mt-2 w-full rounded-xl border bg-white px-3 py-2.5 text-sm outline-none transition",
                  externalId.length === 0
                    ? "border-zinc-200 focus:border-zinc-400"
                    : externalIdOk
                    ? "border-emerald-300 focus:border-emerald-400"
                    : "border-red-300 focus:border-red-400",
                ].join(" ")}
              />
              {externalId.length > 0 && !externalIdOk ? (
                <p className="mt-2 text-xs text-red-600">
                  Use 8–128 chars, no spaces. Keep it secret.
                </p>
              ) : (
                <p className="mt-2 text-xs text-zinc-500">
                  Used to prevent confused-deputy attacks. We’ll generate this for you later.
                </p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-zinc-900" htmlFor="region">
                Primary region (optional)
              </label>
              <select
                id="region"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="mt-2 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-zinc-400"
              >
                <option value="ap-south-1">ap-south-1 (Mumbai)</option>
                <option value="us-east-1">us-east-1 (N. Virginia)</option>
                <option value="us-west-2">us-west-2 (Oregon)</option>
                <option value="eu-west-1">eu-west-1 (Ireland)</option>
                <option value="ap-southeast-1">ap-southeast-1 (Singapore)</option>
              </select>
              <p className="mt-2 text-xs text-zinc-500">
                This helps default filters and reporting (mocked for now).
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="submit"
                disabled={!canSubmit}
                className={[
                  "inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors",
                  canSubmit
                    ? "bg-zinc-900 text-white hover:bg-zinc-800"
                    : "bg-zinc-200 text-zinc-500 cursor-not-allowed",
                ].join(" ")}
              >
                {saving ? "Saving..." : "Save connection"}
              </button>

              {saved ? (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
                  Saved (mock). Backend validation comes in Week 2.
                </div>
              ) : (
                <div className="text-xs text-zinc-500">
                  Tip: We’ll provide a copy-paste CloudFormation template later.
                </div>
              )}
            </div>
          </form>

          {/* Preview card */}
          <div className="mt-6 rounded-2xl border border-zinc-200 bg-zinc-50 p-5">
            <p className="text-xs font-semibold text-zinc-900">Connection preview (mock)</p>
            <div className="mt-3 grid gap-2 text-sm text-zinc-700 sm:grid-cols-2">
              <div className="rounded-xl border border-zinc-200 bg-white p-3">
                <p className="text-xs text-zinc-500">Role ARN</p>
                <p className="mt-1 break-all font-medium text-zinc-900">
                  {roleArn || "—"}
                </p>
              </div>
              <div className="rounded-xl border border-zinc-200 bg-white p-3">
                <p className="text-xs text-zinc-500">External ID</p>
                <p className="mt-1 break-all font-medium text-zinc-900">
                  {externalId ? "••••••••••••••" : "—"}
                </p>
              </div>
              <div className="rounded-xl border border-zinc-200 bg-white p-3 sm:col-span-2">
                <p className="text-xs text-zinc-500">Region</p>
                <p className="mt-1 font-medium text-zinc-900">{region}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
