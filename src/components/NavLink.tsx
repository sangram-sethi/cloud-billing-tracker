"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

type Props = {
  href: string;
  children: React.ReactNode;
  className?: string;
  exact?: boolean;
};

export function NavLink({ href, children, className, exact = false }: Props) {
  const pathname = usePathname();
  const active = exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative inline-flex items-center justify-center rounded-full px-3 py-1.5 text-sm font-medium",
        "transition-[transform,background-color,border-color,color,box-shadow] duration-200 ease-(--ease-snappy)",
        "active:scale-[0.99]",
        active
          ? [
              "text-foreground",
              "border border-white/12 bg-white/6",
              "shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]",
              "ring-1 ring-primary/14",
              // tiny underline glow
              "after:absolute after:inset-x-3 after:-bottom-1 after:h-px after:rounded-full",
              "after:bg-[linear-gradient(90deg,transparent,rgba(124,58,237,0.55),rgba(16,185,129,0.35),transparent)]",
            ].join(" ")
          : "border border-transparent text-muted-foreground hover:text-foreground hover:bg-white/4",
        className
      )}
    >
      {children}
    </Link>
  );
}
