import { MarketingHeader } from "@/components/MarketingHeader";
import { MarketingFooter } from "@/components/MarketingFooter";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh">
      <MarketingHeader />
      <main className="pt-10">{children}</main>
      <MarketingFooter />
    </div>
  );
}
