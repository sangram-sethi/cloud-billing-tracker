"use client";

import Link from "next/link";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Badge } from "@/components/ui/Badge";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await new Promise((r) => setTimeout(r, 700));
    setLoading(false);
    alert("Mock signup. Auth + onboarding wiring in Week 2.");
  }

  const canSubmit =
    name.trim().length >= 2 && email.trim().length > 3 && password.length >= 8 && !loading;

  return (
    <div className="mx-auto max-w-md">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle>Create your account</CardTitle>
              <CardDescription>Week 1 UI only. Real signup + org setup comes next.</CardDescription>
            </div>
            <Badge variant="neutral">MVP</Badge>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                autoComplete="name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Work email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                autoComplete="email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                autoComplete="new-password"
              />
              <p className="text-xs text-muted-foreground">
                Use at least 8 characters. Auth rules will be enforced in Week 2.
              </p>
            </div>

            <Button type="submit" variant="primary" size="md" disabled={!canSubmit} className="w-full">
              {loading ? "Creating..." : "Create account"}
            </Button>
          </form>

          <div className="mt-5 text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-foreground hover:underline">
              Sign in
            </Link>
          </div>

          <div className="mt-6 rounded-xl border border-border bg-surface-2 p-4">
            <p className="text-xs font-semibold text-foreground">Next steps (Week 2)</p>
            <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
              <li>• Create workspace/org</li>
              <li>• Generate External ID automatically</li>
              <li>• Connect AWS + validate permissions</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}