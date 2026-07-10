-- Household-level calendar color and member assignment settings

alter table public.households
  add column if not exists calendar_settings jsonb not null default '{}'::jsonb;