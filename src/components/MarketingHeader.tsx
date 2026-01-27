import { Container } from "@/components/Container";
import { NavLink } from "@/components/NavLink";
import { LinkButton } from "@/components/ui/LinkButton";
import { ArrowDownToLine } from "lucide-react";

export function MarketingHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-background/40 backdrop-blur">
      <Container className="flex h-16 items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-surface/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
            <span className="text-sm font-black tracking-tight">cb</span>
          </div>
          <span className="text-sm font-semibold tracking-tight">CloudBudgetGuard</span>
        </div>

        {/* Nav */}
        <nav className="hidden items-center gap-8 md:flex">
          <NavLink href="/" exact>
            Workflow
          </NavLink>
          <NavLink href="/security">Security</NavLink>
          <NavLink href="/pricing">Pricing</NavLink>
          <a
            href="#docs"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors ease-(--ease-snappy)"
          >
            Docs
          </a>
        </nav>

        {/* CTA */}
        <LinkButton href="/signup" variant="primary" size="sm" className="gap-2">
          Download <ArrowDownToLine className="h-4 w-4" />
        </LinkButton>
      </Container>
    </header>
  );
}
