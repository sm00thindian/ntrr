-- NTRR initial schema (M0)

create extension if not exists "pgcrypto";

-- Households
create table public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) > 0),
  created_by uuid not null references auth.users (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Household members
create type public.household_role as enum ('owner', 'admin', 'caregiver', 'viewer');

create table public.household_members (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.household_role not null default 'caregiver',
  created_at timestamptz not null default now(),
  unique (household_id, user_id)
);

-- Integration accounts (tokens stored in Supabase Vault / encrypted metadata in later milestones)
create type public.integration_provider as enum ('google', 'microsoft', 'apple_caldav', 'zapier');
create type public.integration_status as enum ('connected', 'disconnected', 'error', 'pending');

create table public.integration_accounts (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  provider public.integration_provider not null,
  status public.integration_status not null default 'pending',
  scopes text[],
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid not null references auth.users (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (household_id, provider)
);

-- Audit log
create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  household_id uuid references public.households (id) on delete set null,
  actor_id uuid references auth.users (id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index audit_log_household_id_idx on public.audit_log (household_id);
create index audit_log_created_at_idx on public.audit_log (created_at desc);

-- Updated-at trigger
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger households_set_updated_at
before update on public.households
for each row execute function public.set_updated_at();

create trigger integration_accounts_set_updated_at
before update on public.integration_accounts
for each row execute function public.set_updated_at();

-- Audit trigger helper
create or replace function public.write_audit_log()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_household_id uuid;
  v_actor_id uuid;
  v_entity_id uuid;
  v_action text;
begin
  v_actor_id := auth.uid();

  if tg_op = 'INSERT' then
    v_action := 'create';
    v_entity_id := new.id;
    if tg_table_name = 'household_members' then
      v_household_id := new.household_id;
    elsif tg_table_name = 'households' then
      v_household_id := new.id;
    elsif tg_table_name = 'integration_accounts' then
      v_household_id := new.household_id;
    end if;
  elsif tg_op = 'UPDATE' then
    v_action := 'update';
    v_entity_id := new.id;
    if tg_table_name = 'household_members' then
      v_household_id := new.household_id;
    elsif tg_table_name = 'households' then
      v_household_id := new.id;
    elsif tg_table_name = 'integration_accounts' then
      v_household_id := new.household_id;
    end if;
  elsif tg_op = 'DELETE' then
    v_action := 'delete';
    v_entity_id := old.id;
    if tg_table_name = 'household_members' then
      v_household_id := old.household_id;
    elsif tg_table_name = 'households' then
      v_household_id := old.id;
    elsif tg_table_name = 'integration_accounts' then
      v_household_id := old.household_id;
    end if;
  end if;

  insert into public.audit_log (household_id, actor_id, action, entity_type, entity_id, metadata)
  values (
    v_household_id,
    v_actor_id,
    v_action,
    tg_table_name,
    v_entity_id,
    case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end
  );

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create trigger households_audit
after insert or update or delete on public.households
for each row execute function public.write_audit_log();

create trigger household_members_audit
after insert or update or delete on public.household_members
for each row execute function public.write_audit_log();

create trigger integration_accounts_audit
after insert or update or delete on public.integration_accounts
for each row execute function public.write_audit_log();

-- RLS helpers
create or replace function public.is_household_member(target_household_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.household_members hm
    where hm.household_id = target_household_id
      and hm.user_id = auth.uid()
  );
$$;

create or replace function public.has_household_role(target_household_id uuid, allowed_roles public.household_role[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.household_members hm
    where hm.household_id = target_household_id
      and hm.user_id = auth.uid()
      and hm.role = any (allowed_roles)
  );
$$;

-- Enable RLS
alter table public.households enable row level security;
alter table public.household_members enable row level security;
alter table public.integration_accounts enable row level security;
alter table public.audit_log enable row level security;

-- Households policies
create policy "Members can view their households"
on public.households for select
using (public.is_household_member(id));

create policy "Authenticated users can create households"
on public.households for insert
with check (auth.uid() = created_by);

create policy "Owners and admins can update households"
on public.households for update
using (public.has_household_role(id, array['owner', 'admin']::public.household_role[]));

-- Household members policies
create policy "Members can view household members"
on public.household_members for select
using (public.is_household_member(household_id));

create policy "Owners and admins can add members"
on public.household_members for insert
with check (
  public.has_household_role(household_id, array['owner', 'admin']::public.household_role[])
  or (
    user_id = auth.uid()
    and role = 'owner'
    and not exists (
      select 1 from public.household_members hm where hm.household_id = household_members.household_id
    )
  )
);

create policy "Owners and admins can update members"
on public.household_members for update
using (public.has_household_role(household_id, array['owner', 'admin']::public.household_role[]));

create policy "Owners and admins can remove members"
on public.household_members for delete
using (public.has_household_role(household_id, array['owner', 'admin']::public.household_role[]));

-- Integration accounts policies
create policy "Members can view integrations"
on public.integration_accounts for select
using (public.is_household_member(household_id));

create policy "Owners and admins can manage integrations"
on public.integration_accounts for insert
with check (
  public.has_household_role(household_id, array['owner', 'admin']::public.household_role[])
  and created_by = auth.uid()
);

create policy "Owners and admins can update integrations"
on public.integration_accounts for update
using (public.has_household_role(household_id, array['owner', 'admin']::public.household_role[]));

create policy "Owners and admins can delete integrations"
on public.integration_accounts for delete
using (public.has_household_role(household_id, array['owner', 'admin']::public.household_role[]));

-- Audit log policies (read-only for members)
create policy "Members can view household audit log"
on public.audit_log for select
using (
  household_id is null
  or public.is_household_member(household_id)
);