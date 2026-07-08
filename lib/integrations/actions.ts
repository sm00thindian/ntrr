"use server";

import { revalidatePath } from "next/cache";

import { requireHouseholdContext } from "@/lib/households/context";
import { canManageIntegrations } from "@/lib/permissions/roles";
import { runGoogleSync } from "@/lib/sync/orchestrator";
import { createClient } from "@/lib/supabase/server";

export async function disconnectGoogle() {
  const ctx = await requireHouseholdContext();

  if (!canManageIntegrations(ctx.role)) {
    return { error: "You do not have permission to manage integrations." };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("integration_accounts")
    .update({
      status: "disconnected",
      metadata: {},
      updated_at: new Date().toISOString(),
    })
    .eq("household_id", ctx.householdId)
    .eq("provider", "google");

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function syncGoogleNow() {
  const ctx = await requireHouseholdContext();

  if (!canManageIntegrations(ctx.role)) {
    return { error: "You do not have permission to sync integrations." };
  }

  const result = await runGoogleSync(ctx.householdId);

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  revalidatePath("/tasks");
  revalidatePath("/conflicts");

  if (result.skipped) {
    return { error: "Google is not connected." };
  }

  if (!result.success) {
    return { error: result.error ?? "Sync failed." };
  }

  return { success: true };
}