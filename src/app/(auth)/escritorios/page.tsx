import { type Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthCard } from "@/components/layout/auth-card";
import { SignOutButton } from "@/features/auth/components/sign-out-button";
import { TenantPicker } from "@/features/tenants/components/tenant-picker";
import { requireSession } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Escolher escritório" };

export default async function TenantsPage() {
  const ctx = await requireSession("/escritorios");
  if (ctx.memberships.length === 0) redirect("/sem-acesso");

  return (
    <AuthCard
      title="Escolha o escritório"
      description="Você tem acesso a mais de um escritório. Os dados de cada um ficam sempre separados."
      footer={<SignOutButton variant="link" />}
    >
      <TenantPicker memberships={ctx.memberships} />
    </AuthCard>
  );
}
