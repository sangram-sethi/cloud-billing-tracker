"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavLinkProps = {
  href: string;
  children: React.ReactNode;
  className?: string;
  activeClassName?: string;
  exact?: boolean; // if false, "/pricing/foo" also counts active for "/pricing"
};

export default function NavLink({
  href,
  children,
  className = "",
  activeClassName = "text-zinc-900",
  exact = false,
}: NavLinkProps) {
  const pathname = usePathname();

  const isActive = exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");

  return (
    <Link
      href={href}
      className={[
        "text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors",
        className,
        isActive ? activeClassName : "",
      ].join(" ")}
    >
      {children}
    </Link>
  );
}
