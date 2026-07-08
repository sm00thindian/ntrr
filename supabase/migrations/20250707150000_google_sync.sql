-- M3: Google sync tables — calendar events, mappings, outbox, conflicts

create type public.sync_entity_type as enum ('task', 'calendar_event');
create type public.sync_outbox_status as enum ('pending', 'processing', 'done', 'failed');
create type public.sync_outbox_operation as enum ('create', 'update', 'delete');
create type public.sync_conflict_status as enum ('pending', 'resolved');
create type public.sync_conflict_resolution as enum ('keep_local', 'keep_remote', 'merged');

create table public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  title text not null check (char_length(trim(title)) > 0),
  description text,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  all_day boolean not null default false,
  location text,
  provenance jsonb not null default jsonb_build_object(
    'source', 'ntrr',
    'syncedAt', now(),
    'confidence', 'high',
    'lastModifiedBy', 'user'
  ),
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.sync_mappings (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  provider public.integration_provider not null,
  entity_type public.sync_entity_type not null,
  ntrr_id uuid not null,
  external_id text not null,
  external_etag text,
  external_updated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (household_id, provider, entity_type, external_id),
  unique (household_id, provider, entity_type, ntrr_id)
);

create table public.sync_outbox (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  provider public.integration_provider not null,
  entity_type public.sync_entity_type not null,
  entity_id uuid not null,
  operation public.sync_outbox_operation not null,
  payload jsonb not null default '{}'::jsonb,
  status public.sync_outbox_status not null default 'pending',
  attempts integer not null default 0 check (attempts >= 0),
  last_error text,
  scheduled_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index sync_outbox_pending_idx
  on public.sync_outbox (scheduled_at)
  where status = 'pending';

create table public.sync_conflicts (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  provider public.integration_provider not null,
  entity_type public.sync_entity_type not null,
  entity_id uuid not null,
  field_name text not null,
  local_value jsonb,
  remote_value jsonb,
  status public.sync_conflict_status not null default 'pending',
  resolution public.sync_conflict_resolution,
  resolved_by uuid references auth.users (id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

create index sync_conflicts_pending_idx
  on public.sync_conflicts (household_id)
  where status = 'pending';

-- updated_at triggers
create trigger calendar_events_set_updated_at
before update on public.calendar_events
for each row execute function public.set_updated_at();

create trigger sync_mappings_set_updated_at
before update on public.sync_mappings
for each row execute function public.set_updated_at();

create trigger sync_outbox_set_updated_at
before update on public.sync_outbox
for each row execute function public.set_updated_at();

-- RLS
alter table public.calendar_events enable row level security;
alter table public.sync_mappings enable row level security;
alter table public.sync_outbox enable row level security;
alter table public.sync_conflicts enable row level security;

create policy "Members can view calendar events"
on public.calendar_events for select
using (public.is_household_member(household_id));

create policy "Caregivers can manage calendar events"
on public.calendar_events for insert
with check (
  public.has_household_role(household_id, array['owner', 'admin', 'caregiver']::public.household_role[])
  and created_by = auth.uid()
);

create policy "Caregivers can update calendar events"
on public.calendar_events for update
using (public.has_household_role(household_id, array['owner', 'admin', 'caregiver']::public.household_role[]));

create policy "Caregivers can delete calendar events"
on public.calendar_events for delete
using (public.has_household_role(household_id, array['owner', 'admin', 'caregiver']::public.household_role[]));

create policy "Members can view sync mappings"
on public.sync_mappings for select
using (public.is_household_member(household_id));

create policy "Admins can manage sync mappings"
on public.sync_mappings for all
using (public.has_household_role(household_id, array['owner', 'admin']::public.household_role[]))
with check (public.has_household_role(household_id, array['owner', 'admin']::public.household_role[]));

create policy "Members can view sync outbox"
on public.sync_outbox for select
using (public.is_household_member(household_id));

create policy "Admins can manage sync outbox"
on public.sync_outbox for all
using (public.has_household_role(household_id, array['owner', 'admin']::public.household_role[]))
with check (public.has_household_role(household_id, array['owner', 'admin']::public.household_role[]));

create policy "Members can view sync conflicts"
on public.sync_conflicts for select
using (public.is_household_member(household_id));

create policy "Caregivers can resolve sync conflicts"
on public.sync_conflicts for update
using (public.has_household_role(household_id, array['owner', 'admin', 'caregiver']::public.household_role[]));

create policy "Admins can insert sync conflicts"
on public.sync_conflicts for insert
with check (public.has_household_role(household_id, array['owner', 'admin']::public.household_role[]));

grant select, insert, update, delete on public.calendar_events to authenticated;
grant select, insert, update, delete on public.sync_mappings to authenticated;
grant select, insert, update, delete on public.sync_outbox to authenticated;
grant select, insert, update, delete on public.sync_conflicts to authenticated;