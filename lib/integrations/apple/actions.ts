"use server";

import { revalidatePath } from "next/cache";

import { encryptJson } from "@/lib/integrations/crypto";
import { verifyAppleCalDavConnection } from "@/lib/integrations/apple/caldav-client";
import { requireHouseholdContext } from "@/lib/households/context";
import { canManageIntegrations } from "@/lib/permissions/roles";
import { pullAppleCalDavCalendar } from "@/lib/sync/apple/caldav";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function connectAppleCalDav(formData: FormData) {
  const ctx = await requireHouseholdContext();

  if (!canManageIntegrations(ctx.role)) {
    return { error: "You do not have permission to manage integrations." };
  }

  const appleId = String(formData.get("appleId") ?? "").trim();
  const appPassword = String(formData.get("appPassword") ?? "").trim().replace(/\s+/g, "");

  if (!appleId || !appPassword) {
    return { error: "Apple ID and app-specific password are required." };
  }

  try {
    const discovered = await verifyAppleCalDavConnection(appleId, appPassword);
    const admin = createAdminClient();

    const { error } = await admin.from("integration_accounts").upsert(
      {
        household_id: ctx.householdId,
        provider: "apple_caldav",
        status: "connected",
        scopes: ["caldav-calendar"],
        metadata: {
          apple: {
            credentials: encryptJson({ appleId, appPassword }),
            caldav: {
              calendarUrl: discovered.calendarUrl,
              calendarName: discovered.calendarName,
            },
          },
        },
        created_by: ctx.userId,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "household_id,provider" },
    );

    if (error) {
      return { error: error.message };
    }

    const { data: account } = await admin
      .from("integration_accounts")
      .select("id, household_id, provider, status, scopes, metadata, created_by, created_at, updated_at")
      .eq("household_id", ctx.householdId)
      .eq("provider", "apple_caldav")
      .single();

    if (account) {
      await pullAppleCalDavCalendar({
        id: account.id,
        householdId: account.household_id,
        provider: "apple_caldav",
        status: account.status,
        scopes: account.scopes,
        metadata: account.metadata as import("@/lib/integrations/types").IntegrationMetadata,
        createdBy: account.created_by,
        createdAt: account.created_at,
        updatedAt: account.updated_at,
      });
    }

    revalidatePath("/settings");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not connect Apple CalDAV.";
    return { error: message };
  }
}

export async function disconnectAppleCalDav() {
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
    .eq("provider", "apple_caldav");

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  return { success: true };
}