-- M5: snooze + dedupe for AI insights

alter table public.ai_insights
  add column snoozed_until timestamptz,
  add column dedupe_key text;

create unique index ai_insights_active_dedupe_idx
  on public.ai_insights (household_id, type, dedupe_key)
  where dismissed_at is null and dedupe_key is not null;

create index ai_insights_snooze_idx
  on public.ai_insights (household_id, snoozed_until)
  where dismissed_at is null;