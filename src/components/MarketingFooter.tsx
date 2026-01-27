import { Container } from "@/components/Container";
import Link from "next/link";

export function MarketingFooter() {
  return (
    <footer className="mt-20 border-t border-white/5">
      <Container className="py-14">
        <div className="grid gap-10 md:grid-cols-3">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-surface/40">
                <span className="text-sm font-black tracking-tight">cb</span>
              </div>
              <span className="text-sm font-semibold tracking-tight">CloudBudgetGuard</span>
            </div>
            <p className="max-w-sm text-sm text-muted-foreground">
              Premium-grade spend tracking, anomaly alerts, and weekly founder reports.
            </p>
            <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} CloudBudgetGuard.</p>
          </div>

          <div className="grid gap-10 sm:grid-cols-2 md:col-span-2">
            <div className="space-y-2">
              <p className="text-sm font-semibold text-foreground">Product</p>
              <div className="grid gap-2 text-sm text-muted-foreground">
                <Link className="hover:text-foreground transition-colors" href="/">
                  Workflow
                </Link>
                <Link className="hover:text-foreground transition-colors" href="/pricing">
                  Pricing
                </Link>
                <Link className="hover:text-foreground transition-colors" href="/security">
                  Security
                </Link>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-semibold text-foreground">Company</p>
              <div className="grid gap-2 text-sm text-muted-foreground">
                <a className="hover:text-foreground transition-colors" href="#docs">
                  Docs
                </a>
                <a className="hover:text-foreground transition-colors" href="#privacy">
                  Privacy
                </a>
                <a className="hover:text-foreground transition-colors" href="#terms">
                  Terms
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Massive watermark-style text (like reference footer vibe) */}
        <div className="relative mt-14 overflow-hidden rounded-3xl border border-white/5 bg-surface/20 p-10">
          <p className="text-xs text-muted-foreground">Built for founders who hate surprise bills.</p>
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 flex items-end justify-center"
          >
            <span className="select-none text-[10rem] font-black tracking-tight text-white/3 leading-none">
              CLOUDBUDGET
            </span>
          </div>
        </div>
      </Container>
    </footer>
  );
}
