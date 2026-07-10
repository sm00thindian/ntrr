import type { InsightPayload, InsightType } from "@/lib/ai/types";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/lib/supabase/database.types";

function asPayload(payload: InsightPayload): Json {
  return payload as Json;
}

export async function upsertInsight(params: {
  householdId: string;
  type: InsightType;
  dedupeKey: string;
  payload: InsightPayload;
}) {
  const admin = createAdminClient();

  const { data: existing } = await admin
    .from("ai_insights")
    .select("id")
    .eq("household_id", params.householdId)
    .eq("type", params.type)
    .eq("dedupe_key", params.dedupeKey)
    .is("dismissed_at", null)
    .maybeSingle();

  if (existing?.id) {
    await admin
      .from("ai_insights")
      .update({
        payload: asPayload(params.payload),
        snoozed_until: null,
        created_at: new Date().toISOString(),
      })
      .eq("id", existing.id);
    return existing.id as string;
  }

  const { data, error } = await admin
    .from("ai_insights")
    .insert({
      household_id: params.householdId,
      type: params.type,
      dedupe_key: params.dedupeKey,
      payload: asPayload(params.payload),
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Could not save AI insight.");
  }

  return data.id as string;
}

export async function dismissInsightByDedupe(
  householdId: string,
  type: InsightType,
  dedupeKey: string,
) {
  const admin = createAdminClient();
  await admin
    .from("ai_insights")
    .update({ dismissed_at: new Date().toISOString() })
    .eq("household_id", householdId)
    .eq("type", type)
    .eq("dedupe_key", dedupeKey)
    .is("dismissed_at", null);
}