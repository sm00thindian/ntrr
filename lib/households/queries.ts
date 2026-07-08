import { createClient } from "@/lib/supabase/server";
import type { HouseholdRole } from "@/lib/permissions/roles";

export type UserMembership = {
  householdId: string;
  role: HouseholdRole;
  householdName: string;
};

export type HouseholdMember = {
  id: string;
  userId: string;
  role: HouseholdRole;
  email: string;
  displayName: string | null;
  joinedAt: string;
};

export type PendingInvite = {
  id: string;
  email: string;
  role: HouseholdRole;
  expiresAt: string;
  createdAt: string;
  token: string;
};

export type FamilyStatus = {
  memberCount: number;
  pendingInviteCount: number;
  members: Array<{
    userId: string;
    email: string;
    role: HouseholdRole;
    isCurrentUser: boolean;
  }>;
};

export async function getUserMembership(userId: string): Promise<UserMembership | null> {
  const supabase = await createClient();

  const { data: members, error: memberError } = await supabase
    .from("household_members")
    .select("household_id, role")
    .eq("user_id", userId)
    .limit(1);

  if (memberError || !members?.length) {
    return null;
  }

  const member = members[0] as { household_id: string; role: HouseholdRole };

  const { data: household, error: householdError } = await supabase
    .from("households")
    .select("name")
    .eq("id", member.household_id)
    .limit(1);

  if (householdError || !household?.length) {
    return null;
  }

  const record = household[0] as { name: string };

  return {
    householdId: member.household_id,
    role: member.role,
    householdName: record.name,
  };
}

export async function getHouseholdMembers(householdId: string): Promise<HouseholdMember[]> {
  const supabase = await createClient();

  const { data: members, error } = await supabase
    .from("household_members")
    .select("id, user_id, role, created_at")
    .eq("household_id", householdId)
    .order("created_at", { ascending: true });

  if (error || !members?.length) {
    return [];
  }

  const userIds = members.map((m) => (m as { user_id: string }).user_id);

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, email, display_name")
    .in("id", userIds);

  const profileMap = new Map(
    (profiles ?? []).map((p) => {
      const row = p as { id: string; email: string; display_name: string | null };
      return [row.id, row] as const;
    }),
  );

  return members.map((m) => {
    const row = m as { id: string; user_id: string; role: HouseholdRole; created_at: string };
    const profile = profileMap.get(row.user_id);
    return {
      id: row.id,
      userId: row.user_id,
      role: row.role,
      email: profile?.email ?? "Unknown",
      displayName: profile?.display_name ?? null,
      joinedAt: row.created_at,
    };
  });
}

export async function getPendingInvites(householdId: string): Promise<PendingInvite[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("invites")
    .select("id, email, role, expires_at, created_at, token")
    .eq("household_id", householdId)
    .is("accepted_at", null)
    .is("revoked_at", null)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false });

  if (error || !data) {
    return [];
  }

  return data.map((row) => {
    const invite = row as {
      id: string;
      email: string;
      role: HouseholdRole;
      expires_at: string;
      created_at: string;
      token: string;
    };
    return {
      id: invite.id,
      email: invite.email,
      role: invite.role,
      expiresAt: invite.expires_at,
      createdAt: invite.created_at,
      token: invite.token,
    };
  });
}

export async function getInviteByToken(token: string) {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("get_invite_preview", {
    invite_token: token,
  });

  if (error || !data?.length) {
    return null;
  }

  const invite = data[0] as {
    id: string;
    household_id: string;
    household_name: string;
    email: string;
    role: HouseholdRole;
    expires_at: string;
    accepted_at: string | null;
    revoked_at: string | null;
  };

  return {
    id: invite.id,
    householdId: invite.household_id,
    householdName: invite.household_name,
    email: invite.email,
    role: invite.role,
    expiresAt: invite.expires_at,
    acceptedAt: invite.accepted_at,
    revokedAt: invite.revoked_at,
    isExpired: new Date(invite.expires_at) <= new Date(),
  };
}

export async function getFamilyStatus(
  householdId: string,
  currentUserId: string,
): Promise<FamilyStatus> {
  const [members, invites] = await Promise.all([
    getHouseholdMembers(householdId),
    getPendingInvites(householdId),
  ]);

  return {
    memberCount: members.length,
    pendingInviteCount: invites.length,
    members: members.map((m) => ({
      userId: m.userId,
      email: m.email,
      role: m.role,
      isCurrentUser: m.userId === currentUserId,
    })),
  };
}