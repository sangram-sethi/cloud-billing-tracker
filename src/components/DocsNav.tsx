"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { Input } from "@/components/ui/Input";
import { BookOpen, Cable, BellRing, Wallet, LineChart, Sparkles } from "lucide-react";

type Item = {
  href: string;
  label: string;
  icon: React.ReactNode;
  description: string;
};

const items: Item[] = [
  {
    href: "/docs/getting-started",
    label: "Getting started",
    icon: <BookOpen className="h-4 w-4" />,
    description: "How CloudBudgetGuard works, end-to-end.",
  },
  {
    href: "/docs/connect-aws",
    label: "Connect AWS",
    icon: <Cable className="h-4 w-4" />,
    description: "Read-only IAM role + safe onboarding.",
  },
  {
    href: "/docs/budgets",
    label: "Budgets",
    icon: <Wallet className="h-4 w-4" />,
    description: "Thresholds, caps, and how alerts are triggered.",
  },
  {
    href: "/docs/alerts",
    label: "Alerts",
    icon: <BellRing className="h-4 w-4" />,
    description: "Email + WhatsApp delivery pipeline.",
  },
  {
    href: "/docs/reports",
    label: "Reports",
    icon: <LineChart className="h-4 w-4" />,
    description: "Weekly founder report and what it includes.",
  },
];

export function DocsNav() {
  const pathname = usePathname();

  return (
    <aside className="h-full min-h-0">
      <div className="rounded-3xl border border-white/10 bg-surface/30 p-4">
        <div className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-2xl border border-white/10 bg-white/5">
            <Sparkles className="h-4 w-4 text-primary" />
          </span>
          <div>
            <div className="text-xs text-muted-foreground">Documentation</div>
            <div className="text-sm font-semibold text-foreground">CloudBudgetGuard docs</div>
          </div>
        </div>

        <div className="mt-4">
          <Input placeholder="Search docs…" className="h-10 rounded-2xl text-sm" />
          <p className="mt-2 text-[11px] text-muted-foreground">
            Tip: start with <span className="text-foreground/80 font-semibold">Getting started</span>.
          </p>
        </div>

        <div className="mt-4 grid gap-2">
          {items.map((it) => {
            const active = pathname === it.href || pathname.startsWith(it.href + "/");
            return (
              <Link
                key={it.href}
                href={it.href}
                className={cn(
                  "group rounded-2xl border border-white/10 bg-white/4 p-3 text-left",
                  "transition-[transform,background-color,border-color] duration-200 ease-(--ease-snappy)",
                  "hover:bg-white/6 active:scale-[0.995]",
                  active && "bg-primary/10 border-primary/20"
                )}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      "grid h-9 w-9 place-items-center rounded-2xl border border-white/10 bg-black/20",
                      "text-muted-foreground group-hover:text-foreground",
                      active && "text-foreground"
                    )}
                  >
                    {it.icon}
                  </div>
                  <div className="min-w-0">
                    <div className={cn("text-sm font-semibold", active ? "text-foreground" : "text-foreground/90")}>
                      {it.label}
                    </div>
                    <div className="mt-1 text-[11px] text-muted-foreground leading-snug">{it.description}</div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="mt-3 rounded-3xl border border-white/10 bg-surface/20 p-4">
        <div className="text-xs text-muted-foreground">Quick links</div>
        <div className="mt-2 grid gap-2 text-sm">
          <Link className="text-muted-foreground hover:text-foreground transition-colors" href="/pricing">
            Pricing
          </Link>
          <Link className="text-muted-foreground hover:text-foreground transition-colors" href="/security">
            Security
          </Link>
          <Link className="text-muted-foreground hover:text-foreground transition-colors" href="/privacy">
            Privacy
          </Link>
          <Link className="text-muted-foreground hover:text-foreground transition-colors" href="/terms">
            Terms
          </Link>
        </div>
      </div>
    </aside>
  );
}
