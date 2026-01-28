import { Container } from "@/components/Container";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (session?.user) redirect("/app");

  return (
    <div className="min-h-dvh">
      <Container className="py-16">
        <div className="mx-auto max-w-md">{children}</div>
      </Container>
    </div>
  );
}
