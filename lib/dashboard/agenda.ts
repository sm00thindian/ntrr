import { getTodayCalendarEvents } from "@/lib/calendar/queries";
import type { AgendaItem } from "@/lib/dashboard/types";
import { getHouseholdTasks } from "@/lib/tasks/queries";

function isTaskActiveToday(dueAt: string | null, status: string, dayStart: Date, dayEnd: Date) {
  if (status === "done" || status === "cancelled") {
    return false;
  }

  if (!dueAt) {
    return status === "todo" || status === "in_progress";
  }

  const due = new Date(dueAt);
  return due >= dayStart && due < dayEnd;
}

export async function getTodayAgenda(householdId: string): Promise<AgendaItem[]> {
  const dayStart = new Date();
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);

  const [tasks, events] = await Promise.all([
    getHouseholdTasks(householdId),
    getTodayCalendarEvents(householdId),
  ]);

  const taskItems: AgendaItem[] = tasks
    .filter((task) => isTaskActiveToday(task.dueAt, task.status, dayStart, dayEnd))
    .map((task) => ({
      id: `task-${task.id}`,
      kind: "task" as const,
      title: task.title,
      sortAt: task.dueAt ?? dayStart.toISOString(),
      source: task.provenance.source,
      status: task.status,
      href: "/tasks",
    }));

  const eventItems: AgendaItem[] = events.map((event) => ({
    id: `event-${event.id}`,
    kind: "event" as const,
    title: event.title,
    sortAt: event.startsAt,
    endsAt: event.endsAt,
    allDay: event.allDay,
    location: event.location,
    source: event.provenance.source,
    href: "/calendar",
  }));

  return [...taskItems, ...eventItems].sort(
    (a, b) => new Date(a.sortAt).getTime() - new Date(b.sortAt).getTime(),
  );
}