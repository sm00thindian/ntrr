import { getConnectedGoogleIntegrationAdmin } from "@/lib/integrations/queries";
import { pullGoogleCalendar, pushGoogleCalendarEvent } from "@/lib/sync/google/calendar";
import { pullGoogleTasks, pushGoogleTask } from "@/lib/sync/google/tasks";
import {
  fetchPendingOutbox,
  markOutboxDone,
  markOutboxFailed,
  markOutboxProcessing,
} from "@/lib/sync/outbox";
import { createAdminClient } from "@/lib/supabase/admin";

export async function runGoogleSync(householdId: string) {
  const account = await getConnectedGoogleIntegrationAdmin(householdId);
  if (!account) {
    return { skipped: true as const, reason: "Google not connected" };
  }

  const admin = createAdminClient();

  try {
    await pullGoogleCalendar(account);
    await pullGoogleTasks(account);

    const outbox = await fetchPendingOutbox(householdId, "google");

    for (const entry of outbox) {
      await markOutboxProcessing(entry.id);

      try {
        if (entry.entity_type === "task") {
          await pushGoogleTask(account, {
            entityId: entry.entity_id,
            operation: entry.operation,
            payload: (entry.payload ?? {}) as Record<string, unknown>,
          });
        } else if (entry.entity_type === "calendar_event") {
          await pushGoogleCalendarEvent(account, {
            entityId: entry.entity_id,
            operation: entry.operation,
            payload: (entry.payload ?? {}) as Record<string, unknown>,
          });
        }

        await markOutboxDone(entry.id);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Sync push failed";
        await markOutboxFailed(entry.id, entry.attempts ?? 0, message);
      }
    }

    await admin
      .from("integration_accounts")
      .update({ status: "connected", updated_at: new Date().toISOString() })
      .eq("id", account.id);

    return { skipped: false as const, success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Google sync failed";

    await admin
      .from("integration_accounts")
      .update({ status: "error", updated_at: new Date().toISOString() })
      .eq("id", account.id);

    return { skipped: false as const, success: false, error: message };
  }
}

export async function runAllGoogleSyncs() {
  const admin = createAdminClient();

  const { data: accounts } = await admin
    .from("integration_accounts")
    .select("household_id")
    .eq("provider", "google")
    .eq("status", "connected");

  const results = [];

  for (const account of accounts ?? []) {
    const result = await runGoogleSync(account.household_id as string);
    results.push({ householdId: account.household_id, ...result });
  }

  return results;
}