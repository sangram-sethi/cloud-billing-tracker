import Link from "next/link";

export function BrandMark({ href = "/" }: { href?: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-xl outline-none transition-[transform,opacity] duration-200 ease-(--ease-snappy) hover:opacity-95 active:scale-[0.99]"
    >
      <div className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-surface/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
        <span className="text-sm font-black tracking-tight">cb</span>
      </div>
      <span className="text-sm font-semibold tracking-tight">CloudBudgetGuard</span>
    </Link>
  );
}
