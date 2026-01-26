import Link from "next/link";

const kpis = [
  { label: "This month spend", value: "$1,842", hint: "+12% vs last month" },
  { label: "Forecast (EOM)", value: "$2,410", hint: "based on last 14 days" },
  { label: "Active alerts", value: "3", hint: "2 high, 1 medium" },
  { label: "Connected accounts", value: "0", hint: "connect AWS to go live" },
];

const topServices = [
  { name: "EC2", spend: 624, change: "+18%" },
  { name: "RDS", spend: 412, change: "+6%" },
  { name: "S3", spend: 221, change: "-3%" },
  { name: "CloudWatch", spend: 118, change: "+22%" },
  { name: "Lambda", spend: 77, change: "+4%" },
];

const anomalies = [
  {
    id: "ALRT-1042",
    severity: "High",
    title: "EC2 spend spiked in ap-south-1",
    when: "Today, 10:40",
    note: "New instance family appears (m7i.*) + higher hours.",
  },
  {
    id: "ALRT-1039",
    severity: "High",
    title: "NAT Gateway costs jumped",
    when: "Yesterday, 19:10",
    note: "Data processing up 3.2x. Check egress + VPC routing.",
  },
  {
    id: "ALRT-1033",
    severity: "Medium",
    title: "CloudWatch Logs ingestion increased",
    when: "2 days ago",
    note: "Possible debug logs left on. Consider retention policies.",
  },
];

function dollars(n: number) {
  return `$${n.toLocaleString()}`;
}

export default function AppDashboardPage() {
  const maxSpend = Math.max(...topServices.map((s) => s.spend));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm text-zinc-600">
            Mocked data for Week 1. Connect AWS when you’re ready.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/app/connect-aws"
            className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-semibold text-white hover:bg-zinc-800 transition-colors"
          >
            Connect AWS
          </Link>
          <button
            type="button"
            className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-50 transition-colors"
          >
            Generate report
          </button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <div
            key={k.label}
            className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm"
          >
            <p className="text-xs font-medium text-zinc-600">{k.label}</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900">
              {k.value}
            </p>
            <p className="mt-1 text-xs text-zinc-500">{k.hint}</p>
          </div>
        ))}
      </div>

      {/* Main grid */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Top services */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-zinc-900">Top services (month)</h2>
            <p className="text-xs text-zinc-500">mock</p>
          </div>

          <div className="mt-4 space-y-3">
            {topServices.map((s) => {
              const w = Math.max(6, Math.round((s.spend / maxSpend) * 100));
              return (
                <div key={s.name} className="grid grid-cols-[120px_1fr_90px] items-center gap-3">
                  <div className="text-sm font-medium text-zinc-900">{s.name}</div>
                  <div className="h-2 rounded-full bg-zinc-100 overflow-hidden">
                    <div className="h-full bg-zinc-900" style={{ width: `${w}%` }} />
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-zinc-900">{dollars(s.spend)}</div>
                    <div className="text-xs text-zinc-500">{s.change}</div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-5 rounded-xl border border-zinc-200 bg-zinc-50 p-4">
            <p className="text-xs font-semibold text-zinc-900">AI suggestion (mock)</p>
            <p className="mt-1 text-sm text-zinc-700">
              EC2 is trending up. Check for new instance families, idle instances, and consider
              Savings Plans if usage is steady.
            </p>
          </div>
        </div>

        {/* Alerts */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-zinc-900">Recent alerts</h2>
            <Link href="/app/reports" className="text-xs font-medium text-zinc-600 hover:text-zinc-900">
              View all
            </Link>
          </div>

          <div className="mt-4 space-y-3">
            {anomalies.map((a) => (
              <div key={a.id} className="rounded-xl border border-zinc-200 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-zinc-900">{a.title}</p>
                    <p className="mt-1 text-xs text-zinc-500">{a.when}</p>
                  </div>
                  <span
                    className={[
                      "rounded-full px-2.5 py-1 text-[11px] font-semibold",
                      a.severity === "High"
                        ? "bg-red-50 text-red-700 border border-red-200"
                        : "bg-amber-50 text-amber-700 border border-amber-200",
                    ].join(" ")}
                  >
                    {a.severity}
                  </span>
                </div>
                <p className="mt-2 text-sm text-zinc-600">{a.note}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 text-xs text-zinc-500">
            Alerts will be email/WhatsApp in later phases.
          </div>
        </div>
      </div>
    </div>
  );
}
