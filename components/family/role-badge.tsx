import { cn } from "@/lib/utils";
import type { HouseholdRole } from "@/lib/permissions/roles";

const roleStyles: Record<HouseholdRole, string> = {
  owner: "bg-primary/15 text-primary",
  admin: "bg-accent text-accent-foreground",
  caregiver: "bg-secondary text-secondary-foreground",
  viewer: "bg-muted text-muted-foreground",
};

export function RoleBadge({ role }: { role: HouseholdRole }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
        roleStyles[role],
      )}
    >
      {role}
    </span>
  );
}