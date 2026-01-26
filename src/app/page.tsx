import Container from "@/components/Container";
import NavLink from "@/components/NavLink";
import MarketingHeader from "@/components/MarketingHeader";
import MarketingFooter from "@/components/MarketingFooter";

export default function Home() {
  return (
    <main className="py-12">
      <Container>
        <nav className="flex gap-6">
          <NavLink href="/" exact>
            Home
          </NavLink>
          <NavLink href="/pricing">Pricing</NavLink>
          <NavLink href="/security">Security</NavLink>
        </nav>
        
        <h1 className="mt-8 text-3xl font-bold">It works ✅</h1>
      </Container>
    </main>
  );
}
