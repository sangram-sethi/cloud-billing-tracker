"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { LayoutDashboard, Plug, FileText, Settings, LineChart, AlertTriangle } from "lucide-react";

const links = [
  { href: "/app", label: "Dashboard", icon: LayoutDashboard },
  { href: "/app/usage", label: "Usage", icon: LineChart },
  { href: "/app/anomalies", label: "Anomalies", icon: AlertTriangle },
  { href: "/app/connect-aws", label: "Connect", icon: Plug },
  { href: "/app/reports", label: "Reports", icon: FileText },
  { href: "/app/settings", label: "Settings", icon: Settings },
];

export function AppSidebarNav() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 z-40 border-b border-white/5 bg-background/40 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-surface/50">
            <span className="text-sm font-black tracking-tight">cb</span>
          </div>
          <p className="text-sm font-semibold tracking-tight">CloudBudgetGuard</p>
        </div>

        <nav className="hidden items-center gap-2 md:flex">
          {links.map((l) => {
            const active = pathname === l.href || pathname.startsWith(l.href + "/");
            return (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "group relative inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium " +
                    "transition-colors ease-(--ease-snappy)",
                  active
                    ? "bg-surface/60 text-foreground border border-white/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-surface/40"
                )}
              >
                <l.icon className="h-4 w-4 opacity-80 group-hover:opacity-100" />
                {l.label}
              </Link>
            );
          })}
        </nav>

        <Link
          href="/"
          className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors ease-(--ease-snappy)"
        >
          Back to site
        </Link>
      </div>
    </aside>
  );
}
