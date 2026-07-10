import type { CalendarEvent, CalendarTask } from "@/lib/calendar/types";
import { eventOccursOnDay } from "@/lib/calendar/week";

export type CalendarEntry =
  | { kind: "event"; sortAt: string; event: CalendarEvent }
  | { kind: "task"; sortAt: string; task: CalendarTask };

export function getEntriesForDay(
  day: Date,
  events: CalendarEvent[],
  tasks: CalendarTask[],
): CalendarEntry[] {
  const dayEvents = events
    .filter((event) => eventOccursOnDay(event.startsAt, event.endsAt, day, event.allDay))
    .map((event) => ({ kind: "event" as const, sortAt: event.startsAt, event }));

  const dayTasks = tasks
    .filter((task) => taskOccursOnDay(task.dueAt, day))
    .map((task) => ({ kind: "task" as const, sortAt: task.dueAt, task }));

  return [...dayEvents, ...dayTasks].sort(
    (left, right) => new Date(left.sortAt).getTime() - new Date(right.sortAt).getTime(),
  );
}

function taskOccursOnDay(dueAt: string, day: Date): boolean {
  const dayStart = new Date(day);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);
  const due = new Date(dueAt);
  return due >= dayStart && due < dayEnd;
}

export function formatEntryTime(entry: CalendarEntry) {
  if (entry.kind === "event") {
    if (entry.event.allDay) {
      return "All day";
    }

    const start = formatClock(entry.event.startsAt);
    const end = formatClock(entry.event.endsAt);
    return `${start} – ${end}`;
  }

  if (dueAtIsMidnight(entry.task.dueAt)) {
    return "Due today";
  }

  return `Due ${formatClock(entry.task.dueAt)}`;
}

export function formatEntryTimeCompact(entry: CalendarEntry) {
  if (entry.kind === "event") {
    if (entry.event.allDay) {
      return "All day";
    }

    const start = formatClockCompact(entry.event.startsAt);
    const end = formatClockCompact(entry.event.endsAt);
    return start === end ? start : `${start}–${end}`;
  }

  if (dueAtIsMidnight(entry.task.dueAt)) {
    return "Due today";
  }

  return `Due ${formatClockCompact(entry.task.dueAt)}`;
}

export function formatEntryDate(entry: CalendarEntry) {
  const iso = entry.kind === "event" ? entry.event.startsAt : entry.task.dueAt;
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatClock(iso: string) {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatClockCompact(iso: string) {
  const date = new Date(iso);
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const period = hours >= 12 ? "p" : "a";
  const hour12 = hours % 12 || 12;

  if (minutes === 0) {
    return `${hour12}${period}`;
  }

  return `${hour12}:${minutes.toString().padStart(2, "0")}${period}`;
}

function dueAtIsMidnight(dueAt: string) {
  const date = new Date(dueAt);
  return date.getHours() === 0 && date.getMinutes() === 0;
}

export function getEntryTitle(entry: CalendarEntry) {
  return entry.kind === "event" ? entry.event.title : entry.task.title;
}

export function getEntryDisplayTitle(entry: CalendarEntry) {
  const title = getEntryTitle(entry).trim();
  if (title && title !== "Untitled event" && title !== "Untitled task") {
    return title;
  }

  return entry.kind === "task" ? "Task" : "Event";
}

export function getEntryKey(entry: CalendarEntry) {
  return entry.kind === "event" ? `event-${entry.event.id}` : `task-${entry.task.id}`;
}