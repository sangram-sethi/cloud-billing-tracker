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
      className={cn(
        "text-sm font-medium transition-colors ease-(--ease-snappy) " +
          "text-muted-foreground hover:text-foreground",
        active && "text-foreground",
        className
      )}
    >
      {children}
    </Link>
  );
}
