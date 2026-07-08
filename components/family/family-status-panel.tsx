import Link from "next/link";

import { RoleBadge } from "@/components/family/role-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { FamilyStatus } from "@/lib/households/queries";

export function FamilyStatusPanel({ status }: { status: FamilyStatus }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
        <div>
          <CardTitle>Family status</CardTitle>
          <CardDescription>
            {status.memberCount} member{status.memberCount === 1 ? "" : "s"}
            {status.pendingInviteCount > 0
              ? ` · ${status.pendingInviteCount} pending invite${status.pendingInviteCount === 1 ? "" : "s"}`
              : ""}
          </CardDescription>
        </div>
        <Button asChild variant="outline" size="sm" className="shrink-0">
          <Link href="/family">Manage</Link>
        </Button>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {status.members.map((member) => (
            <li
              key={member.userId}
              className="flex items-center justify-between gap-2 rounded-md border px-3 py-2"
            >
              <span className="truncate text-sm">
                {member.email}
                {member.isCurrentUser ? (
                  <span className="text-muted-foreground"> (you)</span>
                ) : null}
              </span>
              <RoleBadge role={member.role} />
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}