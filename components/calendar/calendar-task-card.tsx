import Link from "next/link";
import { ListTodo } from "lucide-react";

import { SourceChip } from "@/components/provenance/source-chip";
import type { CalendarTask } from "@/lib/calendar/types";
import { TASK_STATUS_LABELS } from "@/lib/tasks/types";

function formatDueTime(dueAt: string) {
  return new Date(dueAt).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function CalendarTaskCard({ task }: { task: CalendarTask }) {
  const hasTime = !dueAtIsMidnight(task.dueAt);

  return (
    <Link
      href="/tasks"
      className="block rounded-xl border border-dashed border-brand/40 bg-brand/5 px-3 py-2.5 transition-colors hover:bg-brand/10"
    >
      <div className="flex items-start gap-2">
        <ListTodo className="text-brand mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="min-w-0 flex-1 truncate text-sm font-medium">{task.title}</p>
            <SourceChip source={task.provenance.source} />
          </div>
          <p className="text-muted-foreground mt-1 text-xs">
            Task · {TASK_STATUS_LABELS[task.status]}
            {hasTime ? ` · Due ${formatDueTime(task.dueAt)}` : ""}
          </p>
        </div>
      </div>
    </Link>
  );
}

function dueAtIsMidnight(dueAt: string) {
  const date = new Date(dueAt);
  return date.getHours() === 0 && date.getMinutes() === 0;
}