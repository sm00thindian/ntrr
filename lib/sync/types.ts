import type { ProvenanceSource } from "@/lib/provenance/types";

export type SyncProvider = Extract<ProvenanceSource, "google" | "microsoft" | "apple_caldav" | "zapier">;

export type SyncEntityType = "calendar_event" | "task";

export type SyncEntity = {
  id: string;
  householdId: string;
  entityType: SyncEntityType;
  provider: SyncProvider;
  externalId: string;
  etag?: string;
  updatedAt: string;
};

export type OutboxEntry = {
  id: string;
  entityId: string;
  provider: SyncProvider;
  operation: "create" | "update" | "delete";
  payload: Record<string, unknown>;
  attempts: number;
  createdAt: string;
};