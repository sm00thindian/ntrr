const DAY_MS = 24 * 60 * 60 * 1000;

export function startOfWeek(date: Date, weekStartsOn: 0 | 1 = 0): Date {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const day = start.getDay();
  const diff = (day - weekStartsOn + 7) % 7;
  start.setDate(start.getDate() - diff);
  return start;
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function parseWeekParam(week?: string): Date {
  if (!week) {
    return startOfWeek(new Date());
  }

  const parsed = new Date(`${week}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return startOfWeek(new Date());
  }

  return startOfWeek(parsed);
}

export function toDayParam(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function toWeekParam(date: Date): string {
  return toDayParam(startOfWeek(date));
}

export function getWeekBounds(anchor: Date) {
  const weekStart = startOfWeek(anchor);
  const weekEnd = addDays(weekStart, 7);
  const days = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));

  return {
    weekStart,
    weekEnd,
    days,
    rangeStart: weekStart.toISOString(),
    rangeEnd: weekEnd.toISOString(),
  };
}

export function formatWeekRange(days: Date[]): string {
  if (!days.length) {
    return "";
  }

  const first = days[0]!;
  const last = days[days.length - 1]!;

  const sameMonth = first.getMonth() === last.getMonth();
  const sameYear = first.getFullYear() === last.getFullYear();

  if (sameMonth && sameYear) {
    const monthYear = first.toLocaleDateString(undefined, { month: "long", year: "numeric" });
    return `${monthYear} · ${first.getDate()}–${last.getDate()}`;
  }

  const startLabel = first.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: sameYear ? undefined : "numeric",
  });

  const endLabel = last.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return `${startLabel} – ${endLabel}`;
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function eventOccursOnDay(
  startsAt: string,
  endsAt: string,
  day: Date,
  allDay?: boolean,
): boolean {
  const dayStart = new Date(day);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);

  const start = new Date(startsAt);
  const end = new Date(endsAt);

  if (allDay) {
    const eventDay = startsAt.slice(0, 10);
    const targetDay = dayStart.toISOString().slice(0, 10);
    return eventDay === targetDay;
  }

  return start < dayEnd && end > dayStart;
}

export function shiftWeek(anchor: Date, weeks: number): Date {
  return new Date(anchor.getTime() + weeks * 7 * DAY_MS);
}