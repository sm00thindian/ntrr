import { dismissInsightByDedupe, upsertInsight } from "@/lib/ai/insights";
import { getPendingConflictCount } from "@/lib/sync/conflict";

const DEDUPE_KEY = "pending-conflicts";

export async function runConflictDetectorAgent(householdId: string) {
  const count = await getPendingConflictCount(householdId);

  if (count === 0) {
    await dismissInsightByDedupe(householdId, "conflict", DEDUPE_KEY);
    return { created: false, count: 0 };
  }

  await upsertInsight({
    householdId,
    type: "conflict",
    dedupeKey: DEDUPE_KEY,
    payload: {
      title: `${count} sync conflict${count === 1 ? "" : "s"} need your review`,
      body: "Google and NTRR disagree on some task or event fields. Pick which version to keep.",
      actionHref: "/conflicts",
      severity: "warning",
    },
  });

  return { created: true, count };
}