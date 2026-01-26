"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavLinkProps = {
  href: string;
  children: React.ReactNode;
  className?: string;
  activeClassName?: string;
  exact?: boolean;
};

export default function NavLink({
  href,
  children,
  className = "",
  activeClassName = "text-foreground",
  exact = false,
}: NavLinkProps) {
  const pathname = usePathname();
  const isActive = exact
    ? pathname === href
    : pathname === href || pathname.startsWith(href + "/");

  return (
    <Link
      href={href}
      className={[
        "text-sm font-medium text-muted-foreground hover:text-foreground transition-colors",
        className,
        isActive ? activeClassName : "",
      ].join(" ")}
    >
      {children}
    </Link>
  );
}
