import type { AiInsight, InsightPayload, InsightType } from "@/lib/ai/types";
import { createClient } from "@/lib/supabase/server";

function mapInsight(row: {
  id: string;
  household_id: string;
  type: string;
  dedupe_key: string | null;
  payload: unknown;
  snoozed_until: string | null;
  created_at: string;
}): AiInsight {
  const payload = (row.payload ?? {}) as InsightPayload;

  return {
    id: row.id,
    householdId: row.household_id,
    type: row.type as InsightType,
    dedupeKey: row.dedupe_key,
    title: payload.title ?? row.type,
    body: payload.body ?? null,
    actionHref: payload.actionHref ?? null,
    severity: payload.severity ?? "info",
    snoozedUntil: row.snoozed_until,
    createdAt: row.created_at,
  };
}

export async function getActiveAiInsights(householdId: string): Promise<AiInsight[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("ai_insights")
    .select("id, household_id, type, dedupe_key, payload, snoozed_until, created_at")
    .eq("household_id", householdId)
    .is("dismissed_at", null)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error || !data) {
    return [];
  }

  return data
    .filter(
      (row) =>
        !row.snoozed_until || new Date(row.snoozed_until as string).getTime() <= Date.now(),
    )
    .slice(0, 8)
    .map((row) => mapInsight(row as Parameters<typeof mapInsight>[0]));
}