import type { TaskStatus } from "@/lib/tasks/types";

export function googleTaskStatusToNtrr(status?: string): TaskStatus {
  if (status === "completed") {
    return "done";
  }
  return "todo";
}

export function ntrrTaskStatusToGoogle(status: TaskStatus): string {
  if (status === "done") {
    return "completed";
  }
  return "needsAction";
}

export function googleDueToIso(due?: string | null): string | null {
  if (!due) {
    return null;
  }
  return new Date(due).toISOString();
}

export function ntrrDueToGoogle(dueAt: string | null): string | undefined {
  if (!dueAt) {
    return undefined;
  }
  return new Date(dueAt).toISOString();
}