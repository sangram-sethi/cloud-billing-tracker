import { GlowCard } from "@/components/ui/GlowCard";
import { CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { BrandMark } from "@/components/BrandMark";

export function AuthShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-md">
      <div className="mb-6 flex items-center justify-center">
        <BrandMark href="/" />
      </div>

      <GlowCard glowRgb="124 58 237">
        <CardHeader>
          <CardTitle className="text-lg">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>

        <CardContent>
          {children}

          {/* branding strip similar vibe to marketing bottom */}
          <div className="mt-6 rounded-2xl border border-white/10 bg-surface/30 p-4">
            <p className="text-xs font-semibold text-foreground">CloudBudgetGuard</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Premium-grade spend tracking, anomaly alerts, and weekly founder reports.
            </p>
            <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
              <a className="hover:text-foreground transition" href="/privacy">Privacy</a>
              <span className="text-white/10">•</span>
              <a className="hover:text-foreground transition" href="/terms">Terms</a>
            </div>
          </div>
        </CardContent>
      </GlowCard>
    </div>
  );
}
