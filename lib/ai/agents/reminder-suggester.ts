import { dismissInsightByDedupe, upsertInsight } from "@/lib/ai/insights";
import { createAdminClient } from "@/lib/supabase/admin";

const UNASSIGNED_KEY = "unassigned-tasks";
const OVERDUE_KEY = "overdue-tasks";

export async function runReminderSuggesterAgent(householdId: string) {
  const admin = createAdminClient();
  const now = new Date().toISOString();

  const { data: tasks } = await admin
    .from("tasks")
    .select("id, title, assignee_id, due_at, status")
    .eq("household_id", householdId)
    .in("status", ["todo", "in_progress"]);

  const active = tasks ?? [];
  const unassigned = active.filter((task) => !task.assignee_id);
  const overdue = active.filter(
    (task) => task.due_at && task.due_at < now,
  );

  if (unassigned.length === 0) {
    await dismissInsightByDedupe(householdId, "reminder", UNASSIGNED_KEY);
  } else {
    await upsertInsight({
      householdId,
      type: "reminder",
      dedupeKey: UNASSIGNED_KEY,
      payload: {
        title: `${unassigned.length} task${unassigned.length === 1 ? "" : "s"} unassigned`,
        body:
          unassigned.length === 1
            ? `"${unassigned[0]?.title}" has no owner yet.`
            : "Assign owners so your family knows who is handling what.",
        actionHref: "/tasks",
        severity: "info",
      },
    });
  }

  if (overdue.length === 0) {
    await dismissInsightByDedupe(householdId, "reminder", OVERDUE_KEY);
  } else {
    await upsertInsight({
      householdId,
      type: "reminder",
      dedupeKey: OVERDUE_KEY,
      payload: {
        title: `${overdue.length} overdue task${overdue.length === 1 ? "" : "s"}`,
        body:
          overdue.length === 1
            ? `"${overdue[0]?.title}" is past due.`
            : "Review overdue items and update status or due dates.",
        actionHref: "/tasks",
        severity: "warning",
      },
    });
  }

  return { unassigned: unassigned.length, overdue: overdue.length };
}