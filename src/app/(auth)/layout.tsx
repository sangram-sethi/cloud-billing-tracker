import { Container } from "@/components/Container";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh">
      <Container className="py-16">
        <div className="mx-auto max-w-md">{children}</div>
      </Container>
    </div>
  );
}
