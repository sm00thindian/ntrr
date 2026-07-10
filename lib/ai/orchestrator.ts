import { runConflictDetectorAgent } from "@/lib/ai/agents/conflict-detector";
import { runReminderSuggesterAgent } from "@/lib/ai/agents/reminder-suggester";
import { runScheduleOverlapAgent } from "@/lib/ai/agents/schedule-overlap";
import type { AgentRunMode } from "@/lib/ai/types";
import { createAdminClient } from "@/lib/supabase/admin";

export async function runAgentsForHousehold(householdId: string, mode: AgentRunMode) {
  const conflict = await runConflictDetectorAgent(householdId);

  const results: Record<string, unknown> = { conflict };

  if (mode === "daily") {
    results.reminder = await runReminderSuggesterAgent(householdId);
    results.schedule = await runScheduleOverlapAgent(householdId);
  } else {
    results.schedule = await runScheduleOverlapAgent(householdId);
  }

  return results;
}

export async function runPostSyncAgents(householdId: string) {
  return runAgentsForHousehold(householdId, "post-sync");
}

export async function runDailyDigest() {
  const admin = createAdminClient();

  const { data: households, error } = await admin.from("households").select("id");

  if (error) {
    throw new Error(error.message);
  }

  const results = [];

  for (const household of households ?? []) {
    const householdId = household.id as string;
    const agents = await runAgentsForHousehold(householdId, "daily");
    results.push({ householdId, agents });
  }

  return results;
}