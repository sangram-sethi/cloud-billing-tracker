import Link from "next/link";
import Container from "@/components/Container";
import NavLink from "@/components/NavLink";

export default function MarketingHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white/80 backdrop-blur">
      <Container className="flex h-16 items-center justify-between">
        <div className="flex items-center gap-10">
          <Link href="/" className="text-sm font-semibold tracking-tight">
            Cloud Budget Guard
          </Link>

          <nav className="hidden items-center gap-6 md:flex">
            <NavLink href="/" exact>
              Home
            </NavLink>
            <NavLink href="/pricing">Pricing</NavLink>
            <NavLink href="/security">Security</NavLink>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors"
          >
            Sign in
          </Link>
          <Link
            href="/app"
            className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-semibold text-white hover:bg-zinc-800 transition-colors"
          >
            Get started
          </Link>
        </div>
      </Container>
    </header>
  );
}
