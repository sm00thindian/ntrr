"use server";

import { revalidatePath } from "next/cache";

import { requireHouseholdContext } from "@/lib/households/context";
import { createClient } from "@/lib/supabase/server";

export async function dismissAiInsight(insightId: string) {
  const ctx = await requireHouseholdContext();
  const supabase = await createClient();

  const { error } = await supabase
    .from("ai_insights")
    .update({ dismissed_at: new Date().toISOString() })
    .eq("id", insightId)
    .eq("household_id", ctx.householdId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard");
  return { success: true };
}

export async function snoozeAiInsight(insightId: string, hours: number) {
  const ctx = await requireHouseholdContext();
  const supabase = await createClient();

  const snoozedUntil = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();

  const { error } = await supabase
    .from("ai_insights")
    .update({ snoozed_until: snoozedUntil })
    .eq("id", insightId)
    .eq("household_id", ctx.householdId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard");
  return { success: true };
}