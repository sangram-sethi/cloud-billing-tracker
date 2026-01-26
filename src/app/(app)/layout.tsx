import type { ReactNode } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import AppSidebarNav from "@/components/AppSidebarNav";
import PageTransition from "@/components/PageTransition";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-border bg-surface/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-sm font-semibold tracking-tight">
              Cloud Budget Guard
            </Link>
            <span className="text-xs text-muted-foreground">/ app</span>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" type="button">
              Workspace: Demo
            </Button>
            <Button variant="primary" size="sm" type="button">
              Account
            </Button>
          </div>
        </div>
      </header>

      {/* Shell */}
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[240px_1fr] lg:px-8">
        {/* Sidebar (desktop) */}
        <aside className="hidden lg:block">
          <Card className="hover:translate-y-0">
            <div className="p-3">
              <AppSidebarNav />
              <div className="mt-4 rounded-xl border border-border bg-surface-2 p-3">
                <p className="text-xs font-semibold text-foreground">MVP status</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  Mocked dashboard + AWS connect UI. Backend wiring in Week 2.
                </p>
              </div>
            </div>
          </Card>
        </aside>

        {/* Main */}
        <main className="min-w-0"><PageTransition>{children}</PageTransition></main>
      </div>
    </div>
  );
}