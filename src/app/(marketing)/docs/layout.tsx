import { Container } from "@/components/Container";
import { DocsNav } from "@/components/DocsNav";

function DocsGlow() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div
        className="absolute -top-40 left-1/2 h-130 w-205 -translate-x-1/2 rounded-full blur-3xl"
        style={{
          background: "radial-gradient(circle at center, rgba(59,130,246,0.16), transparent 60%)",
        }}
      />
    </div>
  );
}

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <section className="relative">
      <DocsGlow />
      <Container className="py-12">
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.4fr]">
          <div className="lg:sticky lg:top-24 lg:h-[calc(100dvh-8rem)] lg:min-h-0 lg:overflow-hidden">
            <div className="h-full min-h-0 lg:overflow-y-auto lg:pr-1">
              <DocsNav />
            </div>
          </div>

          <div className="min-h-0">
            <div className="rounded-3xl border border-white/10 bg-surface/30 p-6">{children}</div>
          </div>
        </div>
      </Container>
    </section>
  );
}
