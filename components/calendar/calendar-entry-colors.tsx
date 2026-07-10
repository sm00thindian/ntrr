"use client";

import type { ResolvedEntryColors } from "@/lib/calendar/colors";
import { cn } from "@/lib/utils";

type CalendarEntryColorsProps = {
  colors: ResolvedEntryColors;
  className?: string;
};

export function CalendarEntryColors({ colors, className }: CalendarEntryColorsProps) {
  return (
    <div className={cn("flex w-2 shrink-0 items-stretch gap-0.5", className)} aria-hidden="true">
      <span
        className="w-1.5 rounded-full"
        style={{ backgroundColor: colors.memberColor }}
      />
      {colors.showCalendarAccent && colors.calendarColor ? (
        <span
          className="w-1 rounded-full"
          style={{ backgroundColor: colors.calendarColor }}
        />
      ) : null}
    </div>
  );
}