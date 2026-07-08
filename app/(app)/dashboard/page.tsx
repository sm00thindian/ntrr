import Link from "next/link";
import { redirect } from "next/navigation";

import { FamilyStatusPanel } from "@/components/family/family-status-panel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateHouseholdForm } from "@/components/household/create-household-form";
import { getFamilyStatus, getUserMembership } from "@/lib/households/queries";
import { getPendingConflictCount } from "@/lib/sync/conflict";
import { getTodayTaskCount } from "@/lib/tasks/queries";
import { upsertProfile } from "@/lib/profiles/actions";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  if (user.email) {
    await upsertProfile(user);
  }

  const membership = await getUserMembership(user.id);

  if (!membership) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Welcome to ntrr</h1>
          <p className="mt-2 text-muted-foreground">
            Create a household to unlock your coordination dashboard.
          </p>
        </div>
        <CreateHouseholdForm />
      </div>
    );
  }

  const [familyStatus, todayTaskCount, conflictCount] = await Promise.all([
    getFamilyStatus(membership.householdId, user.id),
    getTodayTaskCount(membership.householdId),
    getPendingConflictCount(membership.householdId),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Today</h1>
        <p className="mt-1 text-muted-foreground">
          {membership.householdName} · {membership.role}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Today&apos;s priorities</CardTitle>
            <CardDescription>Tasks and events that need attention now.</CardDescription>
          </CardHeader>
          <CardContent>
            {todayTaskCount > 0 ? (
              <p className="text-sm">
                <span className="text-2xl font-semibold">{todayTaskCount}</span>{" "}
                <span className="text-muted-foreground">
                  task{todayTaskCount === 1 ? "" : "s"} due or active today
                </span>
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                No urgent tasks today. Add items on the task board.
              </p>
            )}
          </CardContent>
        </Card>

        <FamilyStatusPanel status={familyStatus} />

        <Card className="md:col-span-2 xl:col-span-1">
          <CardHeader>
            <CardTitle>Sync status</CardTitle>
            <CardDescription>Google Calendar + Tasks conflicts need your confirmation.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {conflictCount > 0 ? (
              <>
                <p className="text-sm">
                  <span className="text-brand text-2xl font-semibold">{conflictCount}</span>{" "}
                  <span className="text-muted-foreground">
                    pending conflict{conflictCount === 1 ? "" : "s"}
                  </span>
                </p>
                <Link href="/conflicts" className="text-brand text-sm font-medium hover:underline">
                  Review conflicts →
                </Link>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                No sync conflicts. Connect Google in Settings to start bidirectional sync.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}