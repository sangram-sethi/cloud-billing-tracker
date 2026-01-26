"use client";

import Link from "next/link";
import { useState } from "react";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    // Week 1: UI only (mock signup)
    await new Promise((r) => setTimeout(r, 700));

    setLoading(false);
    alert("Mock signup. Auth + onboarding wiring in Week 2.");
  }

  const canSubmit =
    name.trim().length >= 2 && email.trim().length > 3 && password.length >= 8 && !loading;

  return (
    <div className="mx-auto max-w-md">
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Create your account</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Week 1 UI only. Real signup + org setup comes next.
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="name" className="text-sm font-medium text-zinc-900">
              Name
            </label>
            <input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="mt-2 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-zinc-400"
              autoComplete="name"
            />
          </div>

          <div>
            <label htmlFor="email" className="text-sm font-medium text-zinc-900">
              Work email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className="mt-2 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-zinc-400"
              autoComplete="email"
            />
          </div>

          <div>
            <label htmlFor="password" className="text-sm font-medium text-zinc-900">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 8 characters"
              className="mt-2 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-zinc-400"
              autoComplete="new-password"
            />
            <p className="mt-2 text-xs text-zinc-500">
              Use at least 8 characters. Auth rules will be enforced in Week 2.
            </p>
          </div>

          <button
            type="submit"
            disabled={!canSubmit}
            className={[
              "mt-2 inline-flex w-full items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors",
              canSubmit
                ? "bg-zinc-900 text-white hover:bg-zinc-800"
                : "bg-zinc-200 text-zinc-500 cursor-not-allowed",
            ].join(" ")}
          >
            {loading ? "Creating..." : "Create account"}
          </button>
        </form>

        <div className="mt-5 text-sm text-zinc-600">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-zinc-900 hover:underline">
            Sign in
          </Link>
        </div>

        <div className="mt-6 rounded-xl border border-zinc-200 bg-zinc-50 p-4">
          <p className="text-xs font-semibold text-zinc-900">Next steps (Week 2)</p>
          <ul className="mt-2 space-y-1 text-xs text-zinc-600">
            <li>• Create workspace/org</li>
            <li>• Generate External ID automatically</li>
            <li>• Connect AWS + validate permissions</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
