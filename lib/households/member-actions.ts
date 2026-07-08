"use server";

import { revalidatePath } from "next/cache";

import { requireHouseholdContext } from "@/lib/households/context";
import { canManageMembers } from "@/lib/permissions/roles";
import { createClient } from "@/lib/supabase/server";
import type { HouseholdRole } from "@/lib/permissions/roles";
import { HOUSEHOLD_ROLES } from "@/lib/permissions/roles";

export async function updateMemberRole(memberId: string, role: HouseholdRole) {
  const ctx = await requireHouseholdContext();

  if (!canManageMembers(ctx.role)) {
    return { error: "You do not have permission to change roles." };
  }

  if (!HOUSEHOLD_ROLES.includes(role)) {
    return { error: "Invalid role." };
  }

  if (role === "owner") {
    return { error: "Transferring ownership is not supported yet." };
  }

  const supabase = await createClient();

  const { data: target, error: fetchError } = await supabase
    .from("household_members")
    .select("id, user_id, role")
    .eq("id", memberId)
    .eq("household_id", ctx.householdId)
    .maybeSingle();

  if (fetchError || !target) {
    return { error: "Member not found." };
  }

  const member = target as { id: string; user_id: string; role: HouseholdRole };

  if (member.role === "owner") {
    return { error: "Cannot change the owner's role." };
  }

  const { error } = await supabase
    .from("household_members")
    .update({ role })
    .eq("id", memberId)
    .eq("household_id", ctx.householdId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/family");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function removeMember(memberId: string) {
  const ctx = await requireHouseholdContext();

  if (!canManageMembers(ctx.role)) {
    return { error: "You do not have permission to remove members." };
  }

  const supabase = await createClient();

  const { data: target, error: fetchError } = await supabase
    .from("household_members")
    .select("id, user_id, role")
    .eq("id", memberId)
    .eq("household_id", ctx.householdId)
    .maybeSingle();

  if (fetchError || !target) {
    return { error: "Member not found." };
  }

  const member = target as { id: string; user_id: string; role: HouseholdRole };

  if (member.role === "owner") {
    return { error: "Cannot remove the household owner." };
  }

  if (member.user_id === ctx.userId) {
    return { error: "You cannot remove yourself. Ask another admin." };
  }

  const { error } = await supabase
    .from("household_members")
    .delete()
    .eq("id", memberId)
    .eq("household_id", ctx.householdId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/family");
  revalidatePath("/dashboard");
  return { success: true };
}