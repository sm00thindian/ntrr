import { MapPin } from "lucide-react";

import { SourceChip } from "@/components/provenance/source-chip";
import type { CalendarEvent } from "@/lib/calendar/types";
import { cn } from "@/lib/utils";

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatEventTime(event: CalendarEvent) {
  if (event.allDay) {
    return "All day";
  }

  const start = formatTime(event.startsAt);
  const end = formatTime(event.endsAt);
  return `${start} – ${end}`;
}

export function CalendarEventCard({ event }: { event: CalendarEvent }) {
  return (
    <article
      className={cn(
        "rounded-xl border px-3 py-2.5",
        event.provenance.source === "ntrr" ? "border-brand/30 bg-brand/5" : "bg-card",
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <p className="min-w-0 flex-1 truncate text-sm font-medium">{event.title}</p>
        <SourceChip source={event.provenance.source} />
      </div>
      <p className="text-muted-foreground mt-1 text-xs">
        {event.provenance.calendarName ? `${event.provenance.calendarName} · ` : ""}
        {formatEventTime(event)}
      </p>
      {event.location ? (
        <p className="text-muted-foreground mt-1 flex items-center gap-1 text-xs">
          <MapPin className="h-3 w-3 shrink-0" aria-hidden="true" />
          <span className="truncate">{event.location}</span>
        </p>
      ) : null}
    </article>
  );
}