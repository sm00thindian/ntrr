-- Reliable household bootstrap via security definer RPC.
-- Avoids RLS edge cases when server actions pass JWT inconsistently.

create or replace function public.create_household(household_name text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_household_id uuid;
  v_email text;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if char_length(trim(household_name)) = 0 then
    raise exception 'Household name is required';
  end if;

  if exists (select 1 from public.household_members where user_id = v_user_id) then
    raise exception 'You already belong to a household';
  end if;

  insert into public.households (name, created_by)
  values (trim(household_name), v_user_id)
  returning id into v_household_id;

  insert into public.household_members (household_id, user_id, role)
  values (v_household_id, v_user_id, 'owner');

  select email into v_email from auth.users where id = v_user_id;
  if v_email is not null then
    insert into public.profiles (id, email)
    values (v_user_id, lower(v_email))
    on conflict (id) do update set email = excluded.email, updated_at = now();
  end if;

  return v_household_id;
end;
$$;

revoke all on function public.create_household(text) from public;
grant execute on function public.create_household(text) to authenticated;