import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/cn";
import { ArrowRight, BookOpen, Cable, BellRing, Wallet, LineChart } from "lucide-react";

function DocCard({
  href,
  title,
  description,
  icon,
  tone,
}: {
  href: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  tone: "primary" | "success" | "warning";
}) {
  const toneRing =
    tone === "success" ? "ring-emerald-500/15" : tone === "warning" ? "ring-amber-500/15" : "ring-primary/15";

  const toneIcon =
    tone === "success" ? "text-emerald-300" : tone === "warning" ? "text-amber-300" : "text-primary";

  return (
    <Link
      href={href}
      className={cn(
        "group rounded-3xl border border-white/10 bg-white/4 p-4",
        "transition-[transform,background-color,border-color] duration-200 ease-(--ease-snappy)",
        "hover:bg-white/6 active:scale-[0.995]",
        "ring-1",
        toneRing
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className={cn("grid h-10 w-10 place-items-center rounded-2xl border border-white/10 bg-black/20", toneIcon)}>
            {icon}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-foreground">{title}</div>
            <div className="mt-1 text-xs text-muted-foreground leading-snug">{description}</div>
          </div>
        </div>
        <ArrowRight className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-foreground" />
      </div>
    </Link>
  );
}

export default function DocsHome() {
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs text-muted-foreground">Docs</div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">Documentation</h1>
        </div>
        <Badge variant="neutral">AWS-only • read-only scope</Badge>
      </div>

      <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
        Everything you need to understand the product flow: connect AWS, set budgets, verify alerts, and read the weekly
        founder report.
      </p>

      <div className="mt-6 grid gap-3 lg:grid-cols-2">
        <DocCard
          href="/docs/getting-started"
          title="Getting started"
          description="The 5-minute tour: what we track, what we don’t, and how alerts fire."
          icon={<BookOpen className="h-4 w-4" />}
          tone="primary"
        />
        <DocCard
          href="/docs/connect-aws"
          title="Connect AWS"
          description="Create a dedicated read-only IAM role for Cost Explorer + CloudWatch."
          icon={<Cable className="h-4 w-4" />}
          tone="success"
        />
        <DocCard
          href="/docs/budgets"
          title="Budgets"
          description="Thresholds, caps, and how we avoid alert spam."
          icon={<Wallet className="h-4 w-4" />}
          tone="warning"
        />
        <DocCard
          href="/docs/alerts"
          title="Alerts"
          description="Email + WhatsApp pipeline, delivery states, and payload structure."
          icon={<BellRing className="h-4 w-4" />}
          tone="success"
        />
        <DocCard
          href="/docs/reports"
          title="Reports"
          description="Weekly founder report: spend summary, anomalies, and suggested actions."
          icon={<LineChart className="h-4 w-4" />}
          tone="primary"
        />
      </div>

      <div className="mt-8 rounded-3xl border border-white/10 bg-black/20 p-4">
        <div className="text-sm font-semibold text-foreground">Security promise</div>
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
          We never request write access. Your integration uses a dedicated IAM role with read-only billing scope. If you
          ever disconnect, access is instantly revoked on your side.
        </p>
      </div>
    </div>
  );
}
