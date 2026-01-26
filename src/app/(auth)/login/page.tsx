"use client";

import Link from "next/link";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Badge } from "@/components/ui/Badge";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    setLoading(false);
    alert("Mock login. Auth wiring in Week 2.");
  }

  const canSubmit = email.trim().length > 3 && password.length >= 6 && !loading;

  return (
    <div className="mx-auto max-w-md">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle>Sign in</CardTitle>
              <CardDescription>Week 1 UI only. We’ll add real auth next.</CardDescription>
            </div>
            <Badge variant="neutral">MVP</Badge>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
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
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>

            <Button type="submit" variant="primary" size="md" disabled={!canSubmit} className="w-full">
              {loading ? "Signing in..." : "Sign in"}
            </Button>
          </form>

          <div className="mt-5 flex items-center justify-between text-sm">
            <Link href="/signup" className="font-semibold text-muted-foreground hover:text-foreground transition">
              Create account
            </Link>
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground transition"
              onClick={() => alert("Reset flow in Week 2.")}
            >
              Forgot password?
            </button>
          </div>

          <div className="mt-6 rounded-xl border border-border bg-surface-2 p-4">
            <p className="text-xs font-semibold text-foreground">Demo credentials (mock)</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Use any email + password (≥ 6 chars). This is UI-only for Week 1.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}