import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type CalendarViewOption = "5" | "7" | "month";

type CalendarViewNavProps = {
  view: CalendarViewOption;
  periodLabel: string;
  prevHref: string;
  nextHref: string;
  todayHref: string;
  viewHrefs: Record<CalendarViewOption, string>;
};

const viewOptions: { value: CalendarViewOption; label: string }[] = [
  { value: "5", label: "5 day" },
  { value: "7", label: "7 day" },
  { value: "month", label: "Month" },
];

export function CalendarViewNav({
  view,
  periodLabel,
  prevHref,
  nextHref,
  todayHref,
  viewHrefs,
}: CalendarViewNavProps) {
  const prevLabel =
    view === "month" ? "Previous month" : view === "5" ? "Previous work week" : "Previous week";
  const nextLabel =
    view === "month" ? "Next month" : view === "5" ? "Next work week" : "Next week";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Calendar</h1>
          <p className="mt-1 text-muted-foreground">{periodLabel}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div
            className="bg-muted inline-flex rounded-xl p-1"
            role="tablist"
            aria-label="Calendar view"
          >
            {viewOptions.map((option) => (
              <Link
                key={option.value}
                href={viewHrefs[option.value]}
                role="tab"
                aria-selected={view === option.value}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                  view === option.value
                    ? "bg-foreground text-background shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {option.label}
              </Link>
            ))}
          </div>
          <Button asChild variant="outline" size="icon" aria-label={prevLabel}>
            <Link href={prevHref}>
              <ChevronLeft className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href={todayHref}>Today</Link>
          </Button>
          <Button asChild variant="outline" size="icon" aria-label={nextLabel}>
            <Link href={nextHref}>
              <ChevronRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex">
            <Link href="/settings">Integrations</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}