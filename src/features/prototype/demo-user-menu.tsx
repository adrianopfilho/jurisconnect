"use client";

import { LogOut, Repeat, UserRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function DemoUserMenu({
  name,
  roleLabel,
  switchHref,
  switchLabel,
}: {
  name: string;
  roleLabel: string;
  switchHref: string;
  switchLabel: string;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Menu do usuário">
          <UserRound aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="grid gap-0.5">
          <span className="truncate">{name}</span>
          <span className="text-xs font-normal text-accent">{roleLabel} · demonstração</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <a href={switchHref}>
            <Repeat aria-hidden />
            {switchLabel}
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a href="/prototipo/sair">
            <LogOut aria-hidden />
            Sair da demonstração
          </a>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
