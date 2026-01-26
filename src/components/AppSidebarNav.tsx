"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Plug, FileText, Settings } from "lucide-react";

function cn(...classes: Array<string | undefined | false>) {
  return classes.filter(Boolean).join(" ");
}

type NavItem = {
  label: string;
  href: string;
  exact?: boolean;
  icon: React.ComponentType<{ className?: string }>;
};

const items: NavItem[] = [
  { label: "Dashboard", href: "/app", exact: true, icon: LayoutDashboard },
  { label: "Connect AWS", href: "/app/connect-aws", icon: Plug },
  { label: "Reports", href: "/app/reports", icon: FileText },
  { label: "Settings", href: "/app/settings", icon: Settings },
];

export default function AppSidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1">
      {items.map((item) => {
        const isActive = item.exact
          ? pathname === item.href
          : pathname === item.href || pathname.startsWith(item.href + "/");

        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "group relative flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition",
              isActive
                ? "bg-surface-2 text-foreground"
                : "text-muted-foreground hover:bg-surface-2 hover:text-foreground"
            )}
          >
            {/* Left indicator */}
            <span
              className={cn(
                "absolute left-0 top-2 bottom-2 w-0.75 rounded-full transition-opacity",
                isActive ? "bg-primary opacity-100" : "bg-primary opacity-0 group-hover:opacity-40"
              )}
            />
            <Icon className="h-4 w-4 shrink-0 opacity-80" />
            <span className="pl-1">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
