"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function SignOutButton({
  className,
  callbackUrl = "/",
}: {
  className?: string;
  callbackUrl?: string;
}) {
  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      className={className}
      onClick={() => signOut({ callbackUrl })}
    >
      <LogOut className="h-4 w-4" />
      Sign out
    </Button>
  );
}
