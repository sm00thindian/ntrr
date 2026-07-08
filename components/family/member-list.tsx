"use client";

import { useState, useTransition } from "react";

import { RoleBadge } from "@/components/family/role-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { removeMember, updateMemberRole } from "@/lib/households/member-actions";
import type { HouseholdMember } from "@/lib/households/queries";
import { canManageMembers } from "@/lib/permissions/roles";
import type { HouseholdRole } from "@/lib/permissions/roles";
import { HOUSEHOLD_ROLES } from "@/lib/permissions/roles";

const EDITABLE_ROLES = HOUSEHOLD_ROLES.filter((r) => r !== "owner");

type MemberListProps = {
  members: HouseholdMember[];
  currentUserId: string;
  currentUserRole: HouseholdRole;
};

export function MemberList({ members, currentUserId, currentUserRole }: MemberListProps) {
  const canManage = canManageMembers(currentUserRole);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Members ({members.length})</CardTitle>
        <CardDescription>People with access to this household.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <ul className="divide-y rounded-lg border">
          {members.map((member) => {
            const isSelf = member.userId === currentUserId;
            const canEdit = canManage && member.role !== "owner" && !isSelf;

            return (
              <li
                key={member.id}
                className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 space-y-1">
                  <p className="truncate font-medium">
                    {member.displayName ?? member.email}
                    {isSelf ? <span className="text-muted-foreground"> (you)</span> : null}
                  </p>
                  <p className="truncate text-sm text-muted-foreground">{member.email}</p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {canEdit ? (
                    <select
                      defaultValue={member.role}
                      disabled={pending}
                      className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                      onChange={(e) => {
                        setError(null);
                        startTransition(async () => {
                          const result = await updateMemberRole(
                            member.id,
                            e.target.value as HouseholdRole,
                          );
                          if (result?.error) {
                            setError(result.error);
                          }
                        });
                      }}
                    >
                      {EDITABLE_ROLES.map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <RoleBadge role={member.role} />
                  )}

                  {canEdit ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={pending}
                      onClick={() => {
                        setError(null);
                        startTransition(async () => {
                          const result = await removeMember(member.id);
                          if (result?.error) {
                            setError(result.error);
                          }
                        });
                      }}
                    >
                      Remove
                    </Button>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>

        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}