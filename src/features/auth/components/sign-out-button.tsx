"use client";

import { LogOut } from "lucide-react";
import { useTransition } from "react";

import { Button } from "@/components/ui/button";

import { signOutAction } from "../actions";

export function SignOutButton({ variant = "ghost" }: { variant?: "ghost" | "link" | "outline" }) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant={variant}
      size="sm"
      disabled={pending}
      onClick={() => startTransition(() => signOutAction())}
    >
      <LogOut aria-hidden />
      Sair
    </Button>
  );
}
