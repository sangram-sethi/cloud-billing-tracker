export default function SettingsPage() {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
      <p className="mt-2 text-sm text-zinc-600">
        Week 1 placeholder. Billing limits, notification channels, and org settings come next.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
          <p className="text-sm font-semibold text-zinc-900">Budgets (coming soon)</p>
          <p className="mt-1 text-sm text-zinc-600">
            Set monthly budget thresholds and burn-rate alerts.
          </p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
          <p className="text-sm font-semibold text-zinc-900">Notifications (coming soon)</p>
          <p className="mt-1 text-sm text-zinc-600">
            Email now, WhatsApp later. Configure severity rules.
          </p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
          <p className="text-sm font-semibold text-zinc-900">Team access (coming soon)</p>
          <p className="mt-1 text-sm text-zinc-600">
            Invite team members and control permissions.
          </p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
          <p className="text-sm font-semibold text-zinc-900">Integrations (coming soon)</p>
          <p className="mt-1 text-sm text-zinc-600">
            Add AWS accounts, later GCP/Azure.
          </p>
        </div>
      </div>
    </div>
  );
}
