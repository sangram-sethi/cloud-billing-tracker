import type { ReactNode } from "react";
import Link from "next/link";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-sm font-semibold tracking-tight">
              Cloud Budget Guard
            </Link>
            <span className="text-xs text-zinc-500">/ app</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
              type="button"
            >
              Workspace: Demo
            </button>
            <button
              className="rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-zinc-800"
              type="button"
            >
              Account
            </button>
          </div>
        </div>
      </header>

      {/* Shell */}
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[240px_1fr] lg:px-8">
        {/* Sidebar (desktop) */}
        <aside className="hidden lg:block">
          <div className="rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm">
            <nav className="flex flex-col gap-1">
              <Link
                href="/app"
                className="rounded-xl px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900"
              >
                Dashboard
              </Link>
              <Link
                href="/app/connect-aws"
                className="rounded-xl px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900"
              >
                Connect AWS
              </Link>
              <Link
                href="/app/reports"
                className="rounded-xl px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900"
              >
                Reports
              </Link>
              <Link
                href="/app/settings"
                className="rounded-xl px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900"
              >
                Settings
              </Link>
            </nav>

            <div className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 p-3">
              <p className="text-xs font-semibold text-zinc-900">MVP status</p>
              <p className="mt-1 text-xs leading-relaxed text-zinc-600">
                Week 1: mocked dashboard + AWS connect UI.
              </p>
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}
