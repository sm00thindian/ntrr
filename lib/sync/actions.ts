"use server";

import { revalidatePath } from "next/cache";

import { requireHouseholdContext } from "@/lib/households/context";
import { createAdminClient } from "@/lib/supabase/admin";

type ConflictResolution = "keep_local" | "keep_remote";

export async function resolveSyncConflict(conflictId: string, resolution: ConflictResolution) {
  const ctx = await requireHouseholdContext();
  const admin = createAdminClient();

  const { data: conflict, error } = await admin
    .from("sync_conflicts")
    .select("*")
    .eq("id", conflictId)
    .eq("household_id", ctx.householdId)
    .eq("status", "pending")
    .maybeSingle();

  if (error || !conflict) {
    return { error: "Conflict not found." };
  }

  const fieldName = conflict.field_name as string;
  const remoteValue = conflict.remote_value;
  const localValue = conflict.local_value;

  if (conflict.entity_type === "task") {
    const updates: Record<string, unknown> = {};

    if (resolution === "keep_remote") {
      if (fieldName === "title" && typeof remoteValue === "string") {
        updates.title = remoteValue;
      }
      if (fieldName === "status" && typeof remoteValue === "string") {
        updates.status = remoteValue;
      }
    } else if (resolution === "keep_local") {
      if (fieldName === "title" && typeof localValue === "string") {
        updates.title = localValue;
      }
      if (fieldName === "status" && typeof localValue === "string") {
        updates.status = localValue;
      }
    }

    if (Object.keys(updates).length) {
      await admin
        .from("tasks")
        .update({
          ...updates,
          provenance: {
            source: "ntrr",
            syncedAt: new Date().toISOString(),
            confidence: "high",
            lastModifiedBy: "user",
          },
        })
        .eq("id", conflict.entity_id);
    }
  }

  if (conflict.entity_type === "calendar_event") {
    if (resolution === "keep_remote" && fieldName === "title" && typeof remoteValue === "string") {
      await admin
        .from("calendar_events")
        .update({
          title: remoteValue,
          provenance: {
            source: "ntrr",
            syncedAt: new Date().toISOString(),
            confidence: "high",
            lastModifiedBy: "user",
          },
        })
        .eq("id", conflict.entity_id);
    }
  }

  await admin
    .from("sync_conflicts")
    .update({
      status: "resolved",
      resolution,
      resolved_by: ctx.userId,
      resolved_at: new Date().toISOString(),
    })
    .eq("id", conflictId);

  revalidatePath("/conflicts");
  revalidatePath("/dashboard");
  revalidatePath("/tasks");

  return { success: true };
}