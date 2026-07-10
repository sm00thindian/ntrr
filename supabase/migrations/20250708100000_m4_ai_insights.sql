-- M4: AI insights slot (populated by M5 agents; empty state in M4)

create table public.ai_insights (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  type text not null check (char_length(trim(type)) > 0),
  payload jsonb not null default '{}'::jsonb,
  dismissed_at timestamptz,
  created_at timestamptz not null default now()
);

create index ai_insights_active_idx
  on public.ai_insights (household_id, created_at desc)
  where dismissed_at is null;

alter table public.ai_insights enable row level security;

create policy "Members can view household AI insights"
on public.ai_insights for select
using (public.is_household_member(household_id));

create policy "Members can dismiss AI insights"
on public.ai_insights for update
using (public.is_household_member(household_id))
with check (public.is_household_member(household_id));

grant select, update on public.ai_insights to authenticated;
grant select, insert, update, delete on public.ai_insights to service_role;