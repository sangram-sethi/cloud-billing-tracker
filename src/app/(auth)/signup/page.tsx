"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { signIn } from "next-auth/react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Badge } from "@/components/ui/Badge";

export default function SignupPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim() || undefined,
        email: email.trim().toLowerCase(),
        password,
      }),
    }).catch(() => null);

    if (!res || !res.ok) {
      const data = await res?.json().catch(() => null);
      setLoading(false);
      setError(data?.message || "Could not create account");
      return;
    }

    const signInRes = await signIn("credentials", {
      email: email.trim().toLowerCase(),
      password,
      redirect: false,
    });

    setLoading(false);

    if (signInRes?.error) {
      setError("Account created, but sign in failed. Please try logging in.");
      return;
    }

    router.push("/app");
    router.refresh();
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
              <CardDescription>Start tracking AWS spend in minutes.</CardDescription>
            </div>
            <Badge variant="neutral">Auth</Badge>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            {error ? (
              <div className="rounded-xl border border-border bg-surface-2 p-3">
                <p className="text-sm font-semibold text-foreground">Couldn’t create your account</p>
                <p className="mt-1 text-sm text-muted-foreground">{error}</p>
              </div>
            ) : null}

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
              <p className="text-xs text-muted-foreground">Use at least 8 characters.</p>
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
        </CardContent>
      </Card>
    </div>
  );
}
