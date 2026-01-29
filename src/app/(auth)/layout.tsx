import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (session?.user) redirect("/app");

  return (
    <div className="relative min-h-svh overflow-hidden bg-background">
      {/* Ambient, subtle “Apple dark” background (not pointer-follow) */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 left-1/2 h-130 w-205 -translate-x-1/2 rounded-full bg-white/[0.035] blur-3xl" />
        <div className="absolute -bottom-40 -left-30 h-130 w-130 rounded-full bg-white/3 blur-3xl" />
        <div className="absolute -bottom-44 -right-45 h-155 w-155 rounded-full bg-white/2.5 blur-3xl" />

        {/* Center watermark (kept behind the card; card is opaque enough so it won’t show through) */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="select-none text-center text-[42px] font-semibold tracking-tight text-white/6 sm:text-[56px]">
            CloudBudgetGuard
          </div>
        </div>
      </div>

      <div className="relative z-10 flex min-h-svh items-center justify-center px-4 py-6">
        {children}
      </div>
    </div>
  );
}
