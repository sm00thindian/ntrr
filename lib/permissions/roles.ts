export const HOUSEHOLD_ROLES = ["owner", "admin", "caregiver", "viewer"] as const;

export type HouseholdRole = (typeof HOUSEHOLD_ROLES)[number];

export function canManageMembers(role: HouseholdRole): boolean {
  return role === "owner" || role === "admin";
}

export function canManageIntegrations(role: HouseholdRole): boolean {
  return role === "owner" || role === "admin";
}