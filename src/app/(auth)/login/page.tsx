"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { signIn } from "next-auth/react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Badge } from "@/components/ui/Badge";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const callbackUrl = searchParams.get("callbackUrl") || "/app";

    const res = await signIn("credentials", {
      email: email.trim().toLowerCase(),
      password,
      redirect: false,
    });

    setLoading(false);

    if (res?.error) {
      setError("Invalid email or password");
      return;
    }

    router.push(callbackUrl);
    router.refresh();
  }

  const canSubmit = email.trim().length > 3 && password.length >= 8 && !loading;

  return (
    <div className="mx-auto max-w-md">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle>Sign in</CardTitle>
              <CardDescription>Welcome back. Let’s get you into the dashboard.</CardDescription>
            </div>
            <Badge variant="neutral">Auth</Badge>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            {error ? (
              <div className="rounded-xl border border-border bg-surface-2 p-3">
                <p className="text-sm font-semibold text-foreground">Couldn’t sign you in</p>
                <p className="mt-1 text-sm text-muted-foreground">{error}</p>
              </div>
            ) : null}

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
            <span className="text-muted-foreground">Forgot password? (soon)</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
