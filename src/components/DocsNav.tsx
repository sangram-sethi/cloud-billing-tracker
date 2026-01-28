"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { Input } from "@/components/ui/Input";
import {
  BookOpen,
  Cable,
  BellRing,
  Wallet,
  LineChart,
  Sparkles,
  Search,
} from "lucide-react";

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

function SuggestionRow({
  href,
  icon,
  label,
  description,
  active,
  query,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  description: string;
  active: boolean;
  query: string;
}) {
  // optional tiny highlight
  const q = query.trim().toLowerCase();
  const highlight = (text: string) => {
    if (!q) return text;
    const i = text.toLowerCase().indexOf(q);
    if (i < 0) return text;
    const a = text.slice(0, i);
    const b = text.slice(i, i + q.length);
    const c = text.slice(i + q.length);
    return (
      <>
        {a}
        <span className="text-foreground">{b}</span>
        {c}
      </>
    );
  };

  return (
    <Link
      href={href}
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
          {icon}
        </div>
        <div className="min-w-0">
          <div className={cn("text-sm font-semibold", active ? "text-foreground" : "text-foreground/90")}>
            {highlight(label)}
          </div>
          <div className="mt-1 text-[11px] text-muted-foreground leading-snug">
            {highlight(description)}
          </div>
        </div>
      </div>
    </Link>
  );
}

export function DocsNav() {
  const pathname = usePathname();
  const [q, setQ] = React.useState("");

  const needle = q.trim().toLowerCase();
  const showSuggestions = needle.length > 0;

  const results = React.useMemo(() => {
    if (!needle) return [];
    return items.filter((it) => {
      const hay = `${it.label} ${it.description}`.toLowerCase();
      return hay.includes(needle);
    });
  }, [needle]);

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

        {/* Search */}
        <div className="mt-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search docs…"
              className="h-10 rounded-2xl pl-9 text-sm"
            />
          </div>

          {/* ✅ No “suggestions list” when not typing */}
          {!showSuggestions ? (
            <p className="mt-2 text-[11px] text-muted-foreground">
              Type to jump to a topic. The docs index has the full path.
            </p>
          ) : (
            <div className="mt-2 flex items-center justify-between gap-2">
              <p className="text-[11px] text-muted-foreground">
                {results.length === 0 ? "No matches" : `${results.length} result${results.length === 1 ? "" : "s"}`}
              </p>
              <button
                type="button"
                onClick={() => setQ("")}
                className="rounded-full border border-white/10 bg-white/4 px-2.5 py-1 text-[11px] text-muted-foreground hover:bg-white/6"
              >
                Clear
              </button>
            </div>
          )}
        </div>

        {/* ✅ Suggestions only while typing */}
        {showSuggestions ? (
          <div className="mt-4 grid gap-2">
            {results.length > 0 ? (
              results.map((it) => {
                const active = pathname === it.href || pathname.startsWith(it.href + "/");
                return (
                  <SuggestionRow
                    key={it.href}
                    href={it.href}
                    icon={it.icon}
                    label={it.label}
                    description={it.description}
                    active={active}
                    query={q}
                  />
                );
              })
            ) : (
              <div className="rounded-2xl border border-white/10 bg-white/4 p-3">
                <div className="text-sm font-semibold text-foreground/90">No results</div>
                <div className="mt-1 text-[11px] text-muted-foreground">
                  Try “AWS”, “alerts”, “budgets”, or “reports”.
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-3">
            <div className="text-xs text-muted-foreground">Suggested path</div>
            <div className="mt-1 text-sm font-semibold text-foreground">
              Getting started → Connect AWS → Budgets → Alerts → Reports
            </div>
            <div className="mt-2 text-[11px] text-muted-foreground">
              Open the docs index to browse everything without duplication here.
            </div>
            <Link
              href="/docs"
              className="mt-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/4 px-3 py-1.5 text-[11px] font-semibold text-foreground hover:bg-white/6"
            >
              Browse docs index →
            </Link>
          </div>
        )}
      </div>

      {/* ✅ Quick links: horizontal single row, premium pills */}
      <div className="mt-3 rounded-3xl border border-white/10 bg-surface/20 p-4">
        <div className="text-xs text-muted-foreground">Quick links</div>

        <div className="hideScrollX mt-2 flex items-center gap-2 overflow-x-auto">
          {[
            { href: "/pricing", label: "Pricing" },
            { href: "/security", label: "Security" },
            { href: "/privacy", label: "Privacy" },
            { href: "/terms", label: "Terms" },
          ].map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "shrink-0 rounded-full border border-white/10 bg-white/4 px-3 py-1.5",
                "text-[11px] font-semibold text-foreground/85",
                "hover:bg-white/6 hover:text-foreground transition-colors"
              )}
            >
              {l.label}
            </Link>
          ))}
        </div>
      </div>

      <style jsx>{`
        .hideScrollX::-webkit-scrollbar {
          width: 0px;
          height: 0px;
        }
        .hideScrollX {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
      `}</style>
    </aside>
  );
}
