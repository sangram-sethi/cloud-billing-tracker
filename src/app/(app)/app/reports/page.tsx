import Link from "next/link";

export default function ReportsPage() {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-semibold tracking-tight">Reports</h1>
      <p className="mt-2 text-sm text-zinc-600">
        Week 1 placeholder. Weekly founder report UI will land here next.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
          <p className="text-sm font-semibold text-zinc-900">Weekly founder report</p>
          <p className="mt-1 text-sm text-zinc-600">
            Summary of spend trends, biggest movers, and anomalies.
          </p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
          <p className="text-sm font-semibold text-zinc-900">Alert history</p>
          <p className="mt-1 text-sm text-zinc-600">
            All anomalies with severity, root cause hints, and actions.
          </p>
        </div>
      </div>

      <div className="mt-6 flex gap-3">
        <Link
          href="/app"
          className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
        >
          Back to dashboard
        </Link>
        <Link
          href="/app/connect-aws"
          className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
        >
          Connect AWS
        </Link>
      </div>
    </div>
  );
}
