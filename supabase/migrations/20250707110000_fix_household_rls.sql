-- Fix: creator could INSERT household but not SELECT it back before membership exists.

drop policy if exists "Members can view their households" on public.households;

create policy "Members and creators can view households"
on public.households for select
using (
  public.is_household_member(id)
  or created_by = auth.uid()
);

drop policy if exists "Owners and admins can add members" on public.household_members;
drop policy if exists "Bootstrap owner membership" on public.household_members;

create policy "Owners and admins can add members"
on public.household_members for insert
with check (
  public.has_household_role(household_id, array['owner', 'admin']::public.household_role[])
  or (
    user_id = auth.uid()
    and role = 'owner'
    and exists (
      select 1
      from public.households h
      where h.id = household_id
        and h.created_by = auth.uid()
    )
    and not exists (
      select 1
      from public.household_members hm
      where hm.household_id = household_id
    )
  )
);