import type { ReactNode } from "react";
import Link from "next/link";
import { LinkButton } from "@/components/ui/LinkButton";

function NavLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-surface-2 hover:text-foreground transition"
    >
      {children}
    </Link>
  );
}

function ActionLink({
  href,
  children,
  variant = "secondary",
}: {
  href: string;
  children: ReactNode;
  variant?: "secondary" | "primary";
}) {
  const base =
    "inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold transition";
  const cls =
    variant === "primary"
      ? "bg-foreground text-background hover:opacity-90"
      : "border border-border bg-surface text-foreground hover:bg-surface-2";

  return (
    <Link href={href} className={`${base} ${cls}`}>
      {children}
    </Link>
  );
}

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-surface/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-sm font-semibold tracking-tight">
              Cloud Budget Guard
            </Link>
            <span className="hidden text-xs text-muted-foreground sm:inline">
              prevent cloud bill surprises
            </span>
          </div>

          <nav className="hidden items-center gap-1 md:flex">
            <NavLink href="/">Product</NavLink>
            <NavLink href="/pricing">Pricing</NavLink>
            <NavLink href="/security">Security</NavLink>
          </nav>

          <div className="flex items-center gap-2">
            <LinkButton href="/login" variant="secondary" size="sm">
              Sign in
            </LinkButton>
            <LinkButton href="/signup" variant="primary" size="sm">
              Get started
            </LinkButton>
          </div>
        </div>
      </header>

      {/* Page */}
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>© {new Date().getFullYear()} Cloud Budget Guard</p>
          <div className="flex items-center gap-3">
            <Link href="/security" className="hover:text-foreground transition">
              Trust & Security
            </Link>
            <Link href="/pricing" className="hover:text-foreground transition">
              Pricing
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
