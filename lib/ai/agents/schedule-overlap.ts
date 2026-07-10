import { dismissInsightByDedupe, upsertInsight } from "@/lib/ai/insights";
import { createAdminClient } from "@/lib/supabase/admin";

type CalendarRow = {
  id: string;
  title: string;
  starts_at: string;
  ends_at: string;
  all_day: boolean;
};

function overlapKey(idA: string, idB: string) {
  return [idA, idB].sort().join(":");
}

function rangesOverlap(a: CalendarRow, b: CalendarRow) {
  if (a.all_day || b.all_day) {
    const aDay = a.starts_at.slice(0, 10);
    const bDay = b.starts_at.slice(0, 10);
    return aDay === bDay;
  }

  const aStart = new Date(a.starts_at).getTime();
  const aEnd = new Date(a.ends_at).getTime();
  const bStart = new Date(b.starts_at).getTime();
  const bEnd = new Date(b.ends_at).getTime();

  return aStart < bEnd && bStart < aEnd;
}

export async function runScheduleOverlapAgent(householdId: string) {
  const admin = createAdminClient();
  const rangeStart = new Date();
  rangeStart.setHours(0, 0, 0, 0);
  const rangeEnd = new Date(rangeStart);
  rangeEnd.setDate(rangeEnd.getDate() + 7);

  const { data: events } = await admin
    .from("calendar_events")
    .select("id, title, starts_at, ends_at, all_day")
    .eq("household_id", householdId)
    .lt("starts_at", rangeEnd.toISOString())
    .gt("ends_at", rangeStart.toISOString())
    .order("starts_at", { ascending: true });

  const rows = (events ?? []) as CalendarRow[];
  const seen = new Set<string>();
  const activeKeys = new Set<string>();
  let created = 0;

  for (let i = 0; i < rows.length; i += 1) {
    for (let j = i + 1; j < rows.length; j += 1) {
      const left = rows[i];
      const right = rows[j];
      if (!left || !right || !rangesOverlap(left, right)) {
        continue;
      }

      const key = overlapKey(left.id, right.id);
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);
      activeKeys.add(key);

      const startLabel = new Date(left.starts_at).toLocaleString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: left.all_day ? undefined : "numeric",
        minute: left.all_day ? undefined : "2-digit",
      });

      await upsertInsight({
        householdId,
        type: "schedule",
        dedupeKey: `overlap-${key}`,
        payload: {
          title: "Schedule overlap detected",
          body: `"${left.title}" and "${right.title}" overlap on ${startLabel}.`,
          actionHref: "/calendar",
          severity: "warning",
        },
      });
      created += 1;
    }
  }

  const { data: existingScheduleInsights } = await admin
    .from("ai_insights")
    .select("dedupe_key")
    .eq("household_id", householdId)
    .eq("type", "schedule")
    .like("dedupe_key", "overlap-%")
    .is("dismissed_at", null);

  for (const row of existingScheduleInsights ?? []) {
    const dedupeKey = row.dedupe_key as string | null;
    if (!dedupeKey) {
      continue;
    }
    const overlapId = dedupeKey.replace(/^overlap-/, "");
    if (!activeKeys.has(overlapId)) {
      await dismissInsightByDedupe(householdId, "schedule", dedupeKey);
    }
  }

  return { overlaps: created };
}