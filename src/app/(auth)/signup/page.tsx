"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { signIn } from "next-auth/react";

import { AuthShell } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { TurnstileWidget, type TurnstileHandle } from "@/components/auth/TurnstileWidget";
import { signInWithLoginToken } from "@/lib/auth/signInWithLoginToken";

export default function SignupPage() {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const turnstileRef = useRef<TurnstileHandle | null>(null);

  const [step, setStep] = useState<"details" | "otp">("details");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [captchaToken, setCaptchaToken] = useState<string | null>(null);

  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [code, setCode] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function requestOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!siteKey) {
      setError("Missing NEXT_PUBLIC_TURNSTILE_SITE_KEY");
      return;
    }
    if (!captchaToken) {
      setError("Please complete the captcha first.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/otp/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "signup",
          name: name.trim(),
          email: email.trim(),
          password,
          turnstileToken: captchaToken,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to send code");

      // Token is single-use; reset after request
      setCaptchaToken(null);
      turnstileRef.current?.reset();

      setChallengeId(data.challengeId);
      setStep("otp");
    } catch (err: any) {
      setError(err?.message || "Something went wrong");
      setCaptchaToken(null);
      turnstileRef.current?.reset();
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!challengeId) {
      setError("Challenge missing. Please request a new code.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          challengeId,
          code: code.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Invalid code");
      if (!data?.loginToken) throw new Error("Login token missing. Please retry.");

      await signInWithLoginToken(data.loginToken, "/app");
    } catch (err: any) {
      setError(err?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function google() {
    setError(null);
    setLoading(true);
    try {
      await signIn("google", { callbackUrl: "/app" });
    } finally {
      setLoading(false);
    }
  }

  const canRequest =
    name.trim().length >= 2 &&
    email.trim().length > 3 &&
    password.length >= 6 &&
    !!captchaToken &&
    !loading;

  const canVerify = code.trim().length === 6 && !loading;

  return (
    <AuthShell title="Create your account" description="Start free. Google or email + OTP verification.">
      <Button type="button" variant="secondary" size="md" className="w-full" onClick={google} disabled={loading}>
        Continue with Google
      </Button>

      <div className="mt-3 flex items-center gap-3">
        <div className="h-px flex-1 bg-white/10" />
        <span className="text-xs text-muted-foreground">or</span>
        <div className="h-px flex-1 bg-white/10" />
      </div>

      {error ? (
        <div className="mt-4 rounded-2xl border border-danger/30 bg-danger/10 p-3 text-sm text-foreground">
          {error}
        </div>
      ) : null}

      {step === "details" ? (
        <form onSubmit={requestOtp} className="mt-5 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Sangram"
              autoComplete="name"
            />
          </div>

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
              autoComplete="new-password"
            />
          </div>

          <Button type="submit" variant="primary" size="md" disabled={!canRequest} className="w-full">
            {loading ? "Sending code..." : "Send OTP"}
          </Button>

          {/* ✅ Captcha moved BELOW the Send OTP button */}
          {siteKey ? (
            <TurnstileWidget
              ref={turnstileRef}
              siteKey={siteKey}
              size="normal"
              onToken={(t) => setCaptchaToken(t)}
              onExpired={() => setCaptchaToken(null)}
              onError={() => setCaptchaToken(null)}
            />
          ) : null}

          <div className="text-xs text-muted-foreground">
            Complete captcha to enable OTP.
          </div>
        </form>
      ) : (
        <form onSubmit={verifyOtp} className="mt-5 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="otp">Enter OTP</Label>
            <Input
              id="otp"
              inputMode="numeric"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="6-digit code"
              autoComplete="one-time-code"
            />
          </div>

          <Button type="submit" variant="primary" size="md" disabled={!canVerify} className="w-full">
            {loading ? "Verifying..." : "Verify & create account"}
          </Button>

          <button
            type="button"
            className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition"
            onClick={() => {
              setStep("details");
              setCode("");
              setChallengeId(null);
              setCaptchaToken(null);
              turnstileRef.current?.reset();
            }}
            disabled={loading}
          >
            Edit details / resend
          </button>
        </form>
      )}

      <div className="mt-6 flex items-center justify-between text-sm">
        <Link href="/login" className="font-semibold text-muted-foreground hover:text-foreground transition">
          Already have an account?
        </Link>
        <Link href="/" className="text-muted-foreground hover:text-foreground transition">
          Back to site
        </Link>
      </div>
    </AuthShell>
  );
}
