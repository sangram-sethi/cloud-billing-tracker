"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { signIn } from "next-auth/react";

import { BrandMark } from "@/components/BrandMark";
import { TurnstileWidget, type TurnstileHandle } from "@/components/auth/TurnstileWidget";
import { Button } from "@/components/ui/Button";
import { GlowCard } from "@/components/ui/GlowCard";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { CardContent, CardHeader } from "@/components/ui/Card";
import { cn } from "@/lib/cn";
import { signInWithLoginToken } from "@/lib/auth/signInWithLoginToken";

type Mode = "login" | "signup";
type Step = "details" | "otp";

function EyeIcon({ open }: { open: boolean }) {
  // open=true => “eye open” (password visible), open=false => “eye with slash”
  return open ? (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2.5 12s3.5-7 9.5-7 9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7Z" />
      <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" />
    </svg>
  ) : (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 3l18 18" />
      <path d="M10.6 10.6A3 3 0 0 0 12 15a3 3 0 0 0 2.4-4.4" />
      <path d="M6.3 6.3C3.9 8.2 2.5 12 2.5 12s3.5 7 9.5 7c2 0 3.7-.5 5.1-1.2" />
      <path d="M14.1 9.2C13.5 8.5 12.8 8.2 12 8.2c-1 0-1.9.4-2.5 1" />
      <path d="M17.7 17.7C20.1 15.8 21.5 12 21.5 12s-3.5-7-9.5-7c-1.4 0-2.7.3-3.9.8" />
    </svg>
  );
}

export function AuthOnePage({ initialMode }: { initialMode: Mode }) {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const turnstileRef = useRef<TurnstileHandle | null>(null);

  const [mode, setMode] = useState<Mode>(initialMode);
  const [step, setStep] = useState<Step>("details");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [captchaToken, setCaptchaToken] = useState<string | null>(null);

  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [code, setCode] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Whenever the user switches Login/Signup, reset the flow so it stays one-screen.
    setStep("details");
    setError(null);
    setCaptchaToken(null);
    setChallengeId(null);
    setCode("");
    setShowPassword(false);
    turnstileRef.current?.reset();
  }, [mode]);

  const title = mode === "login" ? "Sign in" : "Create account";

  const canRequest = useMemo(() => {
    const common = email.trim().length > 3 && password.length >= 6 && !!captchaToken && !loading;
    return mode === "signup" ? common && name.trim().length >= 2 : common;
  }, [mode, email, password, captchaToken, loading, name]);

  const canVerify = code.trim().length === 6 && !loading;

  async function google() {
    setError(null);
    setLoading(true);
    try {
      await signIn("google", { callbackUrl: "/app" });
    } finally {
      setLoading(false);
    }
  }

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
          action: mode,
          name: mode === "signup" ? name.trim() : undefined,
          email: email.trim(),
          password,
          turnstileToken: captchaToken,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to send code");

      // Turnstile token is single-use
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

  function backToDetails() {
    setStep("details");
    setError(null);
    setCaptchaToken(null);
    setChallengeId(null);
    setCode("");
    turnstileRef.current?.reset();
  }

  return (
    <div className="w-full max-w-105">
      <GlowCard
        glowRgb="99 102 241"
        className={cn(
          "bg-surface/90",
          "border-white/10",
          "shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_28px_90px_rgba(0,0,0,0.65)]"
        )}
      >
        <CardHeader className="p-6 pb-4">
          <div className="mb-4 flex items-center justify-center">
            <BrandMark href="/" />
          </div>

          <div className="mx-auto w-full rounded-2xl border border-white/10 bg-black/30 p-1">
            <div className="grid grid-cols-2 gap-1">
              <button
                type="button"
                onClick={() => setMode("login")}
                className={cn(
                  "h-10 rounded-xl text-sm font-semibold transition",
                  mode === "login"
                    ? "bg-white/10 text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Sign in
              </button>
              <button
                type="button"
                onClick={() => setMode("signup")}
                className={cn(
                  "h-10 rounded-xl text-sm font-semibold transition",
                  mode === "signup"
                    ? "bg-white/10 text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Create
              </button>
            </div>
          </div>

          {/* ✅ Subtitle removed */}
          <div className="mt-4 text-center">
            <div className="text-base font-semibold tracking-tight text-foreground">{title}</div>
          </div>
        </CardHeader>

        <CardContent className="p-6 pt-0">
          <Button
            type="button"
            variant="secondary"
            size="md"
            className="w-full"
            onClick={google}
            disabled={loading}
          >
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
            <form onSubmit={requestOtp} className="mt-4 space-y-3">
              {mode === "signup" ? (
                <div className="space-y-1.5">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Sangram"
                    autoComplete="name"
                  />
                </div>
              ) : null}

              <div className="space-y-1.5">
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

              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>

                {/* ✅ Password show/hide */}
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete={mode === "login" ? "current-password" : "new-password"}
                    className="pr-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className={cn(
                      "absolute right-2 top-1/2 -translate-y-1/2",
                      "inline-flex h-9 w-9 items-center justify-center rounded-xl",
                      "text-muted-foreground transition",
                      "hover:text-foreground",
                      "hover:bg-white/5",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/15"
                    )}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    tabIndex={0}
                  >
                    <EyeIcon open={showPassword} />
                  </button>
                </div>
              </div>

              <Button type="submit" variant="primary" size="md" disabled={!canRequest} className="w-full">
                {loading ? "Sending code..." : "Send OTP"}
              </Button>

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

              <div className="text-xs text-muted-foreground">Complete captcha to enable OTP.</div>

              {mode === "login" ? (
                <button
                  type="button"
                  className="w-full text-center text-sm text-muted-foreground transition hover:text-foreground"
                  onClick={() => alert("Password reset flow later.")}
                  disabled={loading}
                >
                  Forgot password?
                </button>
              ) : (
                <div className="text-xs text-muted-foreground">
                  By creating an account, you agree to our{" "}
                  <Link className="text-foreground/90 hover:text-foreground underline underline-offset-4" href="/terms">
                    Terms
                  </Link>{" "}
                  and{" "}
                  <Link
                    className="text-foreground/90 hover:text-foreground underline underline-offset-4"
                    href="/privacy"
                  >
                    Privacy Policy
                  </Link>
                  .
                </div>
              )}
            </form>
          ) : (
            <form onSubmit={verifyOtp} className="mt-4 space-y-3">
              <div className="space-y-1.5">
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
                {loading ? "Verifying..." : mode === "login" ? "Verify & sign in" : "Verify & create account"}
              </Button>

              <button
                type="button"
                className="w-full text-center text-sm text-muted-foreground transition hover:text-foreground"
                onClick={backToDetails}
                disabled={loading}
              >
                Back / resend
              </button>
            </form>
          )}

          <div className="mt-5 flex items-center justify-between text-sm">
            {mode === "login" ? (
              <button
                type="button"
                onClick={() => setMode("signup")}
                className="font-semibold text-muted-foreground transition hover:text-foreground"
                disabled={loading}
              >
                Create account
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setMode("login")}
                className="font-semibold text-muted-foreground transition hover:text-foreground"
                disabled={loading}
              >
                Already have an account?
              </button>
            )}

            <Link href="/" className="text-muted-foreground transition hover:text-foreground">
              Back to site
            </Link>
          </div>
        </CardContent>
      </GlowCard>
    </div>
  );
}

