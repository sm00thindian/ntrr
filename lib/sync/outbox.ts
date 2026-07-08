import type { SyncEntityType } from "@/lib/sync/types";
import type { IntegrationAccount } from "@/lib/integrations/types";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/lib/supabase/database.types";

function asJson(value: Record<string, unknown>): Json {
  return value as Json;
}

const MAX_ATTEMPTS = 5;

export async function enqueueSyncOutbox(params: {
  householdId: string;
  provider: IntegrationAccount["provider"];
  entityType: SyncEntityType;
  entityId: string;
  operation: "create" | "update" | "delete";
  payload?: Record<string, unknown>;
}) {
  const admin = createAdminClient();

  const { data: existing } = await admin
    .from("sync_outbox")
    .select("id")
    .eq("household_id", params.householdId)
    .eq("provider", params.provider)
    .eq("entity_type", params.entityType)
    .eq("entity_id", params.entityId)
    .eq("status", "pending")
    .maybeSingle();

  if (existing?.id) {
    await admin
      .from("sync_outbox")
      .update({
        operation: params.operation,
        payload: asJson(params.payload ?? {}),
        scheduled_at: new Date().toISOString(),
      })
      .eq("id", existing.id);
    return;
  }

  await admin.from("sync_outbox").insert({
    household_id: params.householdId,
    provider: params.provider,
    entity_type: params.entityType,
    entity_id: params.entityId,
    operation: params.operation,
    payload: asJson(params.payload ?? {}),
    status: "pending",
  });
}

export async function fetchPendingOutbox(householdId: string, provider: IntegrationAccount["provider"]) {
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("sync_outbox")
    .select("*")
    .eq("household_id", householdId)
    .eq("provider", provider)
    .eq("status", "pending")
    .lte("scheduled_at", new Date().toISOString())
    .order("created_at", { ascending: true })
    .limit(25);

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function markOutboxProcessing(id: string) {
  const admin = createAdminClient();
  await admin.from("sync_outbox").update({ status: "processing" }).eq("id", id);
}

export async function markOutboxDone(id: string) {
  const admin = createAdminClient();
  await admin.from("sync_outbox").update({ status: "done" }).eq("id", id);
}

export async function markOutboxFailed(id: string, attempts: number, message: string) {
  const admin = createAdminClient();
  const nextAttempts = attempts + 1;
  const status = nextAttempts >= MAX_ATTEMPTS ? "failed" : "pending";
  const delayMinutes = Math.min(30, 2 ** nextAttempts);

  await admin
    .from("sync_outbox")
    .update({
      status,
      attempts: nextAttempts,
      last_error: message,
      scheduled_at: new Date(Date.now() + delayMinutes * 60_000).toISOString(),
    })
    .eq("id", id);
}