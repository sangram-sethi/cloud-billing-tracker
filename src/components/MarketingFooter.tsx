import Container from "@/components/Container";

export default function MarketingFooter() {
  return (
    <footer className="border-t border-zinc-200">
      <Container className="flex flex-col gap-3 py-10 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-zinc-600">
          © {new Date().getFullYear()} Cloud Budget Guard. All rights reserved.
        </p>
        <div className="flex items-center gap-6 text-sm text-zinc-600">
          <a className="hover:text-zinc-900 transition-colors" href="/security">
            Security
          </a>
          <a className="hover:text-zinc-900 transition-colors" href="/pricing">
            Pricing
          </a>
          <a className="hover:text-zinc-900 transition-colors" href="/login">
            Sign in
          </a>
        </div>
      </Container>
    </footer>
  );
}
