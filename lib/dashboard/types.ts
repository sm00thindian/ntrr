import type { ProvenanceSource } from "@/lib/provenance/types";
import type { TaskStatus } from "@/lib/tasks/types";

export type AgendaItemKind = "task" | "event";

export type AgendaItem = {
  id: string;
  kind: AgendaItemKind;
  title: string;
  sortAt: string;
  endsAt?: string;
  allDay?: boolean;
  location?: string | null;
  source: ProvenanceSource;
  status?: TaskStatus;
  href?: string;
};