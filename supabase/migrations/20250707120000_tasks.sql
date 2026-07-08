-- M2: native task board + recurring templates

create type public.task_status as enum ('todo', 'in_progress', 'done', 'cancelled');
create type public.recurrence_cadence as enum ('daily', 'weekly', 'monthly');

create table public.recurring_task_templates (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  title text not null check (char_length(trim(title)) > 0),
  description text,
  default_assignee_id uuid references auth.users (id) on delete set null,
  cadence public.recurrence_cadence not null default 'weekly',
  day_of_week smallint check (day_of_week between 0 and 6),
  day_of_month smallint check (day_of_month between 1 and 28),
  is_active boolean not null default true,
  created_by uuid not null references auth.users (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  title text not null check (char_length(trim(title)) > 0),
  description text,
  status public.task_status not null default 'todo',
  assignee_id uuid references auth.users (id) on delete set null,
  due_at timestamptz,
  provenance jsonb not null default jsonb_build_object(
    'source', 'ntrr',
    'syncedAt', now(),
    'confidence', 'high',
    'lastModifiedBy', 'user'
  ),
  recurring_template_id uuid references public.recurring_task_templates (id) on delete set null,
  created_by uuid not null references auth.users (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index tasks_household_id_idx on public.tasks (household_id);
create index tasks_assignee_id_idx on public.tasks (assignee_id);
create index tasks_status_idx on public.tasks (status);
create index tasks_due_at_idx on public.tasks (due_at);
create index recurring_task_templates_household_id_idx on public.recurring_task_templates (household_id);

create trigger recurring_task_templates_set_updated_at
before update on public.recurring_task_templates
for each row execute function public.set_updated_at();

create trigger tasks_set_updated_at
before update on public.tasks
for each row execute function public.set_updated_at();

create trigger recurring_task_templates_audit
after insert or update or delete on public.recurring_task_templates
for each row execute function public.write_audit_log();

create trigger tasks_audit
after insert or update or delete on public.tasks
for each row execute function public.write_audit_log();

-- Extend audit trigger for tasks
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
    if tg_table_name in ('household_members', 'integration_accounts', 'invites', 'tasks', 'recurring_task_templates') then
      v_household_id := new.household_id;
    elsif tg_table_name = 'households' then
      v_household_id := new.id;
    end if;
  elsif tg_op = 'UPDATE' then
    v_action := 'update';
    v_entity_id := new.id;
    if tg_table_name in ('household_members', 'integration_accounts', 'invites', 'tasks', 'recurring_task_templates') then
      v_household_id := new.household_id;
    elsif tg_table_name = 'households' then
      v_household_id := new.id;
    end if;
  elsif tg_op = 'DELETE' then
    v_action := 'delete';
    v_entity_id := old.id;
    if tg_table_name in ('household_members', 'integration_accounts', 'invites', 'tasks', 'recurring_task_templates') then
      v_household_id := old.household_id;
    elsif tg_table_name = 'households' then
      v_household_id := old.id;
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

alter table public.recurring_task_templates enable row level security;
alter table public.tasks enable row level security;

-- Tasks: all members can view; caregivers+ can create/edit (not viewers)
create or replace function public.can_edit_tasks(target_household_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_household_role(
    target_household_id,
    array['owner', 'admin', 'caregiver']::public.household_role[]
  );
$$;

create policy "Members can view tasks"
on public.tasks for select
using (public.is_household_member(household_id));

create policy "Editors can create tasks"
on public.tasks for insert
with check (
  public.can_edit_tasks(household_id)
  and created_by = auth.uid()
);

create policy "Editors can update tasks"
on public.tasks for update
using (public.can_edit_tasks(household_id));

create policy "Editors can delete tasks"
on public.tasks for delete
using (public.can_edit_tasks(household_id));

create policy "Members can view recurring templates"
on public.recurring_task_templates for select
using (public.is_household_member(household_id));

create policy "Editors can manage recurring templates"
on public.recurring_task_templates for insert
with check (
  public.can_edit_tasks(household_id)
  and created_by = auth.uid()
);

create policy "Editors can update recurring templates"
on public.recurring_task_templates for update
using (public.can_edit_tasks(household_id));

create policy "Editors can delete recurring templates"
on public.recurring_task_templates for delete
using (public.can_edit_tasks(household_id));

-- Realtime
alter publication supabase_realtime add table public.tasks;