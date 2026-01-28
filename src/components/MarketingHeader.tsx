import Link from "next/link";
import { Container } from "@/components/Container";
import { NavLink } from "@/components/NavLink";
import { LinkButton } from "@/components/ui/LinkButton";
import { ArrowRight } from "lucide-react";

export function MarketingHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-background/40 backdrop-blur">
      <Container className="flex h-16 items-center justify-between">
        {/* Brand */}
        <Link
          href="/"
          className="flex items-center gap-3 rounded-xl outline-none transition-[transform,opacity] duration-200 ease-(--ease-snappy) hover:opacity-95 active:scale-[0.99]"
        >
          <div className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-surface/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
            <span className="text-sm font-black tracking-tight">cb</span>
          </div>
          <span className="text-sm font-semibold tracking-tight">CloudBudgetGuard</span>
        </Link>

        {/* Nav */}
        <nav className="hidden items-center gap-1 rounded-full border border-white/10 bg-white/4 p-1 md:flex">
          <NavLink href="/" exact>
            Workflow
          </NavLink>
          <NavLink href="/security">Security</NavLink>
          <NavLink href="/pricing">Pricing</NavLink>
          <NavLink href="/docs">Docs</NavLink>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <LinkButton href="/login" variant="ghost" size="sm" className="hidden md:inline-flex">
            Sign in
          </LinkButton>
          <LinkButton href="/signup" variant="primary" size="sm" className="gap-2">
            Start free <ArrowRight className="h-4 w-4" />
          </LinkButton>
        </div>
      </Container>
    </header>
  );
}

