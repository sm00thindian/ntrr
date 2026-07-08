"use client";

import { useTransition } from "react";
import { LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/auth/actions";

export function SignOutButton({
  variant = "outline",
  className,
}: {
  variant?: "outline" | "ghost";
  className?: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant={variant}
      size={variant === "ghost" ? "icon" : "sm"}
      className={className}
      disabled={pending}
      onClick={() => startTransition(() => signOut())}
      aria-label="Sign out"
    >
      <LogOut className="h-4 w-4" />
      {variant === "outline" ? <span>Sign out</span> : null}
    </Button>
  );
}