import { notFound } from "next/navigation";

import { isPrototypeMode } from "@/lib/prototype/mode";

export const metadata = { robots: { index: false, follow: false } };

/** Toda a árvore /prototipo só existe com NEXT_PUBLIC_PROTOTYPE=true. */
export default function PrototypeLayout({ children }: { children: React.ReactNode }) {
  if (!isPrototypeMode()) notFound();
  return children;
}
