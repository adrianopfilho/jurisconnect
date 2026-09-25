import { Scale } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils";

export function Brand({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <Link
      href="/"
      className={cn("flex items-center gap-2 font-heading text-xl font-semibold", className)}
    >
      <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-navy text-gold">
        <Scale className="size-4" aria-hidden />
      </span>
      {!compact && <span>JurisConnect</span>}
    </Link>
  );
}
