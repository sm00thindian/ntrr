import { redirect } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { getUserMembership } from "@/lib/households/queries";
import { createClient } from "@/lib/supabase/server";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const membership = await getUserMembership(user.id);

  return (
    <AppShell
      userEmail={user.email}
      householdName={membership?.householdName}
      householdRole={membership?.role}
    >
      {children}
    </AppShell>
  );
}