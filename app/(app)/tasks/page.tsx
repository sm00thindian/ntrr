import { redirect } from "next/navigation";

import { TaskBoard } from "@/components/tasks/task-board";
import { requireHouseholdContext } from "@/lib/households/context";
import { getHouseholdMembers } from "@/lib/households/queries";
import { getHouseholdTasks, getRecurringTemplates } from "@/lib/tasks/queries";

export default async function TasksPage() {
  const ctx = await requireHouseholdContext();
  const canEdit = ctx.role !== "viewer";

  const [tasks, templates, members] = await Promise.all([
    getHouseholdTasks(ctx.householdId),
    getRecurringTemplates(ctx.householdId),
    getHouseholdMembers(ctx.householdId),
  ]);

  if (!members.length) {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Tasks</h1>
        <p className="mt-1 text-muted-foreground">
          {ctx.householdName} · shared family task board
        </p>
      </div>

      <TaskBoard
        householdId={ctx.householdId}
        tasks={tasks}
        templates={templates}
        members={members}
        canEdit={canEdit}
      />
    </div>
  );
}